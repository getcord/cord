import { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';

import { PHOSPHOR_ICONS } from '@cord-sdk/react/components/helpers/Icon.tsx';
import { useCordTranslation } from '@cord-sdk/react';
import { useViewerData } from '@cord-sdk/react/hooks/user.ts';
import { SlackIcon } from '@cord-sdk/react/common/icons/customIcons/SlackIcon.tsx';
import { MESSAGE_BLOCK_AVATAR_SIZE } from 'common/const/Sizes.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { MessageOptions } from 'external/src/components/ui3/MessageOptions.tsx';
import { useMessageSeenObserver2 } from 'external/src/effects/useMessageSeenObserver2.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import {
  canUndoMessageDelete,
  getUnseenReactions,
  isUserAuthorOfMessage,
} from 'external/src/lib/util.ts';
import { MessageContentImpl } from 'external/src/components/2/MessageContentImpl.tsx';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { Link } from 'external/src/components/ui3/Link.tsx';
import { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import * as classes from 'external/src/components/2/MessageImpl.css.ts';
import * as fonts from 'common/ui/atomicClasses/fonts.css.ts';
import * as icons from 'common/ui/atomicClasses/icons.css.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import { useComposerController } from 'external/src/components/chat/composer/composerController.tsx';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { MessageTimestamp } from 'external/src/components/ui3/MessageTimestamp.tsx';
import { ComposerProvider } from 'external/src/context/composer/ComposerProvider.tsx';
import { ReactionsImpl } from 'external/src/components/2/ReactionsImpl.tsx';
import type { MessageInfo, MessageWebComponentEvents } from '@cord-sdk/types';
import { ActionMessage } from 'external/src/components/ui3/ActionMessage.tsx';
import type { UndeletedMessage } from 'external/src/graphql/custom.ts';
import { useExtraClassnames } from '@cord-sdk/react/hooks/useExtraClassnames.ts';
import { useMessageAuthor } from 'external/src/components/chat/message/useMessageAuthor.tsx';
import { useSetComposerToEditMode } from 'external/src/effects/useSetComposerEditMode.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import {
  getMessageData,
  getThreadSummary,
} from 'common/util/convertToExternal/thread.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { useTime } from '@cord-sdk/react/common/effects/useTime.tsx';

type Props = {
  message: MessageFragment;
  isFirstMessageOfThread?: boolean; // Cord 3.0 way of choosing which options to show in the menu
  showThreadOptions?: boolean; // Cord 2.0 way of choosing which options to show in the menu
  onClick?: (messageInfo: MessageInfo) => unknown;
  onMouseEnter?: (messageInfo: MessageInfo) => unknown;
  onMouseLeave?: (messageInfo: MessageInfo) => unknown;
  isEditing?: boolean;
};
export function MessageImpl({
  message,
  showThreadOptions,
  isFirstMessageOfThread,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isEditing,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useMessageSeenObserver2(message, containerRef);
  const { addReaction, removeReaction } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const { threadID, thread } = useContextThrowingIfNoProvider(Thread2Context);
  const viewerData = useViewerData();
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const { editingMessageID } = useComposerController({
    isDraftThread: false,
    externalOrgID: thread?.externalOrgID ?? organization?.externalID,
    requestMentionableUsers: false,
  });
  const { clearComposer } = useContextThrowingIfNoProvider(ComposerContext);
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const setMessageToEditMode = useSetComposerToEditMode();
  useEffect(() => {
    if (isEditing) {
      setMessageToEditMode({
        message,
        thread,
        messageRef: containerRef,
      });
    }
  }, [setMessageToEditMode, message, isEditing, thread]);

  const unseenReactions = getUnseenReactions(thread, message, viewerData?.id);

  const [hasOverflow, setHasOverflow] = useState(false);

  const nameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nameRef.current) {
      setHasOverflow(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
    return;
  }, []);

  const author = useMessageAuthor(message);
  const metaCordClasses = useExtraClassnames(message.extraClassnames);
  const isReplyFromSlack = message.importedSlackMessageType === 'reply';
  const isReplyFromEmail = message.isFromEmailReply;
  const isMessageDeleted = !!message.deletedTimestamp;
  const isMessageSeen = message.seen;
  const isMessageBeingEdited = !!editingMessageID;
  const isActionMessage = message.type === 'action_message';

  const dispatchMessageEditEndEvent = useCallback(() => {
    containerRef.current?.dispatchEvent(
      new CustomEvent<MessageWebComponentEvents['editend']>(
        `cord-message:editend`,
        {
          bubbles: true,
          composed: true,
          detail: [
            {
              threadId: thread!.externalID,
              messageId: message.externalID,
              thread: getThreadSummary(thread!, userByInternalID),
              message: getMessageData({
                message,
                thread: thread!,
                userByInternalID,
              }),
            },
          ],
        },
      ),
    );
  }, [message, thread, userByInternalID]);

  const handleCloseComposer = useCallback(() => {
    clearComposer();
    dispatchMessageEditEndEvent?.();
  }, [clearComposer, dispatchMessageEditEndEvent]);

  if (!thread) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cx(classes.message, metaCordClasses, {
        [MODIFIERS.noReactions]: message.reactions?.length === 0,
        [MODIFIERS.deleted]: isMessageDeleted,
        [MODIFIERS.action]: isActionMessage,
        [MODIFIERS.unseen]: !isMessageSeen,
        [MODIFIERS.editing]: isMessageBeingEdited,
        [MODIFIERS.fromViewer]: viewerData?.id === message.source.externalID,
      })}
      data-cy="cord-message"
      data-cord-message-id={message.externalID}
      data-cord-thread-id={thread.externalID}
      data-cord-group-id={thread.externalOrgID}
      onClick={() =>
        onClick?.({
          threadId: thread.externalID,
          messageId: message.externalID,
          thread: getThreadSummary(thread, userByInternalID),
          message: getMessageData({ message, thread, userByInternalID }),
        })
      }
      onMouseEnter={() =>
        onMouseEnter?.({
          threadId: thread.externalID,
          messageId: message.externalID,
          thread: getThreadSummary(thread, userByInternalID),
          message: getMessageData({ message, thread, userByInternalID }),
        })
      }
      onMouseLeave={() =>
        onMouseLeave?.({
          threadId: thread.externalID,
          messageId: message.externalID,
          thread: getThreadSummary(thread, userByInternalID),
          message: getMessageData({ message, thread, userByInternalID }),
        })
      }
    >
      {isMessageDeleted && <DeletedMessageElement message={message} />}
      {isActionMessage && (
        <ActionMessage
          message={
            message as unknown as UndeletedMessage & {
              type: 'action_message';
            }
          }
          forwardRef={containerRef}
        />
      )}
      {!isMessageDeleted && !isActionMessage && (
        <>
          <Avatar
            user={userToUserData(author)}
            size={MESSAGE_BLOCK_AVATAR_SIZE}
          />

          {isMessageBeingEdited ? (
            <Composer3
              showCloseButton={true}
              onClose={handleCloseComposer}
              showEditingBanner={false}
              size={'small'}
              dispatchMessageEditEndEvent={dispatchMessageEditEndEvent}
            />
          ) : (
            <>
              <WithTooltip
                label={author.displayName}
                tooltipDisabled={!hasOverflow}
              >
                <div
                  className={cx(classes.authorName, fonts.fontBodyEmphasis)}
                  ref={nameRef}
                >
                  {author.displayName}
                </div>
              </WithTooltip>
              <MessageTimestamp
                value={message.timestamp}
                relative={true}
                translationNamespace="message"
              />
              {(isReplyFromSlack || isReplyFromEmail) && (
                <div className={classes.sentViaIcon}>
                  {isReplyFromSlack && (
                    <ReplyFromSlackElement slackURL={message.slackURL} />
                  )}
                  {isReplyFromEmail && <ReplyFromEmailElement />}
                </div>
              )}
              {/* TODO (nickfil22): Enable MessageOptions */}
              <div className={classes.optionsMenuTrigger}>
                <MessageOptions
                  threadID={threadID}
                  message={message}
                  // TODO (nickfil22): It is hardcoded as false as message highlighting is
                  // a PR by itself
                  messageIsHighlighted={false}
                  showThreadOptions={
                    isFirstMessageOfThread ?? showThreadOptions ?? false
                  }
                  showMessageOptions={true}
                  orientation={'vertical'}
                  messageRef={containerRef}
                />
              </div>
              <MessageContentImpl
                message={message}
                content={message.content!}
                attachments={message.attachments}
                edited={!!message.lastUpdatedTimestamp}
              />
              {message.reactions?.length > 0 && (
                <ReactionsImpl
                  showAddReactionButton
                  showReactionList
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
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReplyFromSlackElement({ slackURL }: { slackURL: string | null }) {
  const { t } = useCordTranslation('message');
  return (
    <WithTooltip label={t('sent_via_slack_tooltip')}>
      {slackURL ? (
        <Link linkStyle="secondary-small" href={slackURL} newTab={true}>
          <SlackIcon className={icons.iconSmall} />
        </Link>
      ) : (
        <SlackIcon className={icons.iconSmall} />
      )}
    </WithTooltip>
  );
}

function ReplyFromEmailElement() {
  const { t } = useCordTranslation('message');
  return (
    <WithTooltip label={t('sent_via_email_tooltip')}>
      <PHOSPHOR_ICONS.EnvelopeSimple className={icons.iconSmall} />
    </WithTooltip>
  );
}

function DeletedMessageElement({ message }: { message: MessageFragment }) {
  const { t } = useCordTranslation('message');
  const identityContext = useContextThrowingIfNoProvider(IdentityContext);
  const time = useTime();
  const { undoDeleteMessage } = useMessageUpdater();

  if (!message.deletedTimestamp) {
    return <></>;
  }

  const userId = identityContext.user.externalID;
  const canUndoDelete =
    isUserAuthorOfMessage(message, userId) &&
    canUndoMessageDelete(new Date(message.deletedTimestamp), time);

  const onUndoDeleteButtonClicked = () => undoDeleteMessage?.(message.id);

  return (
    <>
      <PHOSPHOR_ICONS.Trash
        className={cx(icons.iconLarge, classes.deletedIcon)}
      />
      <div className={cx(classes.deletedMessageText, fonts.fontSmall)}>
        {t('deleted_message', { user: userToUserData(message.source) })}
        {canUndoDelete && (
          <div
            className={cx(classes.undoDeleteButton)}
            onClick={onUndoDeleteButtonClicked}
          >
            {t('undo_delete_action')}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * This is used by Cord 2.0 world.
 * ThreadedComments uses MessageImpl directly.
 */
function MessageConversionLayer(props: {
  /**
   * In Cord 2.0, if a user sends messages in quick succession, these
   * are grouped together in "blocks". The first message of the block
   * has the avatar, user name, etc. All the following ones don't.
   * In Cord 3.0, blocks exist in the DOM, but there is *no* visual difference.
   * TODO: Figure out what to do with blocks -- show them? Don't show them?
   */
  isFirstMessageOfBlock: boolean;
  threadHeaderPresent?: boolean;
  showThreadOptions: boolean;
  showMessageOptions: boolean;
  message: MessageFragment;
}) {
  return (
    <ComposerProvider>
      <MessageImpl
        message={props.message}
        showThreadOptions={props.showThreadOptions}
      />
    </ComposerProvider>
  );
}
export const newMessageConfig = {
  NewComp: MessageConversionLayer,
  configKey: 'message',
} as const;
