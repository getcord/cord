import * as React from 'react';
import { useCallback, forwardRef, useContext } from 'react';
import type { Ref } from 'react';
import cx from 'classnames';
import { CordContext } from '../../../index.js';
import { useCordTranslation } from '../../../hooks/useCordTranslation.js';
import withCord from '../hoc/withCord.js';
import { Separator } from '../helpers/Separator.js';
import * as classes from '../../../components/ShareToEmailForm.css.js';
import { Button } from '../helpers/Button.js';
import { Icon } from '../../../components/helpers/Icon.js';
import {
  fontBodyEmphasis,
  fontSmall,
} from '../../../common/ui/atomicClasses/fonts.css.js';
import {
  colorsPrimary,
  medium,
} from '../../../components/helpers/Button.classnames.js';
import type { MandatoryReplaceableProps } from '../replacements.js';

export type ShareToEmailFormWrapperProps = {
  onBackButtonClick: () => void;
  threadID: string;
  onClose: () => void;
};

export type ShareToEmailFormProps = {
  onBackButtonClick: () => void;
  onClose: () => void;
  onShareViaEmail: (email: string) => Promise<true> | undefined;
} & React.HTMLAttributes<HTMLFormElement> &
  MandatoryReplaceableProps;

export const ShareToEmailFormWrapper = forwardRef(
  function ShareToEmailFormWrapper(
    { threadID, onBackButtonClick, onClose }: ShareToEmailFormWrapperProps,
    ref: Ref<HTMLElement>,
  ) {
    const onShareViaEmail = useCallback(
      (email: string) => {
        if (!window.CordSDK) {
          console.error('CordSDK not found');
          return;
        }

        return window.CordSDK.thread.shareThread(threadID, {
          method: 'email',
          email,
        });
      },
      [threadID],
    );

    return (
      <ShareToEmailForm
        ref={ref}
        canBeReplaced
        onClose={onClose}
        onShareViaEmail={onShareViaEmail}
        onBackButtonClick={onBackButtonClick}
      />
    );
  },
);

export const ShareToEmailForm = withCord<ShareToEmailFormProps>(
  forwardRef(function ShareToEmailForm(
    {
      onBackButtonClick,
      onClose,
      onShareViaEmail,
      'data-cord-replace': dataCordReplace,
    }: ShareToEmailFormProps,
    ref: React.Ref<HTMLFormElement>,
  ) {
    const { sdk: cordSDK } = useContext(CordContext);

    const { t } = useCordTranslation('thread');

    const [emailInput, setEmailInput] = React.useState<string>('');

    const captureWhen = React.useMemo(() => {
      return cordSDK?.options.screenshot_options?.capture_when;
    }, [cordSDK?.options.screenshot_options?.capture_when]);

    const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        void onShareViaEmail(emailInput)?.then(() => onClose());
      },
      [emailInput, onClose, onShareViaEmail],
    );

    const onShareViaEmailClick = useCallback<
      React.MouseEventHandler<HTMLButtonElement>
    >(
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        void onShareViaEmail(emailInput)?.then(() => onClose());
      },
      [emailInput, onClose, onShareViaEmail],
    );

    return (
      <form
        className={classes.emailForm}
        ref={ref}
        onSubmit={handleSubmit}
        {...{ 'data-cord-replace': dataCordReplace }}
      >
        <div
          data-cord-menu-item="email-form-go-back"
          className={classes.emailFormGoBack}
        >
          <Button
            canBeReplaced
            buttonAction="navigate-back"
            onClick={onBackButtonClick}
          >
            <Icon name="CaretLeft" size="small" />
          </Button>
          <p className={cx(classes.emailFormGoBackLabel, fontBodyEmphasis)}>
            {t('share_via_email_header')}
          </p>
        </div>
        <Separator />
        <label htmlFor="email"></label>
        <input
          className={classes.emailInput}
          type="email"
          id="email"
          name="email"
          placeholder={t('share_via_email_placeholder')}
          onChange={(e) => setEmailInput(e.target.value)}
          value={emailInput}
          aria-label="email"
          autoFocus
          required
        />
        {captureWhen?.includes('share-via-email') && (
          <p className={cx(fontSmall, classes.emailSubtitle)}>
            {t('share_via_email_screenshot_warning')}
          </p>
        )}
        {emailInput && (
          <Button
            buttonAction="share-via-email"
            icon="ReturnArrow"
            canBeReplaced
            className={cx(colorsPrimary, medium, classes.emailSubmitButton)}
            onClick={onShareViaEmailClick}
          >
            {t('share_via_email_button_action')}
          </Button>
        )}
      </form>
    );
  }),
  'ShareToEmailForm',
);
