import * as React from 'react';
import { createUseStyles } from 'react-jss';

import { Sizes } from 'common/const/Sizes.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { Colors } from 'common/const/Colors.ts';
import { Tooltip } from 'external/src/components/tooltip/Tooltip.tsx';
import { BoxWithPopper } from 'external/src/components/BoxWithPopper.tsx';
import { Overlay } from 'external/src/delegate/components/Overlay.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { Point2D } from 'common/types/index.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  arrow: {
    width: '100vw',
    height: '100vh',
  },
});

type Props = {
  fromPosition: Point2D;
  toPosition: Point2D;
  arrowGoingDown: boolean;
  tooltipText?: string | null;
  pointingToWidth?: number;
};

export const Arrow = React.memo(function Arrow({
  fromPosition,
  toPosition,
  arrowGoingDown,
  tooltipText,
  pointingToWidth = Sizes.XLARGE,
}: Props) {
  const classes = useStyles();

  const {
    state: { iframeRef },
  } = useContextThrowingIfNoProvider(DelegateContext);

  const iframeX = iframeRef.current?.getBoundingClientRect().x ?? 0;

  const fromX = iframeX + fromPosition.x;
  const fromY = fromPosition.y;
  const toX = toPosition.x;
  const toY = toPosition.y;

  const distanceX = toX - fromX;
  const distanceY = toY - fromY;

  const yOverX = Math.abs(distanceY / distanceX);

  // Vary curve Y by 10%, or 5% if the curve doesn't go far horizontally (more looks weird)
  // Also apply minimum absolute variation to avoid flat arrow
  const tallAndNarrow = yOverX > 3;
  const yVariationFraction = tallAndNarrow ? 0.05 : 0.1;
  const yVariation =
    Math.max(
      yVariationFraction * Math.abs(distanceY),
      Math.max(0.1 * Math.abs(distanceX), 40),
    ) * (arrowGoingDown ? 1 : -1);
  const xVariations = [0.2, 0.4, 0.5, 0.9];

  const lastPoint = {
    x: fromX + distanceX * xVariations[3],
    // Cater for arrows that are fairly flat horizontally and don't travel far
    // If arrow going up:
    //  - The arrow will be approach the annotation from the bottom
    //  - It's possible that toY > fromY, as arrowGoingDown is calculated using top of pointer
    //  - Take the maximum, so that there's enough space for the arrow to curve back round
    y: (!arrowGoingDown ? Math.max(fromY, toY) : fromY) - yVariation,
  };

  // Cubic bezier curve
  // Explanation/example: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
  const d = `
    M ${fromX} ${fromY}
    C
      ${fromX + distanceX * xVariations[0]} ${fromY + yVariation},
      ${fromX + distanceX * xVariations[1]} ${fromY + yVariation},
      ${fromX + distanceX * xVariations[2]} ${fromY}
    S
      ${lastPoint.x} ${lastPoint.y},
      ${toX} ${toY}
    `;

  const angle = getAngleOfLine(lastPoint.x, lastPoint.y, toX, toY);
  const getArrowHeadPoints = (isBorder = false) => {
    const offset = isBorder ? 11 : 10;
    return `${toX - offset} ${toY + offset},
              ${toX} ${toY},
              ${toX + offset} ${toY + offset}`;
  };

  const STROKE_OPACITY = 66;
  const ARROW_STROKE_WIDTH = 1;

  return (
    <Overlay allowPointerEvents={false} withoutSidebar={true}>
      <svg className={classes.arrow} data-cord-hide-element>
        {/* To achieve a border effect on the arrow line, we draw it twice:
          Firstly a 3x thicker version (1x border on either side plus the actual line in the middle),
          then we draw the thinner line on top of that. */}
        {/* Arrow line border */}
        <path
          stroke={cssVar('annotation-arrow-outline-color')}
          fill={Colors.TRANSPARENT}
          strokeOpacity={STROKE_OPACITY}
          strokeWidth={`${ARROW_STROKE_WIDTH * 3}px`}
          d={d}
        />
        {/* Arrow head border */}
        <polyline
          stroke={cssVar('annotation-arrow-outline-color')}
          fill={Colors.TRANSPARENT}
          strokeOpacity={STROKE_OPACITY}
          strokeWidth={`${ARROW_STROKE_WIDTH * 3}px`}
          points={getArrowHeadPoints(true)}
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${toX}px ${toY}px`,
          }}
        />
        {/* Arrow line */}
        <path
          stroke={cssVar('annotation-arrow-color')}
          fill={Colors.TRANSPARENT}
          strokeWidth={`${ARROW_STROKE_WIDTH}px`}
          d={d}
        />
        {/* Arrow head */}
        <polyline
          stroke={cssVar('annotation-arrow-color')}
          fill={Colors.TRANSPARENT}
          strokeWidth={`${ARROW_STROKE_WIDTH}px`}
          points={getArrowHeadPoints()}
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${toX}px ${toY}px`,
          }}
        />
      </svg>
      {tooltipText && (
        <BoxWithPopper
          popperElement={<Tooltip label={tooltipText} />}
          popperElementVisible={true}
          popperPosition={'left'}
          style={{
            position: 'absolute',
            top: toY,
            left: toX - pointingToWidth * 0.5,
            width: pointingToWidth,
            margin: 0,
          }}
          withoutPortal={true}
        />
      )}
    </Overlay>
  );
});

function getAngleOfLine(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const dy = endY - startY;
  const dx = endX - startX;
  let theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  // Convert to 0-360 degs
  theta = (theta + 450) % 360;
  return theta;
}
