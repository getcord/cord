import { useCallback, useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';

import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { Settings2 } from 'external/src/components/ui2/Settings2.tsx';
import { InboxTopNav2 } from 'external/src/components/2/InboxTopNav2.tsx';
import { ThreadsProvider2 } from 'external/src/context/threads2/ThreadsProvider2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { ThreadList2 } from 'external/src/components/2/ThreadList2.tsx';
import { useInbox2Controller } from 'external/src/components/2/inbox2Controller.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { AllTabThread2 } from 'external/src/components/AllTabThread2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import type { InboxThreadFragment } from 'external/src/graphql/operations.ts';
import { useLazyActivityQuery } from 'external/src/graphql/operations.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { QUERY_POLL_INTERVAL } from 'common/const/Timing.ts';
import { SettingsTopNav2 } from 'external/src/components/ui2/SettingsTopNav2.tsx';
import { useComponentProp } from 'external/src/context/component/useComponentProp.ts';
import { Inbox2 } from 'external/src/components/2/Inbox2.tsx';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

const useStyles = createUseStyles({
  settingsPage: {
    display: 'flex',
    flexDirection: 'column',
    zIndex: ZINDEX.popup,
  },
  markAsReadButton: {
    position: 'absolute',
    right: cssVar('space-2xs'),
    transform: `translateY(calc(-1 * ${cssVar('space-2xs')}))`,
  },
  unreadThreadsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-xl'),
  },
});

type InboxProps = {
  closeInbox: () => void;
  showCloseButton?: boolean;
  showSettings?: boolean;
  showAllActivity?: boolean;
  showPlaceholder?: boolean;
};

const TABS = ['inbox', 'activity'] as const;

export function InboxWrapper(props: InboxProps) {
  const [initialActivityLoadDone, setInitialActivityLoadDone] = useState(false);
  const [activityThreads, setActivityThreads] = useState<InboxThreadFragment[]>(
    [],
  );
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const [
    loadActivityThreads,
    { loading: activityThreadsLoading, data: activityThreadsData },
  ] = useLazyActivityQuery({
    variables: { _externalOrgID: organization?.externalID },
  });

  useEffect(() => {
    if (!activityThreadsLoading && activityThreadsData) {
      const threads =
        activityThreadsData.viewer.organization?.recentlyActiveThreads;
      if (threads) {
        setActivityThreads(threads);
      }
      setInitialActivityLoadDone(true);
    }
  }, [activityThreadsData, activityThreadsLoading]);

  return (
    <ThreadsProvider2 location="inbox">
      <InboxWrapperComponent
        {...props}
        activityThreads={activityThreads}
        initialActivityLoadDone={initialActivityLoadDone}
        loadActivityThreads={() => void loadActivityThreads()}
      />
    </ThreadsProvider2>
  );
}

function InboxWrapperComponent({
  closeInbox,
  showCloseButton = true,
  showAllActivity,
  initialActivityLoadDone,
  activityThreads,
  loadActivityThreads,
  showSettings = true,
  showPlaceholder = true,
}: InboxProps & {
  initialActivityLoadDone: boolean;
  activityThreads: InboxThreadFragment[];
  loadActivityThreads: () => void;
}) {
  const classes = useStyles();
  const { logEvent } = useLogger();
  const name = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const [activeTabIndex, _setActiveTabIndex] = useState<number>(0);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const openTab = TABS[activeTabIndex];

  const showAllActivityFromComponent = useComponentProp(
    'showAllActivity',
    true,
  );

  useEffect(() => {
    if (openTab === 'activity') {
      const interval = setInterval(() => {
        loadActivityThreads();
      }, QUERY_POLL_INTERVAL);
      return () => clearInterval(interval);
    }
    return;
  }, [loadActivityThreads, openTab]);

  const { initialInboxLoadDone, refreshUnreadAndReadSections } =
    useInbox2Controller();

  const initialLoadInProgress =
    openTab === 'inbox' ? !initialInboxLoadDone : !initialActivityLoadDone;

  const setActiveTabIndex = useCallback(
    (index: number) => {
      _setActiveTabIndex(index);
      const newTab = TABS[index];
      if (newTab === 'activity') {
        loadActivityThreads();
      } else {
        // Reorder and move any read threads to unread
        refreshUnreadAndReadSections();
      }
      logEvent('change-inbox-tab', { tab: newTab });
    },
    [loadActivityThreads, logEvent, refreshUnreadAndReadSections],
  );

  const onSettingsBack = useCallback(() => {
    refreshUnreadAndReadSections();
    setSettingsOpen(false);
    logEvent(`close-settings-page`);
  }, [logEvent, refreshUnreadAndReadSections]);

  const onSettingsClose = useCallback(() => {
    closeInbox();
    logEvent(`close-settings-page-and-inbox`);
  }, [closeInbox, logEvent]);

  const renderTabContents = () => {
    switch (openTab) {
      case 'inbox':
        return <Inbox2 showPlaceholder={showPlaceholder} />;
      case 'activity':
        return (
          <ThreadList2 showLoadingSpinner={initialLoadInProgress}>
            {activityThreads.map((thread) => (
              <AllTabThread2 key={thread.id} thread={thread} />
            ))}
          </ThreadList2>
        );
    }
  };

  return (
    <>
      <InboxTopNav2
        showCloseButton={showCloseButton}
        showAllActivity={showAllActivity ?? showAllActivityFromComponent}
        closeInbox={closeInbox}
        openSettings={() => setSettingsOpen(true)}
        setActiveTabIndex={setActiveTabIndex}
        showSettings={showSettings}
      />
      <Separator2 marginVertical="none" />
      {renderTabContents()}
      {settingsOpen && (
        <Box2
          position="absolute"
          insetZero={true}
          backgroundColor="base"
          borderRadius="large"
          className={classes.settingsPage}
        >
          <SettingsTopNav2 onBack={onSettingsBack} onClose={onSettingsClose} />
          <Separator2 marginVertical="none" />
          <Settings2
            location={
              name === 'cord-inbox' || name === 'cord-inbox-launcher'
                ? 'inbox'
                : 'sidebar'
            }
            showCordBranding={true}
          />
        </Box2>
      )}
    </>
  );
}
