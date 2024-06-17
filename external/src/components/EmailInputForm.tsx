import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';

import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';

const useStyles = createUseStyles({
  emailInput: {
    border: 'none',
    background: cssVar('color-base-strong'),
    padding: cssVar('space-xs'),
    borderRadius: cssVar('border-radius-medium'),
    fontFamily: cssVar('font-family'),
    fontSize: cssVar('font-size-body'),
    width: '100%',
  },
});

type Props = {
  className?: string;
  onSubmit: (email: string) => void;
};

export const EmailInputForm = ({ className, onSubmit }: Props) => {
  const { t } = useCordTranslation('thread');
  const classes = useStyles();

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
    <form className={className} onSubmit={handleSubmit}>
      <Box2 paddingHorizontal="2xs" paddingBottom="2xs">
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
          <Text2 color="content-secondary" font="small" marginTop="xs">
            {t('share_via_email_screenshot_warning')}
          </Text2>
        )}
        {emailInput && (
          <Button2
            icon="ReturnArrow"
            buttonType="primary"
            size="medium"
            marginTop="s"
            isFullWidth={true}
            isSubmit={true}
          >
            {t('share_via_email_button_action')}
          </Button2>
        )}
      </Box2>
    </form>
  );
};
