import { useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { createPortal } from 'react-dom';

import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { Colors } from 'common/const/Colors.ts';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: ZINDEX.modal,
  },
  debugInformation: {
    background: Colors.GREY_X_LIGHT,
    border: '1px solid ' + Colors.GREY_LIGHT,
    color: 'black',
    fontFamily: 'monospace',
    fontSize: '10px',
    lineHeight: '1.3em',
    maxHeight: '75vh',
    overflow: 'auto',
    padding: '2px 4px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
});

type Props = {
  message?: MessageFragment;
  close: () => void;
};

export function DebugInfo2({ message, close }: Props) {
  const classes = useStyles();
  const debugRef = useRef<HTMLPreElement>(null);
  useEscapeListener(close);
  useClickOutside({ onMouseDown: close, elementRef: debugRef });
  const pageContext = useContextThrowingIfNoProvider(PageContext);

  const thread = useThreadData();
  const sharedToSlack = thread?.sharedToSlack; // Can see slackChannelID and slackMessageTimestamp in slackURL

  return createPortal(
    <div className={classes.container}>
      <pre className={classes.debugInformation} ref={debugRef}>
        {message
          ? JSON.stringify(
              {
                message,
                threadID: thread?.id,
                pageContext,
                sharedToSlack,
              },
              null,
              '  ',
            )
          : JSON.stringify(
              {
                threadID: thread?.id,
                threadName: thread?.name,
                hasNewMessages: thread?.hasNewMessages,
                firstUnseenMessageID: thread?.firstUnseenMessageID,
                allMessagesCount: thread?.allMessagesCount,
                replyCount: thread?.replyCount,
                messagesCountExcludingDeleted:
                  thread?.messagesCountExcludingDeleted,
                newMessagesCount: thread?.newMessagesCount,
                newReactionCount: thread?.newReactionsCount,
                olderMessagesCount: thread?.olderMessagesCount,
                viewerIsThreadParticipant: thread?.viewerIsThreadParticipant,
                participants: thread?.participants,
                replyingUserIDs: thread?.replyingUserIDs,
                pageContext,
                sharedToSlack: sharedToSlack,
                subscribed: thread?.subscribed,
                resolved: thread?.resolved,
              },
              null,
              '  ',
            )}
      </pre>
    </div>,
    document.body,
  );
}
