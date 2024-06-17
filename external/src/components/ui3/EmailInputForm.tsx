import { useCallback, useState } from 'react';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';

import { Button } from 'external/src/components/ui3/Button.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import * as classes from 'external/src/components/ui3/EmailInputForm.css.ts';
import { fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';

type Props = {
  onSubmit: (email: string) => void;
};

export const EmailInputForm = ({ onSubmit }: Props) => {
  const { t } = useCordTranslation('thread');
  const [emailInput, setEmailInput] = useState<string>('');

  const {
    screenshotOptions: { captureWhen },
  } = useContextThrowingIfNoProvider(ConfigurationContext);

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      onSubmit(emailInput);
    },
    [emailInput, onSubmit],
  );

  return (
    <form className={classes.emailForm} onSubmit={handleSubmit}>
      <label htmlFor="email"></label>
      <input
        className={classes.emailInput}
        type="email"
        id="email"
        name="email"
        placeholder={t('share_via_email_placeholder')}
        onChange={(e) => setEmailInput(e.target.value)}
        value={emailInput}
        autoFocus
        required
      />
      {captureWhen.includes('share-via-email') && (
        <p className={cx(fontSmall, classes.subtitle)}>
          {t('share_via_email_screenshot_warning')}
        </p>
      )}
      {emailInput && (
        <Button
          buttonAction="share-via-email"
          icon="ReturnArrow"
          buttonType="primary"
          size="medium"
          isSubmit
        >
          {t('share_via_email_button_action')}
        </Button>
      )}
    </form>
  );
};
