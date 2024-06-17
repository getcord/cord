import { useEffect, useState, useMemo, forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import type { Placement } from '@floating-ui/react-dom';
import { Slot } from '@radix-ui/react-slot';

import type { PopperPosition } from 'common/types/index.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import type { TooltipProps } from 'external/src/components/ui2/Tooltip2.tsx';
import { Tooltip2 } from 'external/src/components/ui2/Tooltip2.tsx';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Portal } from 'external/src/components/Portal.tsx';
import { useComposedRefs } from '@cord-sdk/react/common/lib/composeRefs.ts';

const useStyles = createUseStyles({
  withTooltipBox: {
    display: 'inline-block',
  },
  tooltip: {
    pointerEvents: 'none',
    zIndex: ZINDEX.popup,
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
});

const DEFAULT_POSITION: PopperPosition = 'top';
const DEFAULT_OFFSET = 2;

type WithTooltipProps = TooltipProps & {
  popperPosition?: PopperPosition;
  offset?: number | ((placement: Placement) => number);
  nowrap?: boolean;
  tooltipDisabled?: boolean;
  onHover?: () => void;
  tooltipClassName?: string;
  asChild?: boolean;
} & Omit<
    React.ComponentProps<typeof Box2>,
    'onMouseEnter' | 'onMouseLeave' | 'label' | 'forwardRef'
  >;

/**
 * @deprecated Use ui3/WithTooltip instead
 */
export const WithTooltip2 = forwardRef(function WithTooltip2(
  {
    label,
    subtitle,
    popperPosition = DEFAULT_POSITION,
    offset = DEFAULT_OFFSET,
    nowrap,
    className,
    tooltipDisabled = false,
    onHover,
    children,
    tooltipClassName,
    asChild,
    ...otherProps
  }: WithTooltipProps,
  ref: ForwardedRef<unknown>,
) {
  const classes = useStyles();

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
  const refProps = useMemo(() => {
    return asChild ? { ref: setRef } : { forwardRef: setRef };
  }, [asChild, setRef]);

  if (tooltipDisabled) {
    return asChild ? (
      <Slot className={className}>{children}</Slot>
    ) : (
      <div className={className}>{children}</div>
    );
  }

  const TooltipElement = (
    <div
      className={cx(
        classes.tooltip,
        {
          [classes.nowrap]: nowrap,
        },
        tooltipClassName,
      )}
      ref={setPopperElement}
      style={popperStyles}
    >
      <Tooltip2 label={label} subtitle={subtitle} />
    </div>
  );
  const Comp = asChild ? Slot : Box2;

  return (
    <>
      <Comp
        {...refProps}
        {...otherProps}
        onMouseEnter={() => {
          setHover(true);
          onHover?.();
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
        className={cx(classes.withTooltipBox, className)}
      >
        {children}
      </Comp>
      {label && hover && <Portal>{TooltipElement}</Portal>}
    </>
  );
});
