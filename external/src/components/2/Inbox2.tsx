import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';
import { useInbox2Controller } from 'external/src/components/2/inbox2Controller.ts';
import { InboxNuxMessage } from 'external/src/components/2/InboxNuxMessage.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { WithToggle2 } from 'external/src/components/ui2/WithToggle2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import type { UUID } from 'common/types/index.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { INBOX_READ_SECTION_CLOSED } from 'common/const/UserPreferenceKeys.ts';
import { InboxThread2 } from 'external/src/components/Inbox2Thread.tsx';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { ThreadList2 } from 'external/src/components/2/ThreadList2.tsx';
import { EmptyStateWithIcon } from 'external/src/components/2/EmptyStateWithIcon.tsx';

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
  cordFooter: {
    backgroundColor: cssVar('color-base-strong'),
    marginTop: 'auto',
    padding: cssVar('space-m'),
    textAlign: 'center',
    '&:hover': {
      backgroundColor: cssVar('color-base-x-strong'),
    },
  },
  cordFooterText: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftPadding: {
    paddingLeft: cssVar('space-2xs'),
  },
  emptyStateContainer: {
    paddingBottom: cssVar('space-xl'),
  },
});

type Props = {
  showPlaceholder: boolean;
};

export function Inbox2({ showPlaceholder }: Props) {
  const { t } = useCordTranslation('inbox');
  const classes = useStyles();
  const { logEvent } = useLogger();

  const { threadIDs, markThreadAsRead, initialInboxLoadDone } =
    useInbox2Controller();

  const [expandedThreadID, setExpandedThreadID] = useState<UUID | null>(null);

  const isUnreadEmpty = threadIDs.unread.length === 0;
  const isReadEmpty = threadIDs.read.length === 0;

  const expandThread = useCallback(
    (threadID: UUID, unread: boolean) => {
      setExpandedThreadID(threadID);
      logEvent('expand-inbox-thread', { unread });
    },
    [logEvent],
  );
  const collapseThread = useCallback(() => {
    logEvent('click-thread-options-collapse-thread');
    setExpandedThreadID(null);
  }, [logEvent]);
  const markAsReadAndCollapse = useCallback(
    (threadID: UUID) => {
      setExpandedThreadID((prev) => (prev === threadID ? null : prev));
      markThreadAsRead(threadID);
    },
    [markThreadAsRead],
  );

  const [readSectionClosed, setReadSectionClosed] = usePreference(
    INBOX_READ_SECTION_CLOSED,
  );
  const toggleReadSection = useCallback(
    (expanded: boolean) => {
      setReadSectionClosed(!expanded);
    },
    [setReadSectionClosed],
  );

  const readThreadsRef = useUpdatingRef(new Set(threadIDs.read));

  const renderInboxThread = (threadID: UUID) => {
    const expanded = threadID === expandedThreadID;
    const read = readThreadsRef.current.has(threadID);

    return (
      <InboxThread2
        key={threadID}
        threadID={threadID}
        read={read}
        expanded={expanded}
        collapseThread={collapseThread}
        expandThread={expandThread}
        markThreadAsRead={markAsReadAndCollapse}
      />
    );
  };

  return (
    <ThreadList2 showLoadingSpinner={!initialInboxLoadDone}>
      {isUnreadEmpty && showPlaceholder ? (
        <EmptyStateWithIcon
          className={classes.emptyStateContainer}
          title={t('empty_state_title')}
          subtext={t('empty_state_body')}
          iconName="Archive"
        />
      ) : (
        <>
          <InboxNuxMessage />
          <div className={classes.unreadThreadsContainer}>
            <WithTooltip2
              label={t('mark_all_as_read_action')}
              className={classes.markAsReadButton}
            >
              <Button2
                icon="Archive"
                buttonType="secondary"
                size="medium"
                onClick={() => {
                  threadIDs.unread.map(markThreadAsRead);
                  // Collapse unread thread, if one was open
                  if (
                    expandedThreadID &&
                    threadIDs.unread.includes(expandedThreadID)
                  ) {
                    setExpandedThreadID(null);
                  }
                }}
              />
            </WithTooltip2>
            <WithToggle2
              expandedLabel="Unread"
              collapsedLabel="Show unread"
              color="content-primary"
              initialState="expanded"
            >
              {threadIDs.unread.map(renderInboxThread)}
            </WithToggle2>
          </div>
        </>
      )}
      <Separator2 marginVertical="none" />

      {!isReadEmpty && (
        <WithToggle2
          expandedLabel="Read"
          collapsedLabel="Show read"
          color="content-primary"
          expanded={!readSectionClosed}
          setExpanded={toggleReadSection}
        >
          {threadIDs.read.map(renderInboxThread)}
        </WithToggle2>
      )}
    </ThreadList2>
  );
}
