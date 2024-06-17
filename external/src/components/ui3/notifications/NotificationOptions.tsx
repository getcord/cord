import { useCallback, useState } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { WithPopper } from 'external/src/components/ui3/WithPopper.tsx';
import { NotificationActionsMenu } from 'external/src/components/ui3/notifications/NotificationActionsMenu.tsx';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';

type Props = {
  notification: NotificationsQueryResultNode;
};

export function NotificationOptions({ notification }: Props) {
  const { t } = useCordTranslation('notifications');
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      event.preventDefault();
      setOptionsMenuOpen(true);
    },
    [setOptionsMenuOpen],
  );

  const hideMenu = useCallback(() => {
    setOptionsMenuOpen(false);
  }, [setOptionsMenuOpen]);

  return (
    <WithTooltip
      label={t('notification_options_tooltip')}
      tooltipDisabled={optionsMenuOpen}
    >
      <WithPopper
        popperElement={
          <NotificationActionsMenu
            closeMenu={hideMenu}
            notification={notification}
          />
        }
        popperElementVisible={optionsMenuOpen}
        popperPosition={'bottom-end'}
        onShouldHide={hideMenu}
        withBlockingOverlay={true}
        onClick={onClick}
      >
        <Button
          icon="DotsThree"
          buttonType="secondary"
          buttonAction="open-notification-options"
          size="small"
        />
      </WithPopper>
    </WithTooltip>
  );
}
