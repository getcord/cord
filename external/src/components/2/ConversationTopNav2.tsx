import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';

import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Facepile2 } from 'external/src/components/ui2/Facepile2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { WithBadge2 } from 'external/src/components/ui2/WithBadge2.tsx';
import { useNavigationController } from 'external/src/entrypoints/sidebar/components/navigationController.ts';
import { SidebarConfigContext } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useTopNavTracker } from 'external/src/components/2/hooks/useTopNavTracker.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  topNav: {
    backgroundColor: cssVar('sidebar-header-background-color'),
  },
  wrapper: {
    alignItems: 'center',
    display: 'flex',
    flexGrow: '1',
    gap: cssVar('space-3xs'),
    justifyContent: 'flex-end',
  },
  facePile: {
    backgroundColor: cssVar('sidebar-header-background-color'),
  },
});

type Props = {
  openInbox: () => void;
};

export function ConversationTopNav2({ openInbox }: Props) {
  const { t } = useCordTranslation('sidebar');
  const classes = useStyles();

  const excludeViewerFromPresence =
    useContextThrowingIfNoProvider(SidebarConfigContext)
      ?.excludeViewerFromPresence;

  const {
    inboxCount,
    handleCloseSidebar,
    usersToShow,
    showPresence,
    showCloseButton,
    showInbox,
  } = useNavigationController({
    excludeViewerFromPresenceFacepile: excludeViewerFromPresence ?? false,
  });

  const topNavRef = useTopNavTracker();

  return (
    <Row2 className={classes.topNav} padding="2xs" forwardRef={topNavRef}>
      <Text2 color="content-emphasis" font="small">
        {t('thread_list_title')}
      </Text2>

      <Row2 className={classes.wrapper}>
        {showPresence && (
          <Facepile2
            users={usersToUserData(usersToShow)}
            maxUsers={3}
            paddingHorizontal="3xs"
            className={classes.facePile}
          />
        )}

        {showInbox && (
          <WithTooltip2 label={t('inbox_tooltip')} popperPosition="bottom">
            <WithBadge2
              style="badge_with_count"
              badgePosition="within_child"
              count={inboxCount}
            >
              <Button2
                buttonType="tertiary"
                icon="Tray"
                size="medium"
                onClick={openInbox}
              />
            </WithBadge2>
          </WithTooltip2>
        )}

        {showCloseButton && (
          <WithTooltip2
            label={t('close_sidebar_tooltip')}
            popperPosition="bottom"
          >
            <Button2
              buttonType="secondary"
              icon="X"
              size="medium"
              onClick={handleCloseSidebar}
            />
          </WithTooltip2>
        )}
      </Row2>
    </Row2>
  );
}
