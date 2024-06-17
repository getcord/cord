import { useEffect, useState, forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import type { Placement } from '@floating-ui/react-dom';
import { Slot } from '@radix-ui/react-slot';
import cx from 'classnames';
import { fontSmallLight } from 'common/ui/atomicClasses/fonts.css.ts';
import * as classes from 'external/src/components/ui3/Tooltip.css.ts';

import type { PopperPosition } from 'common/types/index.ts';
import type { TooltipProps } from 'external/src/components/ui2/Tooltip2.tsx';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import { Portal } from 'external/src/components/Portal.tsx';
import { useComposedRefs } from '@cord-sdk/react/common/lib/composeRefs.ts';

const DEFAULT_POSITION: PopperPosition = 'top';
const DEFAULT_OFFSET = 2;

type WithTooltipProps = TooltipProps &
  React.PropsWithChildren<{
    popperPosition?: PopperPosition;
    offset?: number | ((placement: Placement) => number);
    tooltipDisabled?: boolean;
    onHover?: () => void;
    className?: string;
  }>;

export const WithTooltip = forwardRef(function WithTooltip(
  {
    label,
    subtitle,
    popperPosition = DEFAULT_POSITION,
    offset = DEFAULT_OFFSET,
    tooltipDisabled = false,
    onHover,
    children,
    className,
    ...otherProps
  }: WithTooltipProps,
  ref: ForwardedRef<unknown>,
) {
  const [hover, setHover] = useState<boolean>(false);

  const {
    styles: popperStyles,
    setReferenceElement,
    setPopperElement,
  } = usePopperCreator({
    popperPosition,
    offset,
  });

  useEffect(() => {
    if (tooltipDisabled) {
      setHover(false);
    }
  }, [tooltipDisabled]);

  const setRef = useComposedRefs(ref, setReferenceElement);

  if (tooltipDisabled) {
    return <Slot className={className}>{children}</Slot>;
  }

  return (
    <>
      <Slot
        ref={setRef}
        {...otherProps}
        onMouseEnter={() => {
          setHover(true);
          onHover?.();
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
      >
        {children}
      </Slot>
      {label && hover && (
        <Portal>
          <div
            ref={setPopperElement}
            style={popperStyles}
            className={cx(classes.tooltip, fontSmallLight)}
          >
            <p className={classes.tooltipLabel}>{label}</p>
            {subtitle && <p className={classes.tooltipSubtitle}>{subtitle}</p>}
          </div>
        </Portal>
      )}
    </>
  );
});
