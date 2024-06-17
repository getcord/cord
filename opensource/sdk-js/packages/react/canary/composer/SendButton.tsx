import React, { forwardRef } from 'react';
import cx from 'classnames';

import withCord from '../../experimental/components/hoc/withCord.js';
import { Button } from '../../betaV2.js';
import type { StyleProps } from '../../betaV2.js';
import {
  colorsPrimary,
  sendButton,
  small,
} from '../../components/helpers/Button.classnames.js';
import type { CommonButtonProps } from '../../experimental/components/helpers/Button.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';

export interface SendButtonProps
  extends StyleProps,
    CommonButtonProps,
    MandatoryReplaceableProps {}

export const SendButton = withCord<React.PropsWithChildren<SendButtonProps>>(
  forwardRef(function SendButton(
    { onClick, className, ...restProps }: SendButtonProps,
    ref: React.ForwardedRef<HTMLElement>,
  ) {
    return (
      <Button
        canBeReplaced
        className={cx(className, sendButton, colorsPrimary, small)}
        buttonAction="send-message"
        onClick={onClick}
        icon="ArrowRight"
        {...restProps}
        ref={ref}
      />
    );
  }),
  'SendButton',
);
