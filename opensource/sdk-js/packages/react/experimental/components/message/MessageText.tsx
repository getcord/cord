import * as React from 'react';
import cx from 'classnames';

import { MessageNodeType } from '@cord-sdk/types';
import type {
  ClientMessageData,
  FormatStyle,
  MessageContent,
  MessageNode,
} from '@cord-sdk/types';
import Linkify from 'linkify-react';
import { MessageBulletElement } from '../../../components/message/MessageBulletElement.js';
import { EditedMessage } from '../../../components/message/EditedMessage.js';
import { getMessageNodeChildren } from '../../../common/lib/messageNode.js';
import { PARAGRAPH_STYLE } from '../../../common/lib/styles.js';
import { wrapTextNodeWithStyles } from '../editor/render.js';
import * as classes from '../../../components/message/MessageText.css.js';
import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import type { StyleProps } from '../../types.js';
import { useTranslatedMessageContent } from '../../../hooks/useTranslatedMessageContent.js';
import { MessageUserReferenceElement } from './MessageUserReferenceElement.js';

export type MessageTextProps = {
  message: ClientMessageData | null | undefined;
  content: MessageContent | null | undefined;
  wasEdited: boolean;
  isMessageBeingEdited?: boolean;
  hideAnnotationAttachment: boolean;
  formatStyle?: FormatStyle;
} & StyleProps &
  MandatoryReplaceableProps;

export const MessageText = withCord<React.PropsWithChildren<MessageTextProps>>(
  React.forwardRef(function MessageText(
    {
      message,
      content,
      wasEdited,
      isMessageBeingEdited,
      hideAnnotationAttachment,
      formatStyle,
      className,
      ...restProps
    }: MessageTextProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const showEditMessage = wasEdited || isMessageBeingEdited;
    return (
      <div
        dir="auto"
        className={cx(className, classes.messageText)}
        ref={ref}
        {...restProps}
      >
        {content && (
          <RenderedContent
            nodes={content}
            message={message}
            showEditMessage={showEditMessage}
            isMessageBeingEdited={isMessageBeingEdited}
            hideAnnotationAttachment={hideAnnotationAttachment}
            formatStyle={formatStyle}
          />
        )}
      </div>
    );
  }),
  'MessageText',
);

function RenderedContent(props: {
  nodes: MessageContent;
  message: ClientMessageData | null | undefined;
  parent?: MessageNode;
  showEditMessage?: boolean;
  isMessageBeingEdited?: boolean;
  hideAnnotationAttachment?: boolean;
  formatStyle?: FormatStyle;
}) {
  const translated = useTranslatedMessageContent(
    props.message?.translationKey,
    props.nodes,
  );
  return messageContent({ ...props, nodes: translated });
}

function messageContent({
  nodes,
  message,
  parent,
  showEditMessage,
  isMessageBeingEdited,
  formatStyle,
}: {
  nodes: MessageContent;
  message: ClientMessageData | null | undefined;
  parent?: MessageNode;
  showEditMessage?: boolean;
  isMessageBeingEdited?: boolean;
  hideAnnotationAttachment?: boolean;
  formatStyle?: FormatStyle;
}) {
  // If applicable, (Edited) is tagged on as a new <p> at the end of the message,
  // unless the last node was a <p> in which case it is embedded inside as a <span>
  let editedTagIncludedInline = false;

  const content = nodes.map((node, index) => {
    const includeEditedTag =
      showEditMessage &&
      index === nodes.length - 1 &&
      node.type === MessageNodeType.PARAGRAPH;
    if (includeEditedTag) {
      editedTagIncludedInline = true;
    }
    return (
      <RenderNode
        key={index}
        node={node}
        message={message}
        index={index}
        parent={parent}
        showEditMessage={includeEditedTag}
        isMessageBeingEdited={!!isMessageBeingEdited}
        formatStyle={formatStyle}
      />
    );
  });
  if (showEditMessage && !editedTagIncludedInline) {
    content.push(
      <EditedMessage
        as={'p'}
        key={'edited-message'}
        isMessageBeingEdited={!!isMessageBeingEdited}
      />,
    );
  }
  return content;
}

export function RenderNode({
  node,
  message,
  index,
  parent,
  showEditMessage,
  isMessageBeingEdited,
  formatStyle = 'normal',
}: {
  node: MessageNode;
  message: ClientMessageData | null | undefined;
  index: number;
  parent?: MessageNode;
  showEditMessage?: boolean;
  isMessageBeingEdited?: boolean;
  hideAnnotationAttachment?: boolean;
  formatStyle?: FormatStyle;
}): JSX.Element | null {
  switch (node.type) {
    case MessageNodeType.BULLET:
      return (
        <MessageBulletElement key={index} className={node.class}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </MessageBulletElement>
      );
    case MessageNodeType.CODE:
      return (
        <pre key={index} className={node.class}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </pre>
      );
    case MessageNodeType.LINK:
      return (
        <a
          key={index}
          className={node.class}
          href={node.url}
          target="_blank"
          rel="noreferrer"
        >
          {/* Pass parent node so we know not to nest another <a> tag */}
          {messageContent({
            nodes: node.children,
            message,
            parent: node,
            formatStyle,
          })}
        </a>
      );
    case MessageNodeType.MENTION:
    case MessageNodeType.ASSIGNEE:
      return (
        <MessageUserReferenceElement
          canBeReplaced
          key={index}
          className={node.class}
          userID={node.user.id}
          nodeType={node.type}
          formatStyle={formatStyle}
        />
      );
    case MessageNodeType.NUMBER_BULLET:
      return (
        <MessageBulletElement
          key={index}
          className={node.class}
          bulletNumber={node.bulletNumber}
        >
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </MessageBulletElement>
      );
    case MessageNodeType.PARAGRAPH:
      return (
        <p key={index} className={node.class} style={PARAGRAPH_STYLE}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
          {/* If applicable, (Edited) is tagged on as a new <p> at the end of the message, 
            unless the last node was a <p> in which case it is embedded inside as a <span> */}
          {showEditMessage && (
            <EditedMessage
              as={'span'}
              isMessageBeingEdited={!!isMessageBeingEdited}
              key={'edited-message'}
            />
          )}
        </p>
      );
    case MessageNodeType.QUOTE:
      return (
        <blockquote key={index} className={node.class} style={PARAGRAPH_STYLE}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </blockquote>
      );
    case MessageNodeType.TODO:
      // [ONI]-TODO maybe implement?
      return null;
    case MessageNodeType.MARKDOWN:
      // TODO: MARKDOWN_NODE fix presentation
      return (
        <React.Fragment key={index}>
          {messageContent({ nodes: node.children, message, formatStyle })}
        </React.Fragment>
      );
    default: {
      // it's probably text
      if (node.text !== undefined) {
        if (parent?.type === MessageNodeType.LINK) {
          return (
            <React.Fragment key={index}>
              {wrapTextNodeWithStyles(<>{node.text}</>, node)}
            </React.Fragment>
          );
        }
        return (
          <Linkify
            key={index}
            tagName="span"
            className={node.class}
            options={{
              target: '_blank',
              attributes: linkProps,
            }}
          >
            {wrapTextNodeWithStyles(<>{node.text}</>, node)}
          </Linkify>
        );
      } else {
        // but just in case it's not
        return (
          <React.Fragment key={index}>
            {messageContent({
              nodes: getMessageNodeChildren(node),
              message,
              formatStyle,
            })}
          </React.Fragment>
        );
      }
    }
  }
}

const linkProps = {
  onClick: (event: MouseEvent) => {
    event.stopPropagation();
  },
};
