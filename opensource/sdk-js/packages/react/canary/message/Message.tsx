import * as React from 'react';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import withCord from '../../experimental/components/hoc/withCord.js';
import * as buttonClasses from '../../components/helpers/Button.classnames.js';

import {
  Avatar,
  Button,
  MessageContent,
  OptionsMenu,
  Timestamp,
  Reactions,
  MessageLayout,
  Replace,
} from '../../betaV2.js';
import { EditComposer } from '../composer/Composer.js';
import { useViewerData } from '../../hooks/user.js';
import type {
  ByID,
  MessageByIDProps,
  MessageProps,
  WithByIDComponent,
} from '../../betaV2.js';
import { AddReactionToMessageButton } from '../../experimental/components/ReactionPickButton.js';
import { useComposedRefs } from '../../common/lib/composeRefs.js';
import { useExtraClassnames } from '../../hooks/useExtraClassnames.js';
import { MODIFIERS } from '../../common/ui/modifiers.js';
import { useMessage } from '../../hooks/thread.js';
import * as classes from '../../components/Message.classnames.js';
import { useComponentUserData } from '../../experimental/hooks/useComponentUserData.js';
import { Username } from './Username.js';
import { MessageTombstoneWrapper } from './MessageTombstone.js';
import { ActionMessage } from './ActionMessage.js';
import { useMessageSeenObserver } from './hooks/useMessageSeenObserver.js';

export const Message: WithByIDComponent<MessageProps, MessageByIDProps> =
  Object.assign(
    withCord<React.PropsWithChildren<MessageProps>>(
      forwardRef(function Message(
        {
          message,
          className,
          showThreadOptions = false,
          ...restProps
        }: MessageProps,
        ref: React.ForwardedRef<HTMLElement>,
      ) {
        const [isEditing, setIsEditing] = useState(false);

        const onCancel = useCallback(() => {
          setIsEditing(false);
        }, []);

        const authorData = useComponentUserData(message.authorID);
        const metaCordClasses = useExtraClassnames(message.extraClassnames);

        const messageObserverRef = useMessageSeenObserver(message);
        const composedRef = useComposedRefs<Element | null>(
          ref,
          messageObserverRef,
        );

        const viewerData = useViewerData();
        const avatarElement = useMemo(() => {
          return <Avatar canBeReplaced user={authorData} />;
        }, [authorData]);
        const messageContentElement = useMemo(() => {
          return (
            <MessageContent
              messageID={message.id}
              content={message.content}
              createdAt={message.createdTimestamp}
              authorData={authorData}
              attachments={message.attachments}
              edited={!!message.updatedTimestamp}
              canBeReplaced
            />
          );
        }, [message, authorData]);

        const authorNameElement = useMemo(() => {
          return <Username canBeReplaced userData={authorData} />;
        }, [authorData]);

        const timestampElement = useMemo(() => {
          return (
            <Timestamp
              canBeReplaced
              value={message.createdTimestamp}
              type="message"
            />
          );
        }, [message.createdTimestamp]);

        const optionsMenuElement = useMemo(() => {
          return (
            <OptionsMenu
              canBeReplaced
              message={message}
              threadID={message.threadID}
              button={
                <Button
                  buttonAction="show-message-options"
                  icon="DotsThree"
                  className={cx(
                    buttonClasses.small,
                    buttonClasses.colorsSecondary,
                  )}
                  canBeReplaced
                />
              }
              showThreadOptions={showThreadOptions}
              showMessageOptions
              setEditing={setIsEditing}
            />
          );
        }, [message, showThreadOptions]);

        const emojiPickerElement = useMemo(() => {
          return (
            <AddReactionToMessageButton
              messageID={message.id}
              threadID={message.threadID}
            />
          );
        }, [message.id, message.threadID]);

        const reactionsElement = useMemo(() => {
          return (
            <Reactions
              canBeReplaced
              messageID={message.id}
              threadID={message.threadID}
              showReactionList
              showAddReactionButton={message.reactions.length > 0}
            />
          );
        }, [message.id, message.threadID, message.reactions]);

        if (isEditing) {
          return (
            <EditComposer
              ref={composedRef}
              className={cx(className, classes.message, metaCordClasses)}
              messageID={message.id}
              initialValue={message}
              onAfterSubmit={() => {
                setIsEditing(false);
              }}
              onCancel={onCancel}
              autofocus
            />
          );
        }
        if (message.deletedTimestamp) {
          return (
            <MessageTombstoneWrapper
              ref={composedRef}
              className={cx(className, classes.message, metaCordClasses)}
              message={message}
            />
          );
        }

        if (message.type === 'action_message') {
          return (
            <ActionMessage
              ref={composedRef}
              message={message}
              canBeReplaced
              className={cx(className, classes.message, metaCordClasses)}
              {...restProps}
            />
          );
        }

        return (
          <MessageLayout
            ref={composedRef}
            canBeReplaced
            className={cx(className, classes.message, metaCordClasses, {
              [MODIFIERS.noReactions]: message.reactions?.length === 0,
              [MODIFIERS.unseen]: !message.seen,
              [MODIFIERS.fromViewer]: viewerData?.id === message.authorID,
            })}
            message={message}
            avatar={avatarElement}
            messageContent={messageContentElement}
            authorName={authorNameElement}
            timestamp={timestampElement}
            optionsMenu={optionsMenuElement}
            emojiPicker={emojiPickerElement}
            reactions={reactionsElement}
            {...restProps}
          />
        );
      }),
      'Message',
      {
        message: (props) => props.message.id,
        thread: (props) => props.message.threadID,
        user: (props) => props.message.authorID,
      },
    ),
    { ByID: MessageByID },
  );
function MessageByID(props: ByID<MessageByIDProps>) {
  const { messageID, replace, ...restProps } = props;
  const message = useMessage(messageID);

  if (!message) {
    return null;
  }

  return (
    <Replace replace={replace}>
      <Message message={message} {...restProps} canBeReplaced />
    </Replace>
  );
}
