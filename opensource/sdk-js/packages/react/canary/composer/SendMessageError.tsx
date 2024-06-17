import React, { forwardRef } from 'react';
import cx from 'classnames';

import withCord from '../../experimental/components/hoc/withCord.js';
import type { StyleProps } from '../../betaV2.js';
import {
  CordTrans,
  useCordTranslation,
} from '../../hooks/useCordTranslation.js';
import * as classes from '../../components/Composer.classnames.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import { Link } from '../../experimental/components/helpers/Link.js';

export type SendMessageErrorProps = StyleProps &
  MandatoryReplaceableProps & {
    restoreMessage: () => void;
  };

export const SendMessageError = withCord<
  React.PropsWithChildren<SendMessageErrorProps>
>(
  forwardRef(function SendMessageError(
    { className, restoreMessage, ...restProps }: SendMessageErrorProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('composer');

    return (
      <div
        ref={ref}
        className={cx(className, classes.composerErrorMessage)}
        {...restProps}
      >
        <CordTrans
          t={t}
          i18nKey="send_message_action_failure"
          components={{ restore: <Link onClick={restoreMessage} /> }}
        />
      </div>
    );
  }),
  'SendMessageError',
);
