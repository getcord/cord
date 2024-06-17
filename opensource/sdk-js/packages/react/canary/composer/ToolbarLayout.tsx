import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import type { ForwardedRef } from 'react';
import cx from 'classnames';

import withCord from '../../experimental/components/hoc/withCord.js';
import * as composerClasses from '../../components/Composer.classnames.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import type { NamedElements, StyleProps } from '../../betaV2.js';
import { composerToolbar } from './ToolbarLayout.css.js';

const PRIMARY = ['sendButton', 'cancelButton'];
export type ToolbarLayoutProps = {
  /**
   * An array of named elements.
   * You can filter some out, or reorder, or add new custom buttons.
   */
  items?: NamedElements;
} & StyleProps &
  MandatoryReplaceableProps;
export const ToolbarLayout = withCord<
  React.PropsWithChildren<ToolbarLayoutProps>
>(
  forwardRef(function ToolbarLayout(
    props: ToolbarLayoutProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { items = [], ...restProps } = props;

    const primaryButtons = useMemo(() => {
      return items
        .filter((item) => PRIMARY.includes(item.name))
        .map((item) => (
          <React.Fragment key={item.name}>{item.element}</React.Fragment>
        ));
    }, [items]);
    const secondaryButtons = useMemo(() => {
      return items
        .filter((item) => !PRIMARY.includes(item.name))
        .map((item) => (
          <React.Fragment key={item.name}>{item.element}</React.Fragment>
        ));
    }, [items]);

    return (
      <div ref={ref} {...restProps}>
        <div className={composerClasses.secondaryButtonsGroup}>
          {secondaryButtons}
        </div>
        <div className={composerClasses.primaryButtonsGroup}>
          {primaryButtons}
        </div>
      </div>
    );
  }),
  'ToolbarLayout',
);

export const ToolbarLayoutWithClassName = forwardRef(
  function ToolbarLayoutWithClassName(
    props: ToolbarLayoutProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { className, ...restProps } = props;
    return (
      <ToolbarLayout
        canBeReplaced
        ref={ref}
        {...restProps}
        className={cx(className, composerToolbar)}
      />
    );
  },
);
