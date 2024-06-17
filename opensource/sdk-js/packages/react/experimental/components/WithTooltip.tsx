import * as React from 'react';
import { useEffect, useState, forwardRef } from 'react';
import type { Placement } from '@floating-ui/react-dom';
import { Slot } from '@radix-ui/react-slot';
import cx from 'classnames';

import { usePopperCreator } from '../../hooks/usePopperCreator.js';
import type { PopperPosition } from '../../types.js';
import * as classes from '../../components/Tooltip.css.js';
import { useComposedRefs } from '../../common/lib/composeRefs.js';
import { fontSmallLight } from '../../common/ui/atomicClasses/fonts.css.js';
import { Portal } from './Portal.js';
import type { MandatoryReplaceableProps } from './replacements.js';

const DEFAULT_POSITION: PopperPosition = 'top';
const DEFAULT_OFFSET = 2;

export type TooltipProps = {
  label: string | null;
  subtitle?: string;
} & MandatoryReplaceableProps;

export type WithTooltipProps = React.PropsWithChildren<{
  tooltip: JSX.Element | null;
  popperPosition?: PopperPosition;
  offset?: number | ((placement: Placement) => number);
  tooltipDisabled?: boolean;
  onHover?: () => void;
  className?: string;
}>;

export const WithTooltip = forwardRef(function WithTooltip(
  {
    popperPosition = DEFAULT_POSITION,
    tooltip,
    offset = DEFAULT_OFFSET,
    tooltipDisabled = false,
    onHover,
    children,
    className,
    ...otherProps
  }: WithTooltipProps,
  ref: React.ForwardedRef<unknown>,
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
      {tooltip && hover && (
        <Portal>
          <div
            ref={setPopperElement}
            style={popperStyles}
            className={cx(classes.tooltip, fontSmallLight)}
          >
            {tooltip}
          </div>
        </Portal>
      )}
    </>
  );
});

export function DefaultTooltip({ subtitle, label, ...rest }: TooltipProps) {
  return (
    <>
      <p className={classes.tooltipLabel} {...rest}>
        {label}
      </p>
      {subtitle && (
        <p className={classes.tooltipSubtitle} {...rest}>
          {subtitle}
        </p>
      )}
    </>
  );
}
