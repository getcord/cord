import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import type {
  HighlightedTextConfig,
  MessageAnnotation,
  UUID,
} from 'common/types/index.ts';
import { LocationMatch } from 'common/types/index.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { AnnotationPointer } from 'external/src/delegate/components/AnnotationPointer.tsx';
import { Overlay } from 'external/src/delegate/components/Overlay.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  FAST_ANNOTATION_LOCATION_MATCH_INTERVAL_MS,
  UNDO_HIDE_HOTSPOT_ANNOTATION_TIMEOUT_SECONDS,
} from 'common/const/Timing.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import type { AnnotationPosition } from 'external/src/delegate/annotations/types.ts';
import { containerSelector } from 'external/src/delegate/annotations/types.ts';
import type { AnnotationOnPage } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { ActionBox } from 'external/src/delegate/components/ActionBox.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useSetTimeout } from 'external/src/delegate/hooks/useSetTimeout.ts';
import { useDocumentVisibility } from 'external/src/effects/useDocumentVisibility.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { useAnnotationPositionUpdater } from 'external/src/delegate/hooks/useAnnotationPositionUpdater.ts';
import { REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME } from 'common/const/Strings.ts';
import { MONACO_SELECTORS } from 'external/src/delegate/annotations/util.ts';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { getHighlightedTextConfigFromAnnotation } from 'external/src/lib/util.ts';
import { FloatingThread } from 'sdk/client/core/react/FloatingThread.tsx';
import { FloatingThreadsContext } from 'external/src/context/floatingThreads/FloatingThreadsContext.ts';

let analyticsSent = false;
export const validPinnedAnnotationMatchTypes = [
  LocationMatch.EXACT,
  LocationMatch.SIBLING,
];
const stalePinnedAnnotationMatchTypes = [
  LocationMatch.STALE,
  LocationMatch.MAYBE_STALE,
  LocationMatch.CHART,
  LocationMatch.MULTIMEDIA,
];

type Positions = {
  [annotationID in UUID]: {
    positionInfo: AnnotationPosition;
    highlightedTextConfig: HighlightedTextConfig | null;
    matchType: LocationMatch;
  };
};

type Props = {
  allowHidingAnnotations?: boolean;
  hideStaleAnnotations?: boolean;
  showFloatingThreads?: boolean;
};

export function PinnedAnnotationPointers({
  allowHidingAnnotations = true,
  hideStaleAnnotations = true,
  showFloatingThreads = false,
}: Props) {
  const {
    state: {
      annotationsVisible: nonHotspotAnnotationsVisible,
      annotationArrow,
      thirdPartyObjects,
    },
  } = useContextThrowingIfNoProvider(DelegateContext);

  const { logEvent } = useLogger();

  // For avoiding memory leak error from calling setAnnotationPositions after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { annotationSetID, addAnnotationToPage } =
    useContextThrowingIfNoProvider(AnnotationsOnPageContext);
  const openThreadID = useContextThrowingIfNoProvider(FloatingThreadsContext)
    ?.openThreadID;
  const { isAnnotationOnPage, getAnnotationPinsToRender } =
    useContextThrowingIfNoProvider(PinnedAnnotationsContext);

  // Pinned annotations not hidden by user (or empty array if feature turned off)
  const annotationsOnPage = useMemo(
    () => getAnnotationPinsToRender(annotationSetID),
    [getAnnotationPinsToRender, annotationSetID],
  );

  const {
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  useEffect(() => {
    annotationsOnPage.map((a) => requestUsers(a.sourceID));
  }, [annotationsOnPage, requestUsers]);

  // Use refs so to avoid calculate/updateAnnotationPositions redefining
  // This would mount and unmount our scroll/resize listeners each time
  const annotationsVisibleRef = useUpdatingRef(annotationsOnPage);
  const annotationArrowRef = useUpdatingRef(annotationArrow);

  const {
    getAnnotationPosition: getCustomAnnotationPosition,
    getAnnotationPositionStrict: getCustomAnnotationPositionStrict,
  } = useContextThrowingIfNoProvider(AnnotationSDKContext);

  const matchTypesToCheckAgainst = useMemo(
    () =>
      hideStaleAnnotations
        ? validPinnedAnnotationMatchTypes
        : [
            ...validPinnedAnnotationMatchTypes,
            ...stalePinnedAnnotationMatchTypes,
          ],
    [hideStaleAnnotations],
  );

  // Recalculate all visible annotation positions
  // We update positions when:
  // 1) User scrolls
  // 2) User resizes the window
  // 3) An annotation is added or removed
  const updateAnnotationPositions = useCallback(async () => {
    const positions: Positions = {};
    const promises: Array<
      Promise<
        [
          MessageAnnotation | AnnotationOnPage,
          AnnotationPosition | null,
          LocationMatch,
        ]
      >
    > = [];
    for (const annotation of annotationsVisibleRef.current) {
      const annotationInstance = createAnnotationInstance({
        annotation,
        thirdPartyObjects,
        getAnnotationPosition: hideStaleAnnotations
          ? getCustomAnnotationPosition
          : // Sometimes we mark custom annotations which we know are not
            // on screen as "maybe stale".
            // Here we skip this behaviour, since annotations that are not
            // on screen should not be rendered even for floating threads.
            getCustomAnnotationPositionStrict,
      });

      promises.push(
        Promise.all([
          Promise.resolve(annotation),
          annotationInstance.getPosition(),
          annotationInstance.getMatchType(),
        ]),
      );
    }

    const resolvedPromises = await Promise.allSettled(promises);
    for (const result of resolvedPromises) {
      if (result.status === 'rejected') {
        continue;
      }
      const [annotation, positionInfo, matchType] = result.value;
      if (!positionInfo) {
        continue;
      }

      const isStaleHotspotAnnotation =
        isAnnotationOnPage(annotationSetID, annotation.id) &&
        !matchTypesToCheckAgainst.includes(matchType);
      if (isStaleHotspotAnnotation) {
        continue;
      }
      positions[annotation.id] = {
        positionInfo,
        highlightedTextConfig:
          getHighlightedTextConfigFromAnnotation(annotation),
        matchType,
      };
    }

    if (!analyticsSent) {
      const numOfVisibleAnnotationsOnPage = Object.keys(positions).length;
      if (numOfVisibleAnnotationsOnPage) {
        logEvent('hotspot-annotations-on-page', {
          total: numOfVisibleAnnotationsOnPage,
        });
        analyticsSent = true;
      }
    }

    if (mountedRef.current) {
      setAnnotationPositions(positions);
    }
  }, [
    annotationsVisibleRef,
    thirdPartyObjects,
    hideStaleAnnotations,
    getCustomAnnotationPosition,
    getCustomAnnotationPositionStrict,
    isAnnotationOnPage,
    annotationSetID,
    matchTypesToCheckAgainst,
    logEvent,
  ]);

  useAnnotationPositionUpdater(
    updateAnnotationPositions,
    annotationArrowRef.current,
  );

  const [annotationPositions, setAnnotationPositions] = useState<Positions>({});

  // Re-initialise in effect to give documentMutator a chance to finish. Without
  // this, annotations visible (in draft message) show in wrong position when
  // reopening sidebar (which causes this component to remount)
  useEffect(() => {
    void updateAnnotationPositions();

    window.addEventListener(
      REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      updateAnnotationPositions,
    );

    return () =>
      window.removeEventListener(
        REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME,
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        updateAnnotationPositions,
      );
  }, [updateAnnotationPositions]);

  const documentVisible = useDocumentVisibility();

  useEffect(() => {
    if (documentVisible) {
      // Update position periodically to keep it up-to-date. e.g. user might
      // have pressed a button that changes the UI, and pointer now in wrong place
      const interval = setInterval(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        updateAnnotationPositions,
        FAST_ANNOTATION_LOCATION_MATCH_INTERVAL_MS,
      );
      return () => clearInterval(interval);
    }
    return;
  }, [documentVisible, updateAnnotationPositions]);

  //  Monaco editor doesn't trigger scroll events. To update annotations
  //  placed on it, we instead listen for attribute changes, as `styles.top`
  //  changes when scrolling.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      void updateAnnotationPositions();
    });
    for (const annotation of Object.values(annotationsVisibleRef.current)) {
      const monacoAnnotation =
        annotation.location?.additionalTargetData?.targetType ===
        'monacoEditor';
      if (!monacoAnnotation) {
        continue;
      }

      const target = document.querySelector(
        containerSelector(
          annotation.location?.additionalTargetData?.monacoEditor?.monacoID ??
            '',
        ) +
          ' ' +
          MONACO_SELECTORS.linesContainer,
      );
      if (target) {
        observer.observe(target, { childList: true });
      }
    }

    return () => observer.disconnect();
  }, [annotationsVisibleRef, updateAnnotationPositions]);

  const prevAnnotationsVisibleRef = useRef(annotationsOnPage);
  useEffect(() => {
    if (annotationsOnPage !== prevAnnotationsVisibleRef.current) {
      void updateAnnotationPositions();
    }
    prevAnnotationsVisibleRef.current = annotationsOnPage;
  }, [annotationsOnPage, updateAnnotationPositions]);

  // Annotation pointers scale to zero on unmount. Wait until last annotation
  // animated out to render null
  const [exitAnimationComplete, setExitAnimationComplete] = useState(true);
  useEffect(() => {
    if (annotationsOnPage.length) {
      setExitAnimationComplete(false);
    }
  }, [annotationsOnPage.length]);

  // As the annotation annotates out, annotation will not be in either list
  // In this case we set isHotspotAnnotation to the previous value
  const prevIsHotspotAnnotationValuesRef = useRef<{
    [annotationId: UUID]: boolean;
  }>({});
  const isHotspotAnnotation = useCallback(
    (id: UUID) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      let isHotspotAnnotation: boolean | null = null;
      if (nonHotspotAnnotationsVisible[id]) {
        isHotspotAnnotation = false;
      } else if (
        isAnnotationOnPage(annotationSetID, id) &&
        matchTypesToCheckAgainst.includes(annotationPositions[id].matchType)
      ) {
        isHotspotAnnotation = true;
      }
      if (isHotspotAnnotation === null) {
        // Annotation is animating out - return previous value
        return prevIsHotspotAnnotationValuesRef.current[id];
      }
      prevIsHotspotAnnotationValuesRef.current[id] = isHotspotAnnotation;
      return isHotspotAnnotation;
    },
    [
      annotationPositions,
      annotationSetID,
      isAnnotationOnPage,
      matchTypesToCheckAgainst,
      nonHotspotAnnotationsVisible,
    ],
  );

  const [hiddenAnnotation, setHiddenAnnotation] = useState<
    AnnotationOnPage | undefined
  >();
  const clearHiddenAnnotation = useSetTimeout(
    () => setHiddenAnnotation(undefined),
    UNDO_HIDE_HOTSPOT_ANNOTATION_TIMEOUT_SECONDS * 1000,
  );
  const handleSetHiddenAnnotation = useCallback(
    (annotation: AnnotationOnPage | undefined) => {
      setHiddenAnnotation(annotation);
      clearHiddenAnnotation();
    },
    [clearHiddenAnnotation],
  );

  const handleUndo = useCallback(() => {
    if (hiddenAnnotation) {
      addAnnotationToPage(hiddenAnnotation);
      setHiddenAnnotation(undefined);
    }
  }, [addAnnotationToPage, hiddenAnnotation]);

  if (!annotationsOnPage.length && exitAnimationComplete && !hiddenAnnotation) {
    return null;
  }

  return (
    <Overlay
      allowPointerEvents={false}
      withoutSidebar={true}
      zIndexLayer="annotation"
    >
      {/* Note - AnnotationPointer must be direct child of AnimatePresence for it to work */}
      <AnimatePresence onExitComplete={() => setExitAnimationComplete(true)}>
        {Object.entries(annotationPositions).map(
          ([id, { positionInfo, highlightedTextConfig }]) => {
            const annotationOnPage = annotationsOnPage.find((a) => a.id === id);
            // An annotation in a new thread will momentarily be optimistically
            // rendered on message send - in this case don't pass the threadID
            // because it doesn't exist in the DB yet and the query in AnnotationPointer
            // will throw an error
            const threadID = annotationOnPage?.isDraftThread
              ? undefined
              : annotationOnPage?.threadID;

            return (
              <AnnotationPointerWrapper
                key={id}
                annotation={annotationOnPage}
                threadID={threadID}
                highlightedTextConfig={highlightedTextConfig}
                positionInfo={positionInfo}
                isHotspotAnnotation={isHotspotAnnotation(id)}
                setHiddenAnnotation={handleSetHiddenAnnotation}
                allowHiding={allowHidingAnnotations}
                hasOpenThread={openThreadID === threadID}
                showFloatingThreads={showFloatingThreads}
              />
            );
          },
        )}
        {hiddenAnnotation && (
          <ActionBox
            actionText="Undo"
            actionCallback={handleUndo}
            text="Annotation hidden"
            center
          />
        )}
      </AnimatePresence>
    </Overlay>
  );
}

type AnnotationPointerWrapperProps = {
  threadID: string | undefined;
  annotation: AnnotationOnPage | undefined;
  positionInfo: AnnotationPosition;
  highlightedTextConfig: HighlightedTextConfig | null;
  isHotspotAnnotation: boolean;
  setHiddenAnnotation: (a: AnnotationOnPage | undefined) => void;
  showFloatingThreads: boolean;
  allowHiding: boolean;
  hasOpenThread: boolean;
};
function AnnotationPointerWrapper({
  threadID,
  annotation,
  positionInfo,
  highlightedTextConfig,
  isHotspotAnnotation,
  setHiddenAnnotation,
  showFloatingThreads,
  allowHiding,
  hasOpenThread,
}: AnnotationPointerWrapperProps) {
  const pinRef = useRef(null);
  return (
    <AnnotationPointer
      forwardRef={pinRef}
      annotation={annotation}
      threadID={threadID}
      highlightedTextConfig={highlightedTextConfig}
      positionVsViewport={{
        x: positionInfo.xVsViewport,
        y: positionInfo.yVsViewport,
      }}
      isHotspotAnnotation={isHotspotAnnotation}
      setHiddenAnnotation={setHiddenAnnotation}
      hidden={!positionInfo.visible && !showFloatingThreads}
      allowHiding={allowHiding}
      isInDraftState={false}
      hasOpenThread={hasOpenThread}
    >
      {showFloatingThreads && threadID && (
        <FloatingThread
          threadID={threadID}
          annotationPosition={positionInfo}
          pinRef={pinRef}
        />
      )}
    </AnnotationPointer>
  );
}
