import { useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { useNavigateToThreadPage } from 'external/src/effects/useNavigateToThreadPage.ts';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import type { MessageParagraphNode } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { isEmptyParagraph } from 'external/src/components/chat/composer/util.ts';
import { messageHasTask } from 'external/src/lib/util.ts';
import { RenderNode } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import { Sizes, MESSAGE_BLOCK_AVATAR_SIZE } from 'common/const/Sizes.ts';
import { LINK_STYLE } from 'common/ui/editorStyles.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { InboxThreadFragment } from 'external/src/graphql/operations.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { findMessageNode } from '@cord-sdk/react/common/lib/messageNode.ts';
import { MessageTimestamp } from 'external/src/components/chat/message/MessageTimestamp.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  allTabThread: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-3xs'),
    cursor: 'pointer',
    '&:hover': {
      boxShadow: cssVar('shadow-small'),
      color: cssVar('color-content-emphasis'),
    },
    '&:hover $openPageIcon': {
      visibility: 'visible',
    },
    '&:hover $iconContainer > :not($openPageIcon)': {
      visibility: 'hidden',
    },
    color: cssVar('color-content-primary'),
  },
  iconImg: {
    width: cssVar('space-m'),
    height: cssVar('space-m'),
  },
  clippedMessageRow: {
    backgroundColor: cssVar('color-base-strong'),
    borderRadius: cssVar('border-radius-medium'),
  },
  // TODO - update with new editor styles when ready
  clippedMessageContainer: {
    flex: 1,
    height: Sizes.DEFAULT_LINE_HEIGHT_PX,
    overflow: 'hidden',
    // Override editor styling
    '& p, & span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: cssVar('space-xs'),
      whiteSpace: 'nowrap',
    },
    '& a': {
      ...LINK_STYLE,
      pointerEvents: 'none',
    },
  },
  iconContainer: {
    lineHeight: 0,
    width: cssVar('space-m'),
    height: cssVar('space-m'),
  },
  openPageIcon: {
    position: 'absolute',
    visibility: 'hidden',
  },
});

type AllTabThread2Props = {
  thread: InboxThreadFragment;
};

export function AllTabThread2({ thread }: AllTabThread2Props) {
  const classes = useStyles();
  const name = thread.name ?? 'Unknown';
  const url = thread.url;

  const { logEvent } = useLogger();

  const openThreadPage = useNavigateToThreadPage({
    url,
    threadID: thread.id,
    externalThreadID: thread.externalID,
    targetOrgID: thread.externalOrgID,
    location: thread.location,
  });
  const onOpenThreadPage = useCallback(
    (event: MouseEvent | React.MouseEvent<HTMLElement, MouseEvent>) => {
      logEvent('navigate-to-thread', {
        from: 'activity',
        unread: Boolean(thread.newMessagesCount),
      });
      event.stopPropagation();
      void openThreadPage();
    },
    [logEvent, openThreadPage, thread.newMessagesCount],
  );

  const message = thread.messages[thread.messages.length - 1];

  const snippet: string | MessageParagraphNode = useMemo(() => {
    if (message.deletedTimestamp) {
      return 'Message deleted';
    }

    const authorName = message.source.displayName;

    const firstParagraph = findMessageNode(
      message.content,
      MessageNodeType.PARAGRAPH,
    );
    if (firstParagraph && !isEmptyParagraph(firstParagraph)) {
      return firstParagraph;
    }
    if (messageHasTask(message)) {
      return `${authorName} added a task`;
    }

    if (
      message.attachments.some(
        (attachment) => attachment.__typename === 'MessageAnnotationAttachment',
      )
    ) {
      return `${authorName} sent an annotation`;
    }

    if (
      message.attachments.some(
        (attachment) => attachment.__typename === 'MessageFileAttachment',
      )
    ) {
      return `${authorName} sent an attachment`;
    }

    // This shouldn't happen
    return `${authorName} sent a message`;
  }, [message]);

  return (
    <Box2
      borderColor="base-x-strong"
      borderRadius="medium"
      padding="3xs"
      className={classes.allTabThread}
      onClick={onOpenThreadPage}
    >
      {/* This is similar to InboxThreadHeader. We don't use InboxThreadHeader because
          it relies on ThreadsContext being present. ActivityThreads are simpler and
          not contained in context */}
      <MessageBlockRow2
        paddingVertical="2xs"
        paddingLeft="2xs"
        paddingRight="3xs"
        leftElement={
          <div className={classes.iconContainer}>
            <Icon2
              size="small"
              name="ArrowSquareOut"
              color="inherit"
              className={classes.openPageIcon}
            />
            {thread.resolved && (
              <Icon2 size="small" name="CheckCircle" color="inherit" />
            )}
          </div>
        }
      >
        <Link2
          href={url}
          linkStyle="secondary-small"
          color="inherit"
          ellipsis
          preventDefault
        >
          {name}
        </Link2>
      </MessageBlockRow2>
      <MessageBlockRow2
        leftElement={
          <Avatar2
            user={userToUserData(message.source)}
            size={MESSAGE_BLOCK_AVATAR_SIZE}
          />
        }
        className={classes.clippedMessageRow}
        padding="2xs"
      >
        <Box2 className={classes.clippedMessageContainer}>
          {typeof snippet === 'string' ? (
            <p>{snippet}</p>
          ) : (
            <RenderNode node={snippet} message={message} index={0} />
          )}
        </Box2>
        <MessageTimestamp
          isoDateString={message.timestamp}
          relative={false}
          translationNamespace="message"
        />
      </MessageBlockRow2>
    </Box2>
  );
}
