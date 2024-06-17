import * as React from 'react';
import { forwardRef, useCallback, useContext } from 'react';

import cx from 'classnames';

import { CordContext } from '../../index.js';
import { isViewerPreviouslyAddedReaction } from '../../common/util.js';
import { useViewerData } from '../../hooks/user.js';
import { useMessage } from '../../hooks/thread.js';
import classes from '../../components/Reactions.css.js';
import * as buttonClasses from '../../components/helpers/Button.classnames.js';
import { useEmojiPicker } from './helpers/EmojiPicker.js';
import { Button } from './helpers/Button.js';
import type { GeneralButtonProps } from './helpers/Button.js';

import withCord from './hoc/withCord.js';

export type ReactionPickButtonProps = {
  onReactionClick: (reaction: string) => void;
} & Omit<GeneralButtonProps, 'buttonAction' | 'ref'>;

/**
 * Button that when triggered opens a reaction/emoji picker.
 * When an emoji has been picked, `onReactionClick` is invoked.
 */
export const ReactionPickButton = withCord<ReactionPickButtonProps>(
  forwardRef<HTMLElement, ReactionPickButtonProps>(
    function ReactionPickButton(props, ref) {
      const { className, onReactionClick, ...restProps } = props;
      // [ONI]-TODO If `WithTooltip` was inside this component, when
      // devs replaced it, they would have to add their own tooltip.
      // If `WithTooltip` was the parent of this component, when devs
      // replaced it, they would have to make sure to pass refs and props
      // correctly for the tooltip to work.

      const pickReactionElement = (
        <Button
          canBeReplaced
          className={cx(className, classes.addReaction, buttonClasses.small)}
          icon="AddEmoji"
          {...restProps}
          buttonAction="select-emoji"
          ref={ref}
        />
      );
      const { EmojiPicker } = useEmojiPicker(
        pickReactionElement,
        onReactionClick,
      );

      return <>{EmojiPicker}</>;
    },
  ),
  'ReactionButton',
);

type UseHandleMessageReaction = {
  messageID?: string;
  threadID?: string;
};
type UseAddRemoveReaction = UseHandleMessageReaction;

export type AddReactionToMessageButtonProps = {
  messageID?: string;
  threadID?: string;
} & Omit<GeneralButtonProps, 'buttonAction'>;

/**
 * Button that opens a reaction/emoji picker.
 * When an emoji is picked it is added or removed to the message.
 */
export const AddReactionToMessageButton = forwardRef<
  HTMLElement,
  AddReactionToMessageButtonProps
>(function AddReactionToMessageButton(
  { messageID, threadID, className, ...rest },
  ref,
) {
  const onReactionPick = useHandleMessageReactionPick({
    messageID,
    threadID,
  });
  return (
    <ReactionPickButton
      canBeReplaced
      onReactionClick={onReactionPick}
      className={cx(className, buttonClasses.colorsSecondary)}
      {...rest}
      ref={ref}
    />
  );
});

export function useAddRemoveReaction({
  messageID,
  threadID,
}: UseAddRemoveReaction) {
  const { sdk: cordSDK } = useContext(CordContext);
  const threadSDK = cordSDK?.thread;
  const message = useMessage(messageID ?? '');
  const onAddReaction = useCallback(
    (unicodeReaction: string) => {
      if (threadSDK && threadID && message?.id) {
        void threadSDK.updateMessage(threadID, message.id, {
          addReactions: [unicodeReaction],
        });
      }
    },
    [message?.id, threadID, threadSDK],
  );

  const onDeleteReaction = useCallback(
    (unicodeReaction: string) => {
      if (threadSDK && threadID && message?.id) {
        void threadSDK.updateMessage(threadID, message.id, {
          removeReactions: [unicodeReaction],
        });
      }
    },
    [message?.id, threadID, threadSDK],
  );
  return { onAddReaction, onDeleteReaction };
}

export function useHandleMessageReactionPick({
  messageID,
  threadID,
}: UseHandleMessageReaction) {
  const message = useMessage(messageID ?? '');
  const viewerData = useViewerData();
  const reactions = message?.reactions;
  const { onAddReaction, onDeleteReaction } = useAddRemoveReaction({
    messageID,
    threadID,
  });
  const handleMessageReactionPick = useCallback(
    (unicodeReaction: string) => {
      if (!reactions) {
        return;
      }
      isViewerPreviouslyAddedReaction(
        viewerData?.id ?? '',
        reactions,
        unicodeReaction,
      )
        ? onDeleteReaction(unicodeReaction)
        : onAddReaction(unicodeReaction);
    },
    [reactions, onAddReaction, onDeleteReaction, viewerData?.id],
  );
  return handleMessageReactionPick;
}
