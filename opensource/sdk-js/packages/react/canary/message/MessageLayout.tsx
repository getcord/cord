import * as React from 'react';
import { forwardRef } from 'react';

import type { ClientMessageData } from '@cord-sdk/types';
import withCord from '../../experimental/components/hoc/withCord.js';
import * as classes from '../../components/Message.classnames.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';

export type MessageLayoutProps = {
  message: ClientMessageData;
  messageContent: JSX.Element;
  avatar: JSX.Element;
  emojiPicker: JSX.Element;
  timestamp: JSX.Element;
  optionsMenu: JSX.Element;
  reactions: JSX.Element;
  authorName: JSX.Element;
} & StyleProps &
  MandatoryReplaceableProps;

/**
 * Replacing MessageLayout enables rendering Message components
 * in any layout. This allows you to completely change the DOM structure,
 * and achieve design that would be hard or impossible with CSS alone.
 *
 * Through the props you get all elements of the message, already rendered.
 */
export const MessageLayout = withCord<
  React.PropsWithChildren<MessageLayoutProps>
>(
  forwardRef(function MessageLayout(
    props: MessageLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      message,
      avatar,
      timestamp,
      optionsMenu,
      emojiPicker,
      messageContent,
      reactions,
      authorName,
      className,
      ...restProps
    } = props;

    return (
      <div
        {...restProps}
        className={className}
        ref={ref}
        data-cord-message-id={message.id}
        data-cord-thread-id={message.threadID}
      >
        {avatar}
        {authorName}
        {timestamp}
        <div className={classes.messageOptionsButtons}>
          {optionsMenu}
          {emojiPicker}
        </div>
        {messageContent}
        {reactions}
      </div>
    );
  }),
  'MessageLayout',
);
