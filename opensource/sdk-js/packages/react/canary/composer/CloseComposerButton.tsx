import React, { forwardRef } from 'react';
import cx from 'classnames';

import withCord from '../../experimental/components/hoc/withCord.js';
import { Button } from '../../betaV2.js';
import type { StyleProps } from '../../betaV2.js';
import classes from '../../experimental/components/helpers/Button.css.js';
import type { CommonButtonProps } from '../../experimental/components/helpers/Button.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';

export interface CloseComposerButtonProps
  extends StyleProps,
    MandatoryReplaceableProps,
    CommonButtonProps {}

export const CloseComposerButton = withCord<
  React.PropsWithChildren<CloseComposerButtonProps>
>(
  forwardRef(function CloseButton(
    { onClick, className, ...restProps }: CloseComposerButtonProps,
    ref: React.ForwardedRef<HTMLElement>,
  ) {
    return (
      <Button
        canBeReplaced
        className={cx(
          className,
          classes.closeButton,
          classes.colorsSecondary,
          classes.small,
        )}
        buttonAction="close-composer"
        onClick={onClick}
        icon="X"
        {...restProps}
        ref={ref}
      />
    );
  }),
  'CloseComposerButton',
);
