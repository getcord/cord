import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';

import { MessageLinkPreviews } from 'external/src/components/ui3/message/MessageLinkPreviews.tsx';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { MessageTruncator2 } from 'external/src/components/chat/message/MessageTruncator.tsx';
import { getUnseenReactions, messageHasTask } from 'external/src/lib/util.ts';
import { PastReactions } from 'external/src/components/chat/message/PastReactions.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { StructuredMessage2 } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { DeepLinkContext } from 'external/src/context/deepLink/DeepLinkContext.ts';
import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import { useMessageSeenObserver2 } from 'external/src/effects/useMessageSeenObserver2.ts';
import { MessageBlockHeader2 } from 'external/src/components/2/MessageBlockHeader2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { useThreadHoverStyles2 } from 'external/src/components/2/hooks/useThreadHoverStyles2.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { MessageOptions2 } from 'external/src/components/2/MessageOptions2.tsx';
import { ActionMessage2 } from 'external/src/components/ui2/ActionMessage2.tsx';
import { MessageAnnotationElement2 } from 'external/src/components/chat/message/contentElements/MessageAnnotationElement2.tsx';
import { getSingleMessageAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { MessageTask2 } from 'external/src/components/chat/message/MessageTask2.tsx';
import { MessageFilesAttachments2 } from 'external/src/components/2/MessageFilesAttachments2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { AnnotationPillDisplayContext } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { useShowThreadListHighlight } from 'external/src/effects/useShowThreadListHighlight.ts';
import { newMessageConfig } from 'external/src/components/2/MessageImpl.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  messageExBlockHeader: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    position: 'relative',
    padding: cssVar('space-2xs'),
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-2xs'),
  },
  messageOptionsButton: {
    position: 'absolute',
    right: `calc(${cssVar('space-3xs')} * -1)`,
    top: `calc(${cssVar('space-xl')} * -1)`,
  },
  messageContents: {
    flex: 1,
    minWidth: 0,
  },
  messageContentAndOptionsContainer: {
    position: 'relative',
    height: 'auto',
  },
  highlightMessage: {
    backgroundColor: cssVar('message-highlight-background-color'),
    borderRadius: cssVar('space-3xs'),
  },
  deletedTombstone: {
    fontStyle: 'italic',
  },
  disableMessage: {
    pointerEvents: 'none',
  },
});

type Props = {
  message: MessageFragment;
  isFirstMessageOfBlock: boolean;
  threadHeaderPresent?: boolean;
  showThreadOptions: boolean;
  showMessageOptions: boolean;
};

export const Message2 = withNewCSSComponentMaybe(
  newMessageConfig,
  React.memo(function Message2({
    message,
    isFirstMessageOfBlock,
    threadHeaderPresent,
    showThreadOptions,
    showMessageOptions,
  }: Props) {
    const { t } = useCordTranslation('message');
    const classes = useStyles();
    const hoverClasses = useThreadHoverStyles2();

    const annotationToShowBelowMessage = getSingleMessageAnnotation(
      message.attachments,
    );

    const { deepLinkInfo, onNavigateToDeepLink, shouldShowDeepLinkHighlight } =
      useContextThrowingIfNoProvider(DeepLinkContext);
    const scrollContainerContext = useContextThrowingIfNoProvider(
      ScrollContainerContext,
    );
    const containerRef = useRef<HTMLDivElement>(null);

    useMessageSeenObserver2(message, containerRef);

    useEffect(() => {
      if (deepLinkInfo?.messageID === message.id) {
        const scrollContainer =
          scrollContainerContext?.scrollContainerRef.current;
        const messageElement = containerRef.current;
        onNavigateToDeepLink();
        if (scrollContainer && messageElement) {
          // Timeout so it fires after fullHeightThread's scroll adjuster
          setTimeout(() => {
            scrollContainer.scrollTo(
              scrollContainer.scrollLeft,
              messageElement.offsetTop - 50,
            );
          }, 0);
        }
      }
    }, [
      deepLinkInfo,
      message.id,
      scrollContainerContext?.scrollContainerRef,
      onNavigateToDeepLink,
    ]);

    const { addReaction, removeReaction } =
      useContextThrowingIfNoProvider(ThreadsContext2);
    const { threadID, threadMode, thread } =
      useContextThrowingIfNoProvider(Thread2Context);
    const { user } = useContextThrowingIfNoProvider(IdentityContext);
    const linkPreviewsEnabled = useFeatureFlag(FeatureFlags.SHOW_LINK_PREVIEWS);
    const unseenReactions = getUnseenReactions(
      thread,
      message,
      user.externalID ?? null,
    );

    const annotationPillDisplay = useContextThrowingIfNoProvider(
      AnnotationPillDisplayContext,
    );
    const hideAnnotationAttachment =
      !!annotationPillDisplay?.hidden && isFirstMessageOfBlock;

    const showDeepLinkHighlight = shouldShowDeepLinkHighlight(
      threadID,
      message,
    );

    const {
      state: { editingMessageID },
    } = useContextThrowingIfNoProvider(ComposerContext);

    const isMessageBeingEdited = editingMessageID === message.id;

    const threadIsHighlighted = useShowThreadListHighlight();

    if (message.type === 'action_message') {
      return (
        <ActionMessage2 message={message as any} forwardRef={containerRef} />
      );
    }

    // The whole thread could be highlighted by logic elsewhere.  If so, do not
    // additionally highlight the message.
    const messageIsHighlighted =
      !threadIsHighlighted && (isMessageBeingEdited || showDeepLinkHighlight);

    const messageOptionsMenu = (
      <MessageOptions2
        threadID={threadID}
        message={message}
        messageIsHighlighted={messageIsHighlighted}
        getClassName={(menuVisible) =>
          hoverClasses[
            menuVisible
              ? 'messageOptionsButtonVisible'
              : 'messageOptionsButtonHidden'
          ]
        }
        showThreadOptions={!threadHeaderPresent && showThreadOptions}
        showMessageOptions={showMessageOptions}
      />
    );

    return (
      <Box2
        forwardRef={containerRef}
        className={cx(classes.message, hoverClasses.message, {
          [classes.highlightMessage]: messageIsHighlighted,
          [classes.disableMessage]: isMessageBeingEdited,
        })}
        data-cy="cord-message"
        data-cord-message-id={message.externalID}
        data-cord-thread-id={thread?.externalID}
        data-cord-group-id={thread?.externalOrgID}
      >
        {/*
        We include the blockHeader here because it makes two things much easier:
        1) Showing the menu button when hovering over the block header
        2) Positioning the menu button correctly
      */}
        {isFirstMessageOfBlock && (
          <MessageBlockHeader2
            message={message}
            optionsMenu={threadHeaderPresent ? null : messageOptionsMenu}
          />
        )}
        {message.deletedTimestamp && threadMode === 'collapsed' ? (
          <MessageBlockRow2 leftElement={null}>
            <Text2
              color={'content-primary'}
              className={classes.deletedTombstone}
            >
              {t('deleted_message', { user: userToUserData(message.source) })}
            </Text2>
          </MessageBlockRow2>
        ) : (
          <MessageBlockRow2 leftElement={null}>
            <div className={classes.messageContents}>
              <div className={classes.messageContentAndOptionsContainer}>
                {threadMode !== 'collapsed' && !isFirstMessageOfBlock && (
                  <Row2 className={classes.messageOptionsButton}>
                    {messageOptionsMenu}
                  </Row2>
                )}
                <MessageTruncator2
                  key={message.id}
                  highlighted={messageIsHighlighted}
                  expandable={threadMode !== 'collapsed'}
                >
                  <StructuredMessage2
                    message={message}
                    content={message.content}
                    wasEdited={!!message.lastUpdatedTimestamp}
                    isMessageBeingEdited={isMessageBeingEdited}
                    hideAnnotationAttachment={hideAnnotationAttachment}
                  />
                  <MessageFilesAttachments2
                    message={message}
                    attachments={message.attachments}
                  />
                  {linkPreviewsEnabled && (
                    <MessageLinkPreviews message={message} />
                  )}
                </MessageTruncator2>
              </div>

              {annotationToShowBelowMessage && !hideAnnotationAttachment && (
                <MessageAnnotationElement2
                  annotationAttachmentID={annotationToShowBelowMessage.id}
                  message={message}
                />
              )}
              {messageHasTask(message) && (
                <MessageTask2
                  message={message}
                  isMessageBeingEdited={isMessageBeingEdited}
                  deepLinked={showDeepLinkHighlight}
                />
              )}
              {message.reactions?.length > 0 && (
                <PastReactions
                  reactions={message.reactions}
                  unseenReactionsUnicode={unseenReactions.map(
                    (reaction) => reaction.unicodeReaction,
                  )}
                  onDeleteReaction={(unicodeReaction) =>
                    removeReaction(threadID, message, unicodeReaction)
                  }
                  onAddReaction={(unicodeReaction) =>
                    addReaction(threadID, message.id, unicodeReaction)
                  }
                />
              )}
            </div>
          </MessageBlockRow2>
        )}
      </Box2>
    );
  }),
);
