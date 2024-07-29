import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import { betaV2, experimental } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import { Icon } from '@cord-sdk/react/components/helpers/Icon.tsx';

type ThreadsProps = {
  groupID: string;
};

type TabType = 'open' | 'resolved';

function ThreadsWithResolvedTab({ groupID }: ThreadsProps) {
  const [currentTab, setCurrentTab] = useState<TabType>('open');

  const onChangeTab = useCallback((tab: string) => {
    if (tab !== 'resolved' && tab !== 'open') {
      console.error('Tab does not exist');
    }
    setCurrentTab(tab as TabType);
  }, []);

  // @ts-expect-error
  const options: experimental.TabbedThreadsProps['tabbedThreadsOptions'] =
    useMemo(() => {
      return [
        {
          name: 'open',
          threadsOptions: {
            options: {
              filter: {
                resolvedStatus: 'unresolved',
                location: { page: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Threads }, // Not required in code sample
              },
            },
            composerOptions: {
              position: 'bottom',
              groupID,
              location: { page: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Threads }, // Not required in code sample
            },
          },
        },
        {
          name: 'resolved',
          threadsOptions: {
            options: {
              filter: { resolvedStatus: 'resolved' },
              location: { page: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Threads }, // Not required in code sample
            },
          },
          replace: RESOLVED_THREADS_REPLACEMENT,
        },
      ];
    }, [groupID]);
  return (
    <experimental.TabbedThreads
      currentTab={currentTab}
      onChangeTab={onChangeTab}
      tabbedThreadsOptions={options}
      style={{ height: 400, width: 300 }}
    />
  );
}

const ResolvedInlineThread = forwardRef(function ResolvedInlineThread(
  props: experimental.InlineThreadProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <experimental.InlineThread
      {...props}
      showHeader={props.thread.resolved}
      className={cx(props.className, 'resolved-inline-thread')}
      ref={ref}
    />
  );
});

function ResolvedThreadHeader(props: experimental.InlineThreadHeaderProps) {
  const toast = betaV2.useToast();
  const reopenThread = useCallback(() => {
    if (!window.CordSDK) {
      return;
    }
    const { thread } = window.CordSDK;
    void thread
      .updateThread(props.thread.id, { resolved: false })
      .then(
        () =>
          toast.showToastPopup?.(
            'reopen-thread',
            'Thread has been successfully reopened',
            'success',
          ),
      )
      .catch((error) =>
        console.error('Something went wrong with reopening thread', error),
      );
  }, [props.thread.id, toast]);

  return (
    <div className={cx('resolved-thread-header', props.className)}>
      <Icon name="CheckCircle" size="large" />
      <span className="cord-font-small">Resolved</span>
      <betaV2.Button
        buttonAction="reopen-thread"
        className={cx('reopen-thread-button', 'cord-font-small')}
        onClick={reopenThread}
      >
        Reopen
      </betaV2.Button>
    </div>
  );
}

const MaybeResolvedEmptyPlaceholder = forwardRef(
  function MaybeResolvedEmptyPlaceholder(
    props: betaV2.EmptyPlaceholderProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    if (props.type === 'threads-placeholder') {
      const title = '🚨 Nothing has been resolved!';
      return (
        <betaV2.EmptyPlaceholder {...props} title={title} body={undefined} />
      );
    }

    return <betaV2.EmptyPlaceholder {...props} ref={ref} />;
  },
);

const RESOLVED_THREADS_REPLACEMENT = {
  InlineThread: ResolvedInlineThread,
  InlineThreadHeader: ResolvedThreadHeader,
  EmptyPlaceholder: MaybeResolvedEmptyPlaceholder,
};

export const code = `import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import { betaV2, experimental } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import { Icon } from '@cord-sdk/react/components/helpers/Icon.tsx';

type ThreadsProps = {
  groupID: string;
};

type TabType = 'open' | 'resolved';

function ThreadsWithResolvedTab({ groupID }: ThreadsProps) {
  const [currentTab, setCurrentTab] = useState<TabType>('open');

  const onChangeTab = useCallback((tab: string) => {
    if (tab !== 'resolved' && tab !== 'open') {
      console.error('Tab does not exist');
    }
    setCurrentTab(tab as TabType);
  }, []);

  const options: experimental.TabbedThreadsProps['tabbedThreadsOptions'] =
    useMemo(() => {
      return [
        {
          name: 'open',
          threadsOptions: {
            options: {
              filter: {
                resolvedStatus: 'unresolved',
              },
            },
            composerOptions: {
              position: 'bottom',
              groupID,
            },
          },
        },
        {
          name: 'resolved',
          threadsOptions: {
            options: {
              filter: { resolvedStatus: 'resolved' },
            },
          },
          replace: RESOLVED_THREADS_REPLACEMENT,
        },
      ];
    }, [groupID]);
  return (
    <experimental.TabbedThreads
      currentTab={currentTab}
      onChangeTab={onChangeTab}
      tabbedThreadsOptions={options}
      style={{ height: 400, width: 300 }}
    />
  );
}

const ResolvedInlineThread = forwardRef(function ResolvedInlineThread(
  props: experimental.InlineThreadProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <experimental.InlineThread
      {...props}
      showHeader={props.thread.resolved}
      className={cx(props.className, 'resolved-inline-thread')}
      ref={ref}
    />
  );
});

function ResolvedThreadHeader(props: experimental.InlineThreadHeaderProps) {
  const toast = betaV2.useToast();
  const reopenThread = useCallback(() => {
    if (!window.CordSDK) {
      return;
    }
    const { thread } = window.CordSDK;
    void thread
      .updateThread(props.thread.id, { resolved: false })
      .then(
        () =>
          toast.showToastPopup?.(
            'reopen-thread',
            'Thread has been successfully reopened',
            'success',
          ),
      )
      .catch((error) =>
        console.error('Something went wrong with reopening thread', error),
      );
  }, [props.thread.id, toast]);

  return (
    <div className={cx('resolved-thread-header', props.className)}>
      <Icon name="CheckCircle" size="large" />
      <span className="cord-font-small">Resolved</span>
      <betaV2.Button
        buttonAction="reopen-thread"
        className={cx('reopen-thread-button', 'cord-font-small')}
        onClick={reopenThread}
      >
        Reopen
      </betaV2.Button>
    </div>
  );
}

const MaybeResolvedEmptyPlaceholder = forwardRef(
  function MaybeResolvedEmptyPlaceholder(
    props: betaV2.EmptyPlaceholderProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    if (props.type === 'threads-placeholder') {
      const title = '🚨 Nothing has been resolved!';
      return (
        <betaV2.EmptyPlaceholder {...props} title={title} body={undefined} />
      );
    }

    return <betaV2.EmptyPlaceholder {...props} ref={ref} />;
  },
);

const RESOLVED_THREADS_REPLACEMENT = {
  InlineThread: ResolvedInlineThread,
  InlineThreadHeader: ResolvedThreadHeader,
  EmptyPlaceholder: MaybeResolvedEmptyPlaceholder,
};`;

// styles the component
const cssStyling = `
.cord-threads.cord-v2 {
  height: 400px; 
}

/* To make sure the composer is always at the bottom */
.cord-composer.cord-v2 {
  margin-top: auto;
}

.resolved-inline-thread {
  background: #F6F6F6;
  margin: 0px 8px;
}

.cord-message.cord-v2 {
  background: transparent;
}

.resolved-thread-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
  padding-top: 8px;
  color: #696A6C;
};

.reopen-thread-button {
  display: none;
  margin-left: auto;
  margin-right: 8px;
  padding: 2px 4px;
  font-weight: strong;
}

.resolved-thread-header:hover .reopen-thread-button {
  display: block;
}`;

const styles = css(cssStyling);

export const THREADS_WITH_RESOLVED_TAB_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ThreadsWithResolvedTabWrapper(props: ThreadsProps) {
  return (
    <>
      <Global styles={styles} />
      <ThreadsWithResolvedTab {...props} />
    </>
  );
}
