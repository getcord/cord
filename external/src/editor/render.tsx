import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import type { MessageNode } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import * as classes from 'external/src/editor/editor.css.ts';
import { UserReferenceElement } from 'external/src/components/chat/composer/userReferences/UserReferenceElement.tsx';
import { BulletElement } from 'external/src/components/chat/composer/bullets/BulletElement.tsx';
import { TodoElement } from 'external/src/components/chat/composer/bullets/TodoElement.tsx';
import type { MessageTextNode } from '@cord-sdk/types';

export const wrapTextNodeWithStyles = (
  node: JSX.Element,
  styles: MessageTextNode,
): JSX.Element => {
  let result = node;

  if (styles.bold) {
    result = <strong>{result}</strong>;
  }
  if (styles.italic) {
    result = <em>{result}</em>;
  }
  if (styles.underline) {
    result = <u>{result}</u>;
  }
  if (styles.code) {
    result = <span className={classes.inlineCode}>{result}</span>;
  }

  return result;
};

export const renderElement = ({
  element: el,
  attributes,
  children,
}: RenderElementProps) => {
  const element: MessageNode = el as any;
  switch (element.type) {
    case MessageNodeType.BULLET: {
      return (
        <BulletElement attributes={attributes} indent={element.indent ?? 0}>
          {children}
        </BulletElement>
      );
    }
    case MessageNodeType.CODE: {
      return <pre {...attributes}>{children}</pre>;
    }

    case MessageNodeType.LINK: {
      return (
        <a {...attributes} href={element.url}>
          {children}
        </a>
      );
    }

    case MessageNodeType.MENTION:
    case MessageNodeType.ASSIGNEE:
      return (
        <UserReferenceElement
          userID={element.user.id}
          elementChildren={element.children}
          attributes={attributes}
          nodeType={element.type}
        >
          {children}
        </UserReferenceElement>
      );
    case MessageNodeType.NUMBER_BULLET: {
      return (
        <BulletElement
          attributes={attributes}
          numberBullet={true}
          bulletNumber={element.bulletNumber}
          indent={element.indent ?? 0}
        >
          {children}
        </BulletElement>
      );
    }
    case MessageNodeType.PARAGRAPH: {
      return <p {...attributes}>{children}</p>;
    }
    case MessageNodeType.QUOTE: {
      return <blockquote {...attributes}>{children}</blockquote>;
    }
    case MessageNodeType.TODO: {
      return (
        <TodoElement attributes={attributes} todoNode={element}>
          {children}
        </TodoElement>
      );
    }
    default: {
      return <span {...attributes}>{children}</span>;
    }
  }
};

export const renderLeaf = ({ attributes, leaf, children }: RenderLeafProps) => {
  const result = wrapTextNodeWithStyles(<>{children}</>, leaf);
  return <span {...attributes}>{result}</span>;
};
