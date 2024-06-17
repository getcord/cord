import { useCallback } from 'react';
import { useCordTranslation } from '@cord-sdk/react';

import { useShareThreadToEmail } from 'external/src/effects/useShareThreadToEmail.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import type { UUID } from 'common/types/index.ts';
import { MenuNavigationItem2 } from 'external/src/components/ui2/MenuNavigationItem2.tsx';
import { EmailInputForm } from 'external/src/components/EmailInputForm.tsx';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  threadID: UUID;
  onBackButtonClick: () => void;
  onClose: () => void;
};

export const ShareToEmailMenu2 = ({
  threadID,
  onBackButtonClick,
  onClose,
}: Props) => {
  const { t } = useCordTranslation('thread');
  const shareThreadToEmail = useShareThreadToEmail();
  const { logEvent } = useLogger();
  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const onShareToEmailButtonClick = useCallback(
    (email: string) => {
      logEvent('click-share-thread-to-email-submit-button', {
        threadID,
        email,
      }),
        showToastPopup?.(t('share_via_email_action_success', { email }));
      void shareThreadToEmail(threadID, email);
      onClose();
    },
    [logEvent, onClose, shareThreadToEmail, showToastPopup, threadID, t],
  );

  return (
    <Menu2>
      <MenuNavigationItem2
        label={t('share_via_email_header')}
        onClick={onBackButtonClick}
      />
      <Separator2 />
      <EmailInputForm onSubmit={onShareToEmailButtonClick} />
    </Menu2>
  );
};
