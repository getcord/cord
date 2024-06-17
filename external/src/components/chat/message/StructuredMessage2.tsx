import * as React from 'react';
import { useEffect, useRef, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import Linkify = require('linkify-react');

import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { MessageNode, MessageContent } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { getMessageNodeChildren } from '@cord-sdk/react/common/lib/messageNode.ts';
import { wrapTextNodeWithStyles } from 'external/src/editor/render.tsx';
import { MessageBulletElement } from 'external/src/components/chat/message/contentElements/MessageBulletElement.tsx';
import { messageHasTask } from 'external/src/lib/util.ts';
import { MessageUserReferenceElement } from 'external/src/components/chat/message/contentElements/MessageUserReferenceElement.tsx';
import { MessageTodoElement } from 'external/src/components/chat/message/contentElements/MessageTodoElement.tsx';
import { PARAGRAPH_STYLE, editorStyles } from 'common/ui/editorStyles.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { EditedMessage } from 'external/src/components/chat/message/EditedMessage.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import type { ConfigurationContextType } from 'external/src/context/config/ConfigurationContext.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newStructuredMessage } from 'external/src/components/ui3/message/MessageText.tsx';
import { useTranslatedMessageContent } from 'sdk/client/core/i18n.ts';

const useStyles = createUseStyles({
  messageContainer: {
    ...editorStyles,
    '& > :not(:first-child)': {
      marginTop: `${Sizes.MESSAGE_PARAGRAPH_TOP_MARGIN}px`,
    },
  },
  truncateMessage: {
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    // Supported on latest versions of Chrome, Edge, Safari, FF and Opera.
    '-webkit-line-clamp': cssVar('thread-list-message-truncate-lines'),
  },
  customRenderNode: {
    display: 'contents',
  },
});

export type FormatStyle = 'normal' | 'action_message';

type Props = {
  message?: MessageFragment;
  content: MessageContent | null | undefined;
  wasEdited: boolean;
  isMessageBeingEdited: boolean;
  hideAnnotationAttachment: boolean;
  formatStyle?: FormatStyle;
};

export const StructuredMessage2 = withNewCSSComponentMaybe(
  newStructuredMessage,
  function StructuredMessage2({
    message,
    content,
    wasEdited,
    isMessageBeingEdited,
    hideAnnotationAttachment,
    formatStyle,
  }: Props) {
    const { messageContainer, truncateMessage } = useStyles();

    const componentName =
      useContextThrowingIfNoProvider(ComponentContext)?.name;

    const showEditMessage = wasEdited || isMessageBeingEdited;

    return (
      <div
        dir="auto"
        className={cx(messageContainer, {
          [truncateMessage]: componentName === 'cord-thread-list',
        })}
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
  },
);

function RenderedContent(props: {
  nodes: MessageContent;
  message?: MessageFragment;
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
  hideAnnotationAttachment,
  formatStyle,
}: {
  nodes: MessageContent;
  message?: MessageFragment;
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
        hideAnnotationAttachment={!!hideAnnotationAttachment}
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

function CustomRendererNode({
  renderer,
  node,
}: {
  renderer: ConfigurationContextType['customRenderers'][string];
  node: MessageNode;
}) {
  const styles = useStyles();
  const r = useRef<HTMLDivElement>(null);

  // This useMemo is pretty important, so that we don't call the external
  // developer's render function more than necessary.
  const elem = useMemo(() => renderer(node), [renderer, node]);
  if (!(elem instanceof HTMLElement)) {
    console.error(
      'Custom renderer expected HTMLElement when rendering message node',
      node,
    );
  }

  useEffect(() => {
    r.current!.replaceChildren(elem);
  }, [elem]);

  return <div ref={r} className={styles.customRenderNode} />;
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
  message?: MessageFragment;
  index: number;
  parent?: MessageNode;
  showEditMessage?: boolean;
  isMessageBeingEdited?: boolean;
  hideAnnotationAttachment?: boolean;
  formatStyle?: FormatStyle;
}): JSX.Element | null {
  const { customRenderers } =
    useContextThrowingIfNoProvider(ConfigurationContext);

  // If a custom renderer was specified, use it -- this will override even our
  // own renderers if you want to replace the behaviour of mentions or whatever.
  // NB: this means we need to be careful introducing and changing our own
  // internal formats too, since they could be overridden.
  if (node.type && customRenderers[node.type]) {
    return (
      <CustomRendererNode
        key={index}
        renderer={customRenderers[node.type]}
        node={node}
      />
    );
  }

  switch (node.type) {
    case MessageNodeType.BULLET:
      return (
        <MessageBulletElement key={index} indent={node.indent ?? 0}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </MessageBulletElement>
      );
    case MessageNodeType.CODE:
      return (
        <pre key={index}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </pre>
      );
    case MessageNodeType.LINK:
      return (
        <a key={index} href={node.url} target="_blank" rel="noreferrer">
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
          key={index}
          userID={node.user.id}
          referencedUserData={message?.referencedUserData ?? []}
          nodeType={node.type}
          formatStyle={formatStyle}
        />
      );
    case MessageNodeType.NUMBER_BULLET:
      return (
        <MessageBulletElement
          key={index}
          numberBullet={true}
          bulletNumber={node.bulletNumber}
          indent={node.indent ?? 0}
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
        <p key={index} style={PARAGRAPH_STYLE}>
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
        <blockquote key={index} style={PARAGRAPH_STYLE}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </blockquote>
      );
    case MessageNodeType.TODO:
      return messageHasTask(message) ? (
        <MessageTodoElement key={index} message={message} todoID={node.todoID}>
          {messageContent({
            nodes: node.children,
            message,
            formatStyle,
          })}
        </MessageTodoElement>
      ) : null;
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
            options={{
              target: '_blank',
              attributes: linkProps as any,
            }}
            tagName="span" // Need this to not log a lot of warnings about how you can't set className on React Fragments. See PR 7950
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
