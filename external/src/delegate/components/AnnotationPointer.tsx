import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import type { Point } from 'framer-motion';
import { motion } from 'framer-motion';

import type {} from '@cord-sdk/jsx';

import cx from 'classnames';
import { PHOSPHOR_ICONS } from '@cord-sdk/react/components/helpers/Icon.tsx';
import { useCordTranslation } from '@cord-sdk/react';
import { Sizes } from 'common/const/Sizes.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { Tooltip } from 'external/src/components/tooltip/Tooltip.tsx';
import type { AnnotationOnPage } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { doNothing } from 'external/src/lib/util.ts';
import {
  removeTextHighlight,
  showTextHighlight,
} from 'external/src/delegate/location/textHighlights.ts';
import type {
  HighlightedTextConfig,
  MessageAnnotation,
  UUID,
} from 'common/types/index.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import {
  useThreadEventsSubscription,
  useUnreadMessageCountQuery,
} from 'external/src/graphql/operations.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { FloatingThreadsContext } from 'external/src/context/floatingThreads/FloatingThreadsContext.ts';
import { AnnotationPinWithAvatar } from 'external/src/delegate/components/AnnotationPinWithAvatar.tsx';
import { cordifyClassname } from 'common/ui/style.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const MOUSE_POINTER_TOOLTIP_SHOW_DELAY_MS = 250;
const ANIMATE_POINTER_SCALE = 1.25;
const ANIMATE_POINTER_SCALE_TEXT_HIGHLIGHT = 0.75;
const ANIMATE_POINTER_DURATION = 0.25;
const CLOSE_BUTTON_WIDTH = 24;
const TOOLTIP_HEIGHT = 24;
export const DEFAULT_PIN_SIZE = Sizes.ANNOTATION_POINTER_SMALL_SIZE_PX;
export const DEFAULT_PIN_SCALE = 1.5;

const useStyles = createUseStyles({
  annotationPointer: {
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: ZINDEX.annotation - 1,
    // If you have a cluster of annotations, we want the one you're hovering
    // over to be on top rather than hidden behind other ones.
    '&:hover': {
      zIndex: ZINDEX.annotation,
    },
    '&:hover $closeButton': {
      display: 'block',
    },
  },
  closeButton: {
    cursor: 'pointer',
    display: 'none',
    pointerEvents: 'auto',
    position: 'absolute',
    top: '-6px',
    zIndex: 1,
  },
  closePointer: {
    borderRadius: '50%',
    // this is then scaled up to 24px
    height: '16px',
    width: '16px',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    filter:
      'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1)) drop-shadow(0px 2px 16px rgba(0, 0, 0, 0.1))',
  },
  pointerFollowingMouseTooltip: {
    position: 'absolute',
    zIndex: ZINDEX.annotation,
  },
  tooltip: {
    // Avoid wrapping text into 2 lines.
    maxWidth: 'unset',
    whiteSpace: 'nowrap',
  },
  visible: {
    display: 'block',
  },
  hidden: {
    visibility: 'hidden',
  },
  annotationPinContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: ZINDEX.annotation,
  },
  annotationPinContainerWithOpenFloatingThread: {
    zIndex: ZINDEX.annotation + 1,
  },
});

type Props = {
  positionVsViewport: Point;
  hidden?: boolean;
  forwardRef?: React.RefObject<HTMLDivElement>;
  annotationPlaced?: boolean;
};

export function MouseAnnotationPointer({
  positionVsViewport,
  hidden,
  forwardRef,
  tooltipLabel,
  annotationPlaced = false,
}: Props & { tooltipLabel: string }) {
  const classes = useStyles();
  const [isMoving, setIsMoving] = useState(false);
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);

  const { annotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );
  const scaledUpPinSize = annotationPinSize * DEFAULT_PIN_SCALE;

  const onAnimationComplete = useCallback(() => {
    // Add delay to show the tooltip less often.
    const timeout = setTimeout(
      () => setIsMoving(false),
      MOUSE_POINTER_TOOLTIP_SHOW_DELAY_MS,
    );
    setTooltipTimer(timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [tooltipTimer]);

  const tooltipPosition = {
    left: positionVsViewport.x + scaledUpPinSize,
    top: positionVsViewport.y - scaledUpPinSize * 0.6,
  };

  return annotationPlaced ? (
    <AnnotationPointer
      highlightedTextConfig={null}
      setHiddenAnnotation={doNothing}
      positionVsViewport={positionVsViewport}
      hidden={hidden}
      forwardRef={forwardRef}
      isHotspotAnnotation={false}
      hasOpenThread={false}
    />
  ) : (
    <>
      <motion.div
        data-cord-hide-element
        ref={forwardRef}
        className={cx(
          cordifyClassname('unplaced-annotation-pin'),
          classes.annotationPointer,
        )}
        animate={{
          x: positionVsViewport.x,
          y: positionVsViewport.y - annotationPinSize,
        }}
        transition={
          !hidden
            ? {
                type: 'spring',
                mass: 0.2,
                damping: 10,
                stiffness: 500,
                velocity: 1,
              }
            : // Avoid animating when it's first dragged onto main webpage from sidebar
              { duration: 0 }
        }
        style={{
          visibility: !hidden ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
        onAnimationStart={() => setIsMoving(true)}
        onAnimationComplete={onAnimationComplete}
      >
        <AnnotationPinWithAvatar
          annotationPlaced={annotationPlaced}
          unread={false}
        />
      </motion.div>
      {/* Avoid tooltip showing in screenshot by not rendering after annotationPlaced */}
      {!annotationPlaced && !isMoving && !hidden && (
        <motion.div
          className={classes.pointerFollowingMouseTooltip}
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-cord-hide-element
        >
          <Tooltip className={classes.tooltip} label={tooltipLabel} />
        </motion.div>
      )}
    </>
  );
}

export function AnnotationPointer({
  annotation,
  threadID,
  highlightedTextConfig,
  positionVsViewport,
  hidden,
  isHotspotAnnotation,
  forwardRef,
  allowHiding = true,
  setHiddenAnnotation,
  isInDraftState = true,
  hasOpenThread,
  children,
}: React.PropsWithChildren<
  Props & {
    annotation?: MessageAnnotation;
    threadID?: UUID;
    highlightedTextConfig: HighlightedTextConfig | null;
    isHotspotAnnotation: boolean;
    setHiddenAnnotation: (annotation: AnnotationOnPage | undefined) => void;
    allowHiding?: boolean;
    isInDraftState?: boolean;
    hasOpenThread: boolean;
  }
>) {
  const { t } = useCordTranslation('annotation');
  const classes = useStyles();
  const [threadHasNewMessages, setThreadHasNewMessages] = useState<boolean>();

  const { annotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );
  const scaledUpPinSize = annotationPinSize * DEFAULT_PIN_SCALE;

  const { data, loading, error, refetch } = useUnreadMessageCountQuery({
    skip: !threadID,
    variables: {
      threadID: threadID!,
    },
  });

  const { user: viewerUser } = useContextThrowingIfNoProvider(IdentityContext);

  useEffect(() => {
    if (!loading && !error && data) {
      setThreadHasNewMessages(!!(data.thread.newMessagesCount > 0));
    }
    // Still show the pins if there's an error (gracefully degrade)
    if (error) {
      setThreadHasNewMessages(false);
    }
  }, [data, error, loading]);

  const { data: threadEventsSubscriptionData } = useThreadEventsSubscription({
    skip: !threadID,
    variables: {
      threadID: threadID!,
    },
  });

  useEffect(() => {
    if (threadEventsSubscriptionData) {
      if (
        ['ThreadMessageAdded', 'ThreadMessageRemoved'].includes(
          threadEventsSubscriptionData.threadEvents.__typename,
        )
      ) {
        void refetch();
      }
      if (
        threadEventsSubscriptionData.threadEvents.__typename ===
        'ThreadParticipantsUpdatedIncremental'
      ) {
        // For the annotation pins we're only interested in participant changes related
        // to the viewer; we only care if THEY'VE seen messages so we can update
        // the pin colour accordingly
        if (
          threadEventsSubscriptionData.threadEvents.participant.user?.id ===
          viewerUser?.id
        ) {
          void refetch();
        }
      }
    }
  }, [threadEventsSubscriptionData, refetch, viewerUser]);

  const {
    dispatch,
    state: { animateAnnotationID },
  } = useContextThrowingIfNoProvider(DelegateContext);
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const { logEvent } = useLogger();

  const floatingThreadsContext = useContextThrowingIfNoProvider(
    FloatingThreadsContext,
  );

  const { annotationSetID, removeAnnotationFromPage, animateAnnotation } =
    useContextThrowingIfNoProvider(AnnotationsOnPageContext);

  const { getAnnotationPinsToRender } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  const annotationsOnPage = useMemo(
    () => getAnnotationPinsToRender(annotationSetID),
    [getAnnotationPinsToRender, annotationSetID],
  );

  const [tooltipText, setTooltipText] = useState<string | null>(null);

  const onMouseEnterXBtn = useCallback(() => {
    logEvent('hover-hotspot-annotation', { target: 'hide-button' });
    setTooltipText(t('hide_action'));
  }, [logEvent, t]);

  const onMouseEnterPointer = useCallback(() => {
    logEvent('hover-hotspot-annotation', { target: 'annotation-pointer' });
    if (!hasOpenThread) {
      setTooltipText(t('show_message_action'));
    }
  }, [logEvent, hasOpenThread, t]);

  const handleHideHotspotAnnotation = useCallback(
    (event: React.MouseEvent) => {
      if (annotation) {
        logEvent('hide-hotspot-annotation');
        const deletedAnnotation = removeAnnotationFromPage(annotation.id);
        setHiddenAnnotation(deletedAnnotation);
        event.stopPropagation();
      }
    },
    [annotation, logEvent, removeAnnotationFromPage, setHiddenAnnotation],
  );

  const userData = useMemo(() => {
    if (annotation?.sourceID) {
      return userByID(annotation.sourceID);
    }
    return undefined;
  }, [annotation, userByID]);

  const annotationOnPage = useMemo(
    () => annotationsOnPage.find(({ id }) => id === annotation?.id),
    [annotationsOnPage, annotation],
  );

  const onClickHotspotAnnotation = useCallback(() => {
    if (!annotationOnPage) {
      return;
    }

    logEvent('click-hotspot-annotation');
    // Show FloatingThreads's floating thread
    if (floatingThreadsContext?.openThreadID === annotationOnPage.threadID) {
      floatingThreadsContext?.setOpenThreadID(null);
    } else {
      floatingThreadsContext?.setOpenThreadID(annotationOnPage.threadID);
    }
    setTooltipText(null);
    // Show thread in Sidebar
    dispatch({
      type: 'SET_DEEPLINK_INFO',
      deepLinkInfo: {
        threadID: annotationOnPage.threadID,
        messageID: annotationOnPage.messageID,
        annotationID: annotationOnPage.id,
      },
    });
  }, [annotationOnPage, logEvent, dispatch, floatingThreadsContext]);

  const [isHoveringOnPin, setIsHoveringOnPin] = useState(false);
  const onMouseEnter = useCallback(() => {
    setIsHoveringOnPin(true);
    if (highlightedTextConfig && annotation) {
      showTextHighlight(
        annotation.id,
        highlightedTextConfig,
        annotation.location?.iframeSelectors ?? [],
      );
    }
  }, [annotation, highlightedTextConfig]);

  const onMouseLeave = useCallback(() => {
    setIsHoveringOnPin(false);
    if (highlightedTextConfig && annotation) {
      removeTextHighlight(annotation.id);
    }
  }, [annotation, highlightedTextConfig]);

  useEffect(() => {
    return () => {
      if (highlightedTextConfig && annotation) {
        removeTextHighlight(annotation.id);
      }
    };
  }, [annotation, highlightedTextConfig]);

  const containerRef = useRef<HTMLDivElement>(null);

  const onAnimationPointerComplete = useCallback(
    (variant: string) => {
      if (variant !== 'forceAnimate') {
        return;
      }
      animateAnnotation(null);
    },
    [animateAnnotation],
  );

  const isForceAnimate = useMemo(
    () => animateAnnotationID === annotation?.id,
    [animateAnnotationID, annotation?.id],
  );

  const pinChildren = (unread?: boolean) =>
    (isHotspotAnnotation || isForceAnimate) && (
      <div
        className={cx(classes.closeButton, {
          [classes.visible]: isForceAnimate,
          [classes.hidden]: !allowHiding,
        })}
        style={{
          right: 0,
          // since 0.8 * pinSize is the avatarSize, we use
          // .7 just so the button can be on the pin border
          left: `${annotationPinSize * 0.7}px`,
        }}
        onClick={handleHideHotspotAnnotation}
        onMouseEnter={onMouseEnterXBtn}
      >
        <ClosePointer unread={unread} />
      </div>
    );

  // If this is say a draft annotation no threadID will be passed in, so the query for
  // threadHasNewMessages will not run and we should immediately show the pin.  If there
  // is a threadID we will run the query - wait until we have a response and threadHasNewMessages
  // is set to true or false before showing the pin, to avoid a colour flicker
  if (threadID && threadHasNewMessages === undefined) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cx(classes.annotationPinContainer, {
        [classes.annotationPinContainerWithOpenFloatingThread]: hasOpenThread,
      })}
    >
      <motion.div
        variants={{
          hover: {
            display: 'block',
            transition: { delay: 1, duration: 0 },
          },
          notHover: { display: 'none' },
        }}
        animate={
          isHoveringOnPin && (isHotspotAnnotation || isForceAnimate)
            ? 'hover'
            : 'notHover'
        }
        initial={'notHover'}
        style={{
          x: !allowHiding
            ? positionVsViewport.x + annotationPinSize
            : positionVsViewport.x + annotationPinSize + CLOSE_BUTTON_WIDTH,
          y: positionVsViewport.y - (scaledUpPinSize + TOOLTIP_HEIGHT),
        }}
      >
        {tooltipText && (
          <Tooltip
            data-cord-hide-element
            className={classes.tooltip}
            label={tooltipText}
          />
        )}
      </motion.div>

      <motion.div
        data-cord-hide-element
        ref={forwardRef}
        className={cx(
          cordifyClassname('annotation-pointer-container'),
          classes.annotationPointer,
        )}
        onClick={isHotspotAnnotation ? onClickHotspotAnnotation : undefined}
        // Align the mouse with the bottom centre of the old pin and the bottom
        // left of the new pin
        style={{
          x: positionVsViewport.x,
          y: positionVsViewport.y - annotationPinSize,
          cursor: isHotspotAnnotation ? 'pointer' : 'auto',
          pointerEvents: isHotspotAnnotation ? 'auto' : 'none',
          visibility: !hidden ? 'visible' : 'hidden',
          // Origin for scale transform - bottom/left
          originY: 1,
          originX: 0,
        }}
        initial="notHover"
        animate={isForceAnimate ? 'forceAnimate' : 'notHover'}
        whileHover="hover"
        variants={{
          hover: {
            scale: isInDraftState ? 1 : DEFAULT_PIN_SCALE,
          },
          notHover: {
            scale: isHotspotAnnotation ? 1 : DEFAULT_PIN_SCALE,
          },
          forceAnimate: {
            scale: highlightedTextConfig
              ? ANIMATE_POINTER_SCALE_TEXT_HIGHLIGHT
              : ANIMATE_POINTER_SCALE,
            transition: {
              duration: ANIMATE_POINTER_DURATION,
              ease: 'easeInOut',
            },
          },
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        // Scale to zero on unmount. Note that this div needs to be direct child
        // of AnimatePresence (in AnnotationPointers) for exit animation to work
        exit={isHotspotAnnotation ? { scale: 0 } : undefined}
        // Key needed for exit animation
        key={`pointer-${annotation?.id ?? 'unknown'}`}
        onAnimationComplete={onAnimationPointerComplete}
      >
        <AnnotationPinWithAvatar
          userData={userData ? userToUserData(userData) : undefined}
          onMouseEnter={onMouseEnterPointer}
          unread={!!threadHasNewMessages}
        >
          {pinChildren(!!threadHasNewMessages)}
        </AnnotationPinWithAvatar>
      </motion.div>
      {children && !hidden && (isHoveringOnPin || hasOpenThread) && (
        <div
          style={{
            pointerEvents: 'auto',
          }}
          // Do not trigger annotation pin events
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ClosePointer({ unread }: { unread?: boolean }) {
  const classes = useStyles();
  let pinColour;
  let strokeColour;

  if (unread) {
    pinColour = cssVar('annotation-pin-unread-color');
    strokeColour = cssVar('annotation-pin-unread-outline-color');
  } else {
    pinColour = cssVar('annotation-pin-read-color');
    strokeColour = cssVar('annotation-pin-read-outline-color');
  }

  return (
    <div
      className={classes.closePointer}
      style={{
        // We use 0.5 to match the original svg
        border: `0.5px solid ${strokeColour}`,
        backgroundColor: pinColour,
      }}
    >
      <PHOSPHOR_ICONS.X weight={'bold'} size={'6px'} color={strokeColour} />
    </div>
  );
}
