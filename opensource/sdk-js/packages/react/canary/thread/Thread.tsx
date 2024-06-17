import * as React from 'react';
import { forwardRef, useMemo, useEffect } from 'react';
import cx from 'classnames';

import withCord from '../../experimental/components/hoc/withCord.js';
import {
  LoadingIndicator,
  Message,
  Replace,
  SendComposer,
  ThreadHeader,
} from '../../betaV2.js';
import type {
  WithByIDComponent,
  ByID,
  ThreadProps,
  ThreadByIDProps,
} from '../../betaV2.js';
import { useThread } from '../../hooks/thread.js';
import { useCordContext } from '../../contexts/CordContext.js';
import { SpinnerIcon } from '../../common/icons/customIcons/SpinnerIcon.js';
import classes from './Thread.css.js';
import { ThreadSeenByWrapper } from './ThreadSeenBy.js';
import { EmptyThreadPlaceholderWrapper } from './EmptyThreadPlaceholder.js';
import { ThreadLayout } from './ThreadLayout.js';
import { TypingIndicatorWrapper } from './TypingIndicator.js';

export const Thread: WithByIDComponent<ThreadProps, ThreadByIDProps> =
  Object.assign(
    withCord<React.PropsWithChildren<ThreadProps>>(
      forwardRef(function Thread(
        {
          showHeader = false,
          composerExpanded = 'always',
          threadData,
          className,
          ...restProps
        }: ThreadProps,
        ref: React.ForwardedRef<HTMLDivElement>,
      ) {
        const thread = useMemo(() => threadData?.thread, [threadData?.thread]);
        const messages = useMemo(
          () => threadData?.messages ?? [],
          [threadData?.messages],
        );

        return (
          <ThreadLayout
            className={cx(className, classes.thread)}
            ref={ref}
            canBeReplaced
            threadData={threadData}
            header={
              <ThreadHeader
                canBeReplaced
                key={`thread-header-${thread?.id}`}
                threadID={thread?.id}
                showContextMenu={messages.length > 0}
                hidden={!showHeader}
              />
            }
            messages={messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                showThreadOptions={
                  !showHeader && thread?.firstMessage?.id === message.id
                }
                canBeReplaced
              />
            ))}
            emptyThreadPlaceholder={
              <EmptyThreadPlaceholderWrapper
                key={`placeholder-${thread?.id}`}
                groupID={thread?.groupID}
                threadData={threadData}
              />
            }
            loadingIndicator={
              <LoadingIndicator
                id="thread-loading"
                hidden={!threadData.loading}
                icon={<SpinnerIcon />}
                canBeReplaced
              />
            }
            threadSeenBy={
              <ThreadSeenByWrapper
                key={`seen-by-${thread?.id}`}
                participants={thread?.participants ?? []}
                message={thread?.lastMessage}
              />
            }
            composer={
              <SendComposer
                key={`composer-${thread?.id}`}
                threadID={thread?.id}
                expanded={composerExpanded}
              />
            }
            typingIndicator={
              <TypingIndicatorWrapper
                key={`typing-indicator-${thread?.id}`}
                usersID={thread?.typing}
              />
            }
            {...restProps}
          />
        );
      }),
      'Thread',
      {
        thread: (props: ThreadProps) => props.threadData.thread?.id,
      },
    ),
    { ByID: ThreadByID },
  );

function ThreadByID(props: ByID<ThreadByIDProps>) {
  const { threadID, createThread, replace, ...restProps } = props;
  const threadData = useThread(threadID, { skip: !threadID });
  const { sdk: CordSDK } = useCordContext('Thread.ByID');

  useEffect(() => {
    if (threadData.thread === null && !createThread) {
      console.warn(`Thread with ID ${threadID} not found.`);
    }
    if (CordSDK && threadData.thread === null && createThread) {
      if (createThread.id && createThread.id !== threadID) {
        console.warn(`threadID and createThread.ID should be the same.`);
      } else {
        void CordSDK.thread
          .createThread({ ...createThread, id: threadID })
          .catch(console.warn);
      }
    }
  }, [createThread, CordSDK, threadID, threadData.thread]);

  return (
    <Replace replace={replace}>
      <Thread threadData={threadData} {...restProps} canBeReplaced />
    </Replace>
  );
}
