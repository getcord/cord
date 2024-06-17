import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';

import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { TabGroup2 } from 'external/src/components/ui2/TabGroup2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useTopNavTracker } from 'external/src/components/2/hooks/useTopNavTracker.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { NAV_IN_FULL_PAGE_MODAL_SIDEBAR_ID } from 'external/src/common/strings.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

const useStyles = createUseStyles({
  inboxTopNavTabGroupContainer: {
    width: '100%',
  },
  inboxTopNavButtonsContainer: {
    display: 'flex',
    flexGrow: '1',
    justifyContent: 'flex-end',
  },
  inboxTopNavSidebar: {
    backgroundColor: cssVar('sidebar-header-background-color'),
    borderTopLeftRadius: cssVar('border-radius-large'),
    borderTopRightRadius: cssVar('border-radius-large'),
  },
  inboxTopNavInbox: {
    backgroundColor: cssVar('inbox-header-background-color'),
    borderTopLeftRadius: cssVar('border-radius-medium'),
    borderTopRightRadius: cssVar('border-radius-medium'),
  },
});

type InboxTopNavProps = {
  showCloseButton: boolean;
  showAllActivity: boolean;
  closeInbox: () => void;
  openSettings: () => void;
  setActiveTabIndex: (index: number) => void;
  showSettings: boolean;
};

export function InboxTopNav2({
  showCloseButton,
  showAllActivity,
  closeInbox,
  openSettings,
  setActiveTabIndex,
  showSettings,
}: InboxTopNavProps) {
  const { t } = useCordTranslation('inbox');
  const classes = useStyles();

  const name = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const isSDKInboxComponent =
    name === 'cord-inbox' || name === 'cord-inbox-launcher';

  const { logEvent } = useLogger();

  const topNavRef = useTopNavTracker();
  const inboxInSidebar = !name || name === 'cord-sidebar';

  return (
    <Row2
      className={
        isSDKInboxComponent
          ? classes.inboxTopNavInbox
          : classes.inboxTopNavSidebar
      }
      id={inboxInSidebar ? NAV_IN_FULL_PAGE_MODAL_SIDEBAR_ID : undefined}
      padding="2xs"
      forwardRef={topNavRef}
    >
      <div className={classes.inboxTopNavTabGroupContainer}>
        {showAllActivity ? (
          <TabGroup2
            tabItems={[t('inbox_title'), t('all_pages_title')]}
            defaultActiveTab={0}
            onTabSelected={(tab) => setActiveTabIndex(tab)}
          />
        ) : (
          <Text2 color="content-emphasis" font="small">
            {t('inbox_title')}
          </Text2>
        )}
      </div>
      <Row2 className={classes.inboxTopNavButtonsContainer}>
        {/* Settings doesn't really make sense if we don't have a viewer org as
        its core functionality is Slack linking, which is org specific.  The showSettings
        boolean is passed through a prop on Inbox and InboxComponent so will stop 
        working if there is no org in the token. The prop has been taken out of the docs
        for this reason */}
        {showSettings && organization && (
          <WithTooltip2 label={t('settings_tooltip')} popperPosition="bottom">
            <Button2
              buttonType="tertiary"
              icon="Gear"
              size="medium"
              marginHorizontal="3xs"
              onClick={() => {
                openSettings();
                logEvent('open-settings');
              }}
            />
          </WithTooltip2>
        )}
        {showCloseButton && (
          <WithTooltip2 label={t('close_tooltip')} popperPosition="bottom">
            <Button2
              buttonType="secondary"
              icon="X"
              size="medium"
              onClick={() => {
                closeInbox();
                logEvent('close-inbox');
              }}
            />
          </WithTooltip2>
        )}
      </Row2>
    </Row2>
  );
}
