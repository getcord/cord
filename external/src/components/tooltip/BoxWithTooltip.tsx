import { useRef, useState } from 'react';
import { Tooltip } from 'external/src/components/tooltip/Tooltip.tsx';
import { BoxWithPopper } from 'external/src/components/BoxWithPopper.tsx';
import type { PopperPosition } from 'common/types/index.ts';
import type { BoxProps } from 'external/src/components/ui/Box.tsx';

type BoxWithTooltipProps = Omit<
  BoxProps,
  'onMouseEnter' | 'onMouseLeave' | 'label'
> & {
  label: string | null;
  subtitle?: string;
  tooltipPosition?: PopperPosition;
  onClick?: JSX.IntrinsicElements['div']['onClick'];
  additionalOnMouseEnter?: (container: HTMLDivElement) => void;
  additionalOnMouseLeave?: () => void;
  additionalGap?: number;
  tooltipClassName?: string;
};

export const BoxWithTooltip = ({
  additionalOnMouseEnter,
  additionalOnMouseLeave,
  additionalGap,
  children,
  label,
  onClick,
  subtitle,
  tooltipPosition,
  tooltipClassName,
  ...divProps
}: React.PropsWithChildren<BoxWithTooltipProps>) => {
  const [hover, setHover] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  return (
    <BoxWithPopper
      {...divProps}
      gap={additionalGap}
      forwardRef={divRef}
      onMouseEnter={() => {
        setHover(true);
        additionalOnMouseEnter?.(divRef.current!);
      }}
      onMouseLeave={() => {
        setHover(false);
        additionalOnMouseLeave?.();
      }}
      onClick={onClick}
      popperElement={
        <Tooltip
          label={label as string} // Only shown if label is truthy (see popperElementVisible)
          subtitle={subtitle}
          className={tooltipClassName}
        />
      }
      popperElementVisible={Boolean(label && hover)}
      popperPosition={tooltipPosition}
      // Stop popper intefering with mouse enter/leave events
      additionalPopperStyle={{ pointerEvents: 'none' }}
    >
      {children}
    </BoxWithPopper>
  );
};
