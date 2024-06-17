import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';

import { ResizeObserverContext } from 'external/src/context/resizeObserver/ResizeObserverContext.ts';
import { Toggle2 } from 'external/src/components/ui2/Toggle2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const TOGGLE_BUTTON_TOP_PADDING = 8;
const TOGGLE_BUTTON_HEIGHT = 16;

const useStyles = createUseStyles({
  outerContainer: {
    position: 'relative',
  },
  innerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  fadeGradient: {
    height: '50%',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
  toggleWrapper: {
    bottom: 0,
    position: 'absolute',
    height: TOGGLE_BUTTON_HEIGHT,
  },
});

type Props = {
  truncateAtPx: number;
  truncateToPx: number;
  highlighted?: boolean;
  expandable: boolean;
};

export function Truncator2({
  truncateAtPx,
  truncateToPx,
  highlighted = false,
  expandable,
  children,
}: React.PropsWithChildren<Props>) {
  const classes = useStyles();
  // https://stackoverflow.com/a/70585394
  const [isSafari] = useState(() => 'GestureEvent' in window);

  const innerContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const [tallerThanMax, setTallerThanMax] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);

  const truncateAtPxRef = useRef(truncateAtPx);
  truncateAtPxRef.current = truncateAtPx;

  const { observeElement, unobserveElement } = useContextThrowingIfNoProvider(
    ResizeObserverContext,
  );

  const onResize = useCallback(() => {
    if (contentWrapperRef.current) {
      // requestAnimationFrame makes sure the scroll adjusts at same time (see useScrollAdjuster)
      window.requestAnimationFrame(() => {
        if (contentWrapperRef.current) {
          setTallerThanMax(
            contentWrapperRef.current.offsetHeight > truncateAtPxRef.current,
          );
        }
      });
    }
  }, []);

  useLayoutEffect(() => {
    const innerContainer = innerContainerRef.current!;
    observeElement(innerContainer, onResize);
    onResize();
    return () => unobserveElement(innerContainer);
  }, [unobserveElement, observeElement, onResize]);

  // Disable gradient in safari. Safari has a bug where you can't use
  // transparent in a linear-gradient. To get the gradient right, you have to
  // use the same color with opacity 0 as the transparent color. The color is
  // a css variable which may change, e.g. when toggling dark mode. To get the
  // color, we would have to poll for the computed style, which doesn't seem
  // worth it.
  const showGradient = tallerThanMax && !expanded && !isSafari;
  const showToggle = tallerThanMax && !expanded && expandable;

  return (
    <div
      className={classes.outerContainer}
      style={{
        paddingBottom: showToggle
          ? TOGGLE_BUTTON_TOP_PADDING + TOGGLE_BUTTON_HEIGHT
          : 0,
      }}
    >
      <div
        className={classes.innerContainer}
        ref={innerContainerRef}
        style={{
          maxHeight:
            tallerThanMax === null || (tallerThanMax && !expanded)
              ? truncateToPx
              : undefined,
        }}
      >
        <div ref={contentWrapperRef}>{children}</div>
      </div>
      {showGradient && (
        <div
          className={classes.fadeGradient}
          style={{
            background: `linear-gradient(transparent, ${cssVar(
              highlighted ? 'message-highlight-background-color' : 'color-base',
            )})`,
            bottom: expandable
              ? TOGGLE_BUTTON_HEIGHT + TOGGLE_BUTTON_TOP_PADDING
              : 0,
          }}
        />
      )}
      {showToggle && (
        <div className={classes.toggleWrapper}>
          <Toggle2
            collapsedLabel="Show more"
            expandedLabel="NA"
            expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          />
        </div>
      )}
    </div>
  );
}
