import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';
import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import type { StyleProps } from '../../../betaV2.js';
import classes from './Separator.css.js';

export type SeparatorProps = StyleProps & MandatoryReplaceableProps;
export const Separator = withCord<React.PropsWithChildren<SeparatorProps>>(
  forwardRef(function Separator(
    { className, ...restProps }: SeparatorProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    return (
      <div
        {...restProps}
        ref={ref}
        className={cx(classes.separator, className)}
      />
    );
  }),
  'Separator',
);
