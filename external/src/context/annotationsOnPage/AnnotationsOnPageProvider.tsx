import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unique } from 'radash';
import { v4 as uuid } from 'uuid';

import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { DISABLE_HOTSPOT_ANNOTATIONS } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import type { AnnotationsOnPageQueryResult } from 'external/src/graphql/operations.ts';
import {
  useAnnotationsOnPageQuery,
  useAnnotationsOnPageSubscription,
  useSetAnnotationVisibleMutation,
} from 'external/src/graphql/operations.ts';
import type {
  AnnotationOnPage,
  AnnotationsOnPageContextType,
} from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import type { UUID } from 'common/types/index.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import type { Location } from '@cord-sdk/types';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { doNothing } from 'external/src/lib/util.ts';
import { AnnotationsConfigContext } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

type UpdateAnnotationsFn = (args: {
  allAnnotations: AnnotationOnPage[];
  hiddenAnnotationIDs: UUID[] | Set<UUID>;
}) => void;

export function AnnotationsOnPageProvider({
  // TODO A new query will be available in PR #1443, which will allow
  // us to fetch annotations at a more granular location. Until then,
  // we simply pass a `location` as prop. (Also see comment on #2145)
  location,
  includeDeleted = false,
  children,
}: React.PropsWithChildren<{
  location?: Location;
  includeDeleted?: boolean;
}>) {
  const pageContext = useContextThrowingIfNoProvider(PageContext);
  const { addAnnotationSet, removeAnnotationSet } =
    useContextThrowingIfNoProvider(PinnedAnnotationsContext);
  const { logEvent } = useLogger();

  const [disableHotspotAnnotations] = usePreference(
    DISABLE_HOTSPOT_ANNOTATIONS,
  );

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const [allAnnotations, setAllAnnotations] = useState<AnnotationOnPage[]>([]);
  const [hiddenAnnotationIDs, setHiddenAnnotationIds] = useState<Set<UUID>>(
    new Set(),
  );

  const updateAnnotations = useCallback<UpdateAnnotationsFn>(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    ({ allAnnotations, hiddenAnnotationIDs }) => {
      setAllAnnotations(allAnnotations);
      setHiddenAnnotationIds(new Set(hiddenAnnotationIDs));
    },
    [],
  );

  const { onLocalAddOrRemove } = useLocalUpdateSyncer({
    allAnnotations,
    hiddenAnnotationIDs,
    updateAnnotations,
  });

  const { enableAnnotations } =
    useContextThrowingIfNoProvider(ConfigurationContext);

  const { showPinsOnPage } = useContextThrowingIfNoProvider(
    AnnotationsConfigContext,
  );

  const shouldSkipQueryAnnotations =
    showPinsOnPage === false ||
    !enableAnnotations ||
    !pageContext ||
    disableHotspotAnnotations;

  const contextLocation = location
    ? { data: location, providerID: null }
    : pageContext!; // Assertion is fine because we skip the query if !pageContext

  const { data } = useAnnotationsOnPageQuery({
    skip: shouldSkipQueryAnnotations,
    variables: {
      pageContext: contextLocation,
      includeDeleted,
      _externalOrgID: organization?.externalID,
    },
  });

  const { data: subscriptionData } = useAnnotationsOnPageSubscription({
    skip: shouldSkipQueryAnnotations,
    variables: {
      pageContext: contextLocation,
      includeDeleted,
      _externalOrgID: organization?.externalID,
    },
  });

  useEffect(() => {
    if (data) {
      updateAnnotations(cleanResponse(data.annotationsOnPage));
    }
  }, [data, updateAnnotations]);

  useEffect(() => {
    if (subscriptionData) {
      updateAnnotations(
        cleanResponse(subscriptionData.annotationsOnPageUpdated),
      );
    }
  }, [subscriptionData, updateAnnotations]);

  const annotationsOnPage = useMemo(() => {
    if (disableHotspotAnnotations) {
      return [];
    }
    return allAnnotations.filter(
      (annotation) => !hiddenAnnotationIDs.has(annotation.id),
    );
  }, [allAnnotations, hiddenAnnotationIDs, disableHotspotAnnotations]);

  const { triggerGlobalEvent } =
    useContextThrowingIfNoProvider(GlobalEventsContext);

  const [setAnnotationVisible] = useSetAnnotationVisibleMutation();

  const animateAnnotation = useCallback(
    (annotationID: UUID | null) => {
      triggerGlobalEvent(window.top, 'ANIMATE_ANNOTATION', {
        annotationID,
      });
    },
    [triggerGlobalEvent],
  );

  const annotationSetID = useRef(uuid());

  useEffect(() => {
    const initialAnnotationSetID = annotationSetID.current;
    addAnnotationSet(initialAnnotationSetID, annotationsOnPage);
  }, [annotationsOnPage, addAnnotationSet]);

  useEffect(() => {
    const initialAnnotationSetID = annotationSetID.current;

    return () => {
      removeAnnotationSet(initialAnnotationSetID);
    };
    // Separate from useEffect that adds annotation sets because
    // we only want to run the remove once on component unmount.
    // eslint-disable-next-line
  }, []);

  const addAnnotationToPage = useCallback(
    (annotation: AnnotationOnPage) => {
      if (disableHotspotAnnotations) {
        return;
      }
      logEvent('add-hotspot-annotation');
      setAllAnnotations((prev) => unique([...prev, annotation], (a) => a.id));
      setHiddenAnnotationIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(annotation.id);
        return newSet;
      });
      void setAnnotationVisible({
        variables: {
          annotationID: annotation.id,
          visible: true,
          _externalOrgID: organization?.externalID,
        },
      });
      onLocalAddOrRemove();
    },
    [
      disableHotspotAnnotations,
      logEvent,
      setAnnotationVisible,
      organization?.externalID,
      onLocalAddOrRemove,
    ],
  );

  const removeAnnotationFromPage = useCallback(
    (annotationID: UUID) => {
      if (disableHotspotAnnotations) {
        return;
      }
      logEvent('remove-hotspot-annotation');
      const deletedAnnotation = allAnnotations.find(
        (annotation) => annotation.id === annotationID,
      );
      setHiddenAnnotationIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(annotationID);
        return newSet;
      });
      void setAnnotationVisible({
        variables: {
          annotationID: annotationID,
          visible: false,
          _externalOrgID: organization?.externalID,
        },
      });
      onLocalAddOrRemove();
      return deletedAnnotation;
    },
    [
      disableHotspotAnnotations,
      logEvent,
      allAnnotations,
      setAnnotationVisible,
      organization?.externalID,
      onLocalAddOrRemove,
    ],
  );

  const contextValue = useMemo(
    () => ({
      addAnnotationToPage,
      removeAnnotationFromPage,
      animateAnnotation,
      annotationSetID: annotationSetID.current,
    }),
    [
      addAnnotationToPage,
      removeAnnotationFromPage,
      animateAnnotation,
      annotationSetID,
    ],
  );

  return (
    <AnnotationsOnPageContext.Provider value={contextValue}>
      {children}
    </AnnotationsOnPageContext.Provider>
  );
}

// Update sidebar/iframe via XFrameMessage. This:
// - Keeps both sides up-to-date with explicit setAnnotationVisible calls, which
//   do not have a subscription (they're specific to user, so sub not required)
// - Means local updates are reflected immediately on both sides, rather than 1
//   side at a lag while the subscription completes
function useLocalUpdateSyncer({
  allAnnotations,
  hiddenAnnotationIDs,
  updateAnnotations,
}: {
  allAnnotations: AnnotationOnPage[];
  hiddenAnnotationIDs: Set<UUID>;
  updateAnnotations: UpdateAnnotationsFn;
}) {
  const delegateContext = useContextThrowingIfNoProvider(DelegateContext);
  const iframeRef = delegateContext?.state.iframeRef;

  const { addGlobalEventListener, triggerGlobalEvent } =
    useContextThrowingIfNoProvider(GlobalEventsContext);

  const triggerAnnotationsUpdate = useCallback(() => {
    triggerGlobalEvent(
      iframeRef?.current?.contentWindow ?? window.top,
      'UPDATE_ANNOTATIONS_ON_PAGE',
      {
        allAnnotations,
        hiddenAnnotationIDs,
      },
    );
  }, [allAnnotations, iframeRef, hiddenAnnotationIDs, triggerGlobalEvent]);

  const [localUpdateCount, setLocalUpdateCount] = useState(0);

  const onLocalAddOrRemove = useCallback(() => {
    setLocalUpdateCount((prev) => prev + 1);
  }, []);

  const triggerAnnotationsUpdateRef = useUpdatingRef(triggerAnnotationsUpdate);
  useEffect(() => {
    if (localUpdateCount) {
      triggerAnnotationsUpdateRef.current();
    }
  }, [localUpdateCount, triggerAnnotationsUpdateRef]);

  useEffect(() => {
    const removeListener = addGlobalEventListener(
      'UPDATE_ANNOTATIONS_ON_PAGE',
      ({ data }) => updateAnnotations(data),
    );
    return removeListener;
  }, [updateAnnotations, addGlobalEventListener]);

  return { onLocalAddOrRemove };
}

function cleanResponse(
  data: AnnotationsOnPageQueryResult['annotationsOnPage'],
) {
  return {
    allAnnotations: data.allAnnotations.map((annotation) => ({
      id: annotation.id,
      location: annotation.location,
      customLocation: annotation.customLocation,
      customHighlightedTextConfig: annotation.customHighlightedTextConfig,
      customLabel: annotation.customLabel,
      coordsRelativeToTarget: annotation.coordsRelativeToTarget,
      messageID: annotation.message.id,
      threadID: annotation.message.thread.id,
      sourceID: annotation.message.source.id,
    })),
    hiddenAnnotationIDs: data.hiddenAnnotationIDs,
  };
}

const DO_NOT_EXPORT_defaultAnnotationsOnPageProvider: AnnotationsOnPageContextType =
  {
    addAnnotationToPage: doNothing,
    animateAnnotation: doNothing,
    removeAnnotationFromPage: () => undefined,
    annotationSetID: '',
  };
export function DisabledAnnotationsOnPageProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <AnnotationsOnPageContext.Provider
      value={DO_NOT_EXPORT_defaultAnnotationsOnPageProvider}
    >
      {children}
    </AnnotationsOnPageContext.Provider>
  );
}
