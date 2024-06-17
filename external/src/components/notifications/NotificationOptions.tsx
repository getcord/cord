import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { NotificationActionsMenu } from 'external/src/components/notifications/NotificationActionsMenu.tsx';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';

const useStyles = createUseStyles({
  notificationOptionsButton: {
    backgroundColor: 'transparent',
  },
});

type Props = {
  notification: NotificationsQueryResultNode;
  getClassName?: (menuVisible: boolean) => string;
};

export function NotificationOptions({ notification, getClassName }: Props) {
  const { t } = useCordTranslation('notifications');
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  const classes = useStyles();

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
    <WithTooltip2
      label={t('notification_options_tooltip')}
      tooltipDisabled={optionsMenuOpen}
    >
      <BoxWithPopper2
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
        className={getClassName?.(optionsMenuOpen)}
      >
        <Button2
          icon="DotsThree"
          buttonType="secondary"
          size="small"
          additionalClassName={classes.notificationOptionsButton}
        />
      </BoxWithPopper2>
    </WithTooltip2>
  );
}
