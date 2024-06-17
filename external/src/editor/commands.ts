import type { Range, Location } from 'slate';
import { Editor, Element, Node, Transforms, Text, Path } from 'slate';
import { ReactEditor } from 'slate-react';

import type { UUID } from 'common/types/index.ts';
import { MessageNodeType, UserReference } from 'common/types/index.ts';
import {
  isStyledBlockEmpty,
  isEmptyParagraph,
  isStyledBlock,
  isStartOfBlock,
} from 'external/src/components/chat/composer/util.ts';
import {
  createAssigneeNode,
  createStyledBlockNode,
  createMentionNode,
  createParagraphNode,
  isMessageNodeType,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { isStyledBlockType } from '@cord-sdk/types';
import type {
  Mark,
  MessageBulletNode,
  MessageNumberBulletNode,
  MessageStyledBlockNode,
  MessageTodoNode,
} from '@cord-sdk/types';
import type { DisplayableUser } from 'common/util/index.ts';

export const HOTKEYS: { [key: string]: Mark } = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};

export type EditorShortcut = {
  type: MessageNodeType;
  validIn: MessageNodeType[];
};

export const EDITOR_SHORTCUTS: { [shortcut: string]: EditorShortcut } = {
  '>': { type: MessageNodeType.QUOTE, validIn: [] },
  '-': { type: MessageNodeType.BULLET, validIn: [MessageNodeType.QUOTE] },
  '*': { type: MessageNodeType.BULLET, validIn: [MessageNodeType.QUOTE] },
  '1.': {
    type: MessageNodeType.NUMBER_BULLET,
    validIn: [MessageNodeType.QUOTE],
  },
  '1)': {
    type: MessageNodeType.NUMBER_BULLET,
    validIn: [MessageNodeType.QUOTE],
  },
  '[]': { type: MessageNodeType.TODO, validIn: [] },
  '```': { type: MessageNodeType.CODE, validIn: [] },
};

const EMPTY_LOCATION: Location = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 0 },
};

export const EditorCommands = {
  moveCursorToStart(editor: Editor) {
    Transforms.select(editor, EMPTY_LOCATION);
  },
  isMarkActive(editor: Editor, format: Mark) {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  },
  // Toggle bold/italic/underline on/off
  toggleMark(editor: Editor, format: Mark) {
    const isActive = EditorCommands.isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  },

  isBlockNodeType(editor: Editor, nodeType: MessageNodeType) {
    const [match] = Editor.nodes(editor, {
      match: (n) => isMessageNodeType(n, nodeType),
    });
    return Boolean(match);
  },
  // Toggle a block from paragraph to the specified type, or back to paragraph
  toggleBlock(
    editor: Editor,
    nodeType: MessageNodeType,
    selection = editor.selection ?? EMPTY_LOCATION,
  ) {
    if (isStyledBlockType(nodeType)) {
      const parentStyledBlock = EditorCommands.getParentStyledBlock(
        editor,
        selection,
      );
      if (parentStyledBlock) {
        Transforms.unwrapNodes(editor, { at: parentStyledBlock[1] });
      } else {
        Transforms.wrapNodes(editor, createStyledBlockNode(nodeType, ''), {
          at: selection,
        });
      }
    } else {
      const isBlockNodeType = EditorCommands.isBlockNodeType(editor, nodeType);
      Transforms.setNodes(editor, {
        type: isBlockNodeType ? MessageNodeType.PARAGRAPH : nodeType,
      });
    }
  },

  transformToBlock(editor: Editor, nodeType: MessageNodeType) {
    if (isStyledBlockType(nodeType)) {
      Transforms.wrapNodes(editor, createStyledBlockNode(nodeType, ''), {
        at: editor.selection ?? EMPTY_LOCATION,
      });
    } else {
      Transforms.setNodes(editor, {
        type: nodeType,
      });
    }
  },

  // Iterate through top level nodes, changing todos to bullets
  convertTodosToBullets(editor: Editor) {
    for (let i = 0; i < editor.children.length; i++) {
      if (isMessageNodeType(editor.children[i], MessageNodeType.TODO)) {
        Transforms.setNodes(
          editor,
          {
            type: MessageNodeType.BULLET as any,
            done: undefined,
            todoID: undefined,
          },
          { at: [i] },
        );
      }
    }
  },

  convertAssigneesToText(editor: Editor, excludedIDs: UUID[] = []) {
    const assigneeNodeEntries = [
      ...Editor.nodes(editor, {
        at: [],
        match: (node) =>
          isMessageNodeType(node, MessageNodeType.ASSIGNEE) &&
          !excludedIDs.includes(node.user.id),
      }),
    ];
    const assigneeTextNodes = assigneeNodeEntries.map((entry) =>
      Node.child(entry[0], 0),
    );
    Transforms.liftNodes(editor, {
      match: (node) => assigneeTextNodes.some((textNode) => node === textNode),
      voids: true,
      at: [],
    });
  },

  getClosestBlock(editor: Editor, path: Path) {
    let node = Node.get(editor, path);
    while (!(Element.isElement(node) && Editor.isBlock(editor, node))) {
      path = path.slice(0, path.length - 1);
      if (!path.length) {
        return null;
      }
      node = Node.get(editor, path);
    }
    return [node, path] as [Node, Path];
  },

  getParentStyledBlock(
    editor: Editor,
    selection = editor.selection,
  ): [MessageStyledBlockNode, Path] | null {
    if (!selection) {
      return null;
    }
    let path = selection.anchor.path;
    let node;
    while (path.length) {
      node = Node.get(editor, path);
      if (isStyledBlock(node)) {
        return [node, path];
      }
      path = path.slice(0, path.length - 1);
    }
    return null;
  },

  addBullet(
    editor: Editor,
    selection: Range,
    currentBulletPath: Path,
    indent: number,
  ) {
    const { path, offset } = selection.anchor;
    const currentBullet = Node.get(editor, currentBulletPath) as
      | MessageBulletNode
      | MessageNumberBulletNode
      | MessageTodoNode;

    const bulletType = currentBullet.type;

    // If cursor is at start of bullet, we add an empty bullet above
    if (isStartOfBlock(editor, path, offset, currentBulletPath)) {
      Transforms.insertNodes(
        editor,
        createStyledBlockNode(bulletType, '', indent),
        {
          at: currentBulletPath,
          select: true,
        },
      );
      return;
    }

    const newBullet = createStyledBlockNode(bulletType, '', indent);

    // If selection is somewhere in middle of bullet, move content after selection to new bullet
    // i.e. split node at selection, move split node contents into new bullet, remove split node
    const currentNode = Node.get(editor, path);
    const parent = Node.parent(editor, path);
    if (
      Text.isText(currentNode) &&
      !(Element.isElement(parent) && Editor.isVoid(editor, parent)) &&
      currentNode.text.length &&
      offset !== currentNode.text.length
    ) {
      Transforms.splitNodes(editor);
      const splitNodePath = Path.next(Path.parent(path));
      const splitNode = Node.get(editor, splitNodePath);
      newBullet.children = [splitNode as any];
      Transforms.removeNodes(editor, { at: splitNodePath });
    }
    // Insert bullet and select it
    const insertAt = Path.next(currentBulletPath);
    Transforms.insertNodes(editor, newBullet, {
      at: insertAt,
      select: true,
    });
    // Move the cursor to the start of the new bullet, because it may have text
    // in it already if we split an existing bullet
    Transforms.select(
      editor,
      Editor.point(editor, insertAt, { edge: 'start' }),
    );
  },

  moveSelectionToEndOfText(editor: Editor) {
    if (!editor.selection) {
      return;
    }
    const { path } = editor.selection.anchor;
    const node = Node.get(editor, path);
    if (Text.isText(node)) {
      Transforms.select(editor, { path, offset: node.text.length });
    }
  },

  focusAndMoveCursorToEndOfText(editor: Editor) {
    const nodesTexts = Node.texts(editor, {
      reverse: true,
    });
    const textNodeToSelect = nodesTexts.next().value;

    ReactEditor.focus(editor);

    if (textNodeToSelect) {
      const [node, path] = textNodeToSelect;
      Transforms.select(editor, { path, offset: node.text.length });
    }
  },

  focusAndMoveCursorForward(
    editor: Editor,
    selection: Location | null,
    distance = 1,
  ) {
    ReactEditor.focus(editor);
    if (selection) {
      Transforms.select(editor, selection);
      Transforms.move(editor, {
        distance,
      });
    }
  },

  focusAndSelect(editor: Editor, selection: Range) {
    ReactEditor.focus(editor);
    Transforms.select(editor, selection);
  },

  replaceRangeWithUserReference(
    userReferenceType: UserReference,
    editor: Editor,
    range: Range,
    user: DisplayableUser,
  ) {
    Transforms.select(editor, range);
    const displayName = user.displayName;
    const userReferenceNode =
      userReferenceType === UserReference.MENTION
        ? createMentionNode(user.id, displayName)
        : createAssigneeNode(user.id, displayName);
    Transforms.insertNodes(editor, userReferenceNode);
    Transforms.move(editor);
  },

  addParagraph(editor: Editor, path: Path) {
    const paragraph = createParagraphNode();
    Transforms.insertNodes(editor, paragraph, {
      at: path,
      select: true,
    });
  },

  addEmoji(editor: Editor, selection: Range | null, emoji: string) {
    const insertionPoint = selection?.focus ?? EMPTY_LOCATION.focus;
    Transforms.insertNodes(editor, { text: emoji }, { at: insertionPoint });
    this.focusAndMoveCursorForward(editor, insertionPoint);
  },

  addText(editor: Editor, selection: Range | null, textToAdd: string) {
    const insertionPoint = selection?.focus ?? EMPTY_LOCATION.focus;
    Transforms.insertNodes(editor, { text: textToAdd }, { at: insertionPoint });
    this.focusAndMoveCursorForward(editor, insertionPoint, textToAdd.length);
  },

  addTodo(
    editor: Editor,
    selection: Range | null,
  ): { success: boolean; focusedTodoID?: UUID } {
    selection = selection ?? EMPTY_LOCATION;
    const parentBullet = EditorCommands.getParentStyledBlock(editor, selection);
    // If inside an empty todo, do nothing
    if (
      parentBullet &&
      isMessageNodeType(parentBullet[0], MessageNodeType.TODO) &&
      isStyledBlockEmpty(parentBullet[0])
    ) {
      EditorCommands.focusAndSelect(editor, selection);
      return {
        success: false,
        focusedTodoID: parentBullet[0].todoID,
      };
    }
    const nodeParent = Node.parent(editor, selection.anchor.path);
    if (!parentBullet && isEmptyParagraph(nodeParent)) {
      // If in empty paragraph, turn it into a bullet
      Transforms.wrapNodes(
        editor,
        createStyledBlockNode(MessageNodeType.TODO, ''),
        {
          at: selection,
        },
      );
      EditorCommands.focusAndSelect(editor, selection);
    } else {
      // Otherwise add a bullet
      const { path } = selection.anchor;
      Transforms.insertNodes(
        editor,
        createStyledBlockNode(MessageNodeType.TODO, ''),
        {
          at: [path[0] + 1],
          select: true,
        },
      );
      ReactEditor.focus(editor);
    }
    return { success: true };
  },
};
