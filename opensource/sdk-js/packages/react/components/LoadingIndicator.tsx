import React, { forwardRef } from 'react';
import cx from 'classnames';
import type { MandatoryReplaceableProps } from '../experimental/components/replacements.js';
import type { StyleProps } from '../betaV2.js';
import withCord from '../experimental/components/hoc/withCord.js';
import * as classes from './LoadingIndicator.css.js';

export type LoadingIndicatorProps = {
  hidden: boolean;
  icon: JSX.Element;
  /**
   * Unique ID, useful in replacement API to target a specific
   * loading indicator.
   */
  id: `${string}-loading`;
} & MandatoryReplaceableProps &
  StyleProps;

export const LoadingIndicator = withCord<
  React.PropsWithChildren<LoadingIndicatorProps>
>(
  forwardRef(function LoadingIndicator(
    props: LoadingIndicatorProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { hidden, className, icon, id: _id, ...restProps } = props;
    if (hidden) {
      return null;
    }
    return (
      <div
        ref={ref}
        className={cx(classes.loadingIndicator, className)}
        {...restProps}
      >
        {icon}
      </div>
    );
  }),
  'LoadingIndicator',
);
