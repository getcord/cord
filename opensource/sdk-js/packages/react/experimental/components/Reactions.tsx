import * as React from 'react';
import cx from 'classnames';

import { forwardRef, useMemo } from 'react';
import type {
  ClientMessageData,
  Reaction,
  ThreadSummary,
} from '@cord-sdk/types';
import {
  getUnseenReactions,
  isViewerPreviouslyAddedReaction,
} from '../../common/util.js';
import { useUsersByReactions } from '../../common/effects/useUsersByReactions.js';
import { useMessage, useThread } from '../../hooks/thread.js';
import { useCordTranslation } from '../../index.js';
import classes from '../../components/Reactions.css.js';
import { useViewerData } from '../../hooks/user.js';
import type { StyleProps } from '../../betaV2.js';
import {
  AddReactionToMessageButton,
  useAddRemoveReaction,
} from './ReactionPickButton.js';
import withCord from './hoc/withCord.js';
import { DefaultTooltip, WithTooltip } from './WithTooltip.js';
import { ReactionPill } from './message/ReactionPill.js';
import type { MandatoryReplaceableProps } from './replacements.js';

export type ReactionsProps = {
  threadID?: string;
  messageID?: string;
  showAddReactionButton?: boolean;
  showReactionList?: boolean;
} & StyleProps &
  MandatoryReplaceableProps;

export const Reactions = withCord<React.PropsWithChildren<ReactionsProps>>(
  React.forwardRef(function Reactions(
    {
      threadID,
      messageID,
      showAddReactionButton = true,
      showReactionList = true,
      className,
      style,
      ...restProps
    }: ReactionsProps,
    ref?: React.ForwardedRef<HTMLDivElement>,
  ) {
    const viewerData = useViewerData();
    const { thread } = useThread(threadID, { skip: !threadID });
    const message = useMessage(messageID ?? '');

    if (!thread || !message) {
      return (
        <>
          {showAddReactionButton && (
            <div
              style={style}
              className={cx(classes.reactionsContainer, className)}
            >
              <AddReactionToMessageButton
                threadID={threadID}
                messageID={messageID}
                disabled={true}
                {...restProps}
              />
            </div>
          )}
        </>
      );
    }

    const unseenReactionsUnicode = getUnseenReactions(
      thread,
      message,
      viewerData?.id,
    ).map((reaction) => reaction.reaction);

    return (
      <ReactionsInner
        className={className}
        style={style}
        ref={ref}
        reactions={message.reactions}
        unseenReactionsUnicode={unseenReactionsUnicode}
        showAddReactionButton={showAddReactionButton}
        showReactionList={showReactionList}
        thread={thread}
        message={message}
        {...restProps}
      />
    );
  }),
  'Reactions',
);

export type ReactionsInnerProps = {
  reactions: Reaction[];
  unseenReactionsUnicode: string[];
  showAddReactionButton: boolean;
  showReactionList: boolean;
  thread: ThreadSummary;
  message: ClientMessageData;
} & StyleProps;

const ReactionsInner = forwardRef(function ReactionsImpl(
  {
    reactions,
    unseenReactionsUnicode,
    showAddReactionButton,
    showReactionList,
    className,
    thread,
    message,
    ...rest
  }: ReactionsInnerProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const viewerData = useViewerData();

  const usersByReaction = useUsersByReactions(reactions);
  const { onAddReaction, onDeleteReaction } = useAddRemoveReaction({
    threadID: thread.id,
    messageID: message.id,
  });

  const addReactionButton = useMemo(() => {
    return (
      <WithTooltip tooltip={<AddReactionsButtonTooltip />}>
        <AddReactionToMessageButton
          messageID={message.id}
          threadID={thread.id}
        />
      </WithTooltip>
    );
  }, [message.id, thread.id]);
  return (
    <div
      className={cx(classes.reactionsContainer, className)}
      ref={ref}
      {...rest}
    >
      {showReactionList ? (
        <div className={classes.reactionList}>
          {Object.entries(usersByReaction).map(([unicodeReaction, users]) => (
            <ReactionPill
              key={unicodeReaction}
              unicodeReaction={unicodeReaction}
              users={users}
              unseen={unseenReactionsUnicode.includes(unicodeReaction)}
              onAddReaction={onAddReaction}
              onDeleteReaction={onDeleteReaction}
              isViewerReaction={isViewerPreviouslyAddedReaction(
                viewerData?.id ?? '',
                reactions,
                unicodeReaction,
              )}
            />
          ))}
          {showAddReactionButton && addReactionButton}
        </div>
      ) : (
        showAddReactionButton && addReactionButton
      )}
    </div>
  );
});

function AddReactionsButtonTooltip() {
  const { t } = useCordTranslation('message');

  return <DefaultTooltip label={t('add_reaction_action')} />;
}
