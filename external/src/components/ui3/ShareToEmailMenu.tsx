import { useCallback } from 'react';
import { useCordTranslation } from '@cord-sdk/react';

import { EmailInputForm } from 'external/src/components/ui3/EmailInputForm.tsx';
import { useShareThreadToEmail } from 'external/src/effects/useShareThreadToEmail.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Menu } from 'external/src/components/ui3/Menu.tsx';
import type { UUID } from 'common/types/index.ts';
import { MenuNavigationItem } from 'external/src/components/ui3/MenuNavigationItem.tsx';
import { Separator } from 'external/src/components/ui3/Separator.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  threadID: UUID;
  onBackButtonClick: () => void;
  onClose: () => void;
};

export const ShareToEmailMenu = ({
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
    <Menu>
      <MenuNavigationItem
        label={t('share_via_email_header')}
        onClick={onBackButtonClick}
      />
      <Separator />
      <EmailInputForm onSubmit={onShareToEmailButtonClick} />
    </Menu>
  );
};
