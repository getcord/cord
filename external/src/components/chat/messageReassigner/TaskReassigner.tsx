import { v4 as uuid } from 'uuid';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Slate, Editable, ReactEditor } from 'slate-react';
import { Editor, Transforms, Node, Text } from 'slate';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import type { MessageWithTask } from 'external/src/graphql/custom.ts';
import { isComposerEmpty } from 'external/src/context/composer/ComposerState.ts';
import { useUserReferences } from 'external/src/components/chat/composer/userReferences/useUserReferences.tsx';
import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import type { UUID } from 'common/types/index.ts';
import { MessageNodeType, UserReference } from 'common/types/index.ts';
import type {
  MessageAssigneeNode,
  MessageParagraphNode,
} from '@cord-sdk/types';
import {
  reassignerRenderElement,
  reassignerRenderLeaf,
  createReassignerEditor,
} from 'external/src/components/chat/messageReassigner/editor.tsx';
import {
  createAssigneeNode,
  isMessageNodeType,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { isNotNull } from 'common/util/index.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import { deleteVoidNodeOnPressDelete } from 'external/src/editor/util.ts';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { JssResetInjector } from 'external/src/common/JssResetInjector.tsx';
import { Portal } from 'external/src/components/Portal.tsx';
import { doNothing } from 'external/src/lib/util.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';

const useStyles = createUseStyles({
  textareaWrap: {
    alignItems: 'center',
    flexGrow: 1,
    display: 'flex',
    fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
    lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
    padding: `${Sizes.SMALL}px ${Sizes.MEDIUM}px`,
    position: 'relative',
  },
  editableContainer: {
    position: 'relative',
    display: 'flex',
    flexGrow: 1,
    color: Colors.WHITE,
  },
  placeholder: {
    bottom: 0,
    left: 0,
    opacity: 0.66,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  inputColor2: {
    color: cssVar('color-content-emphasis'),
  },
});

type Props = {
  message: MessageWithTask;
  stopReassigning: () => void;
  setAssigneeIDs: (message: MessageWithTask, assigneeIDs: UUID[]) => void;
};

export function TaskReassigner({
  message,
  stopReassigning,
  setAssigneeIDs,
}: Props) {
  const classes = useStyles();

  const createInitialEditorValue = useCallback(
    (assignees: UserFragment[]): Array<MessageParagraphNode> => {
      const paragraphChildren: Node[] = [];
      if (!assignees.length) {
        paragraphChildren.push({ text: '+' });
      } else {
        for (const assignee of assignees) {
          paragraphChildren.push({ text: '' });
          paragraphChildren.push(
            createAssigneeNode(assignee.id, assignee.displayName),
          );
          paragraphChildren.push({ text: ' ' });
        }
      }
      return [
        {
          type: MessageNodeType.PARAGRAPH,
          children: paragraphChildren,
        },
      ] as Array<MessageParagraphNode>;
    },
    [],
  );

  const [value, setValue] = useState(() =>
    createInitialEditorValue(message.task.assignees.filter(isNotNull)),
  );

  const editor = useMemo(createReassignerEditor, []);

  // Maintain local copy of assignee IDs. We pass this to useUserReferences to
  // exclude already assigned users from the menu.
  const [localAssigneeIDs, setLocalAssigneeIDs] = useState(() =>
    message.task.assignees.filter(isNotNull).map((user) => user.id),
  );

  const thread = useThreadData();

  // Add assignee logic
  const userReferences = useUserReferences({
    editor,
    externalOrgID: thread?.externalOrgID,
    requestMentionableUsers: true,
    referenceType: UserReference.ASSIGNEE,
    excludedUserIDs: localAssigneeIDs,
  });

  const updateLocalAssigneeIDs = useCallback(() => {
    const assigneeNodeEntries = [
      ...Editor.nodes(editor, {
        at: [],
        match: (node) => isMessageNodeType(node, MessageNodeType.ASSIGNEE),
      }),
    ];
    setLocalAssigneeIDs(
      assigneeNodeEntries.map(
        ([assigneeNode]: any) => (assigneeNode as MessageAssigneeNode).user.id,
      ),
    );
  }, [editor]);

  const reassign = useCallback(() => {
    setAssigneeIDs(message, localAssigneeIDs);
    stopReassigning();
  }, [localAssigneeIDs, message, setAssigneeIDs, stopReassigning]);

  // Focus editor on mount
  useEffect(() => {
    ReactEditor.focus(editor);
    Transforms.select(editor, {
      path: [0, (editor.children as any)[0].children.length - 1],
      offset: 1,
    });
  }, [editor]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { selection } = editor;
      if (!selection) {
        return;
      }
      const { offset, path } = selection.anchor;

      if (userReferences.userReferenceMenuOpen) {
        switch (event.key) {
          case Keys.ARROW_DOWN: {
            event.preventDefault();
            userReferences.selectNext();
            return;
          }

          case Keys.ARROW_UP: {
            event.preventDefault();
            userReferences.selectPrev();
            return;
          }

          case Keys.TAB:
          case Keys.ENTER:
          case Keys.SPACEBAR: {
            event.preventDefault();
            userReferences.insertUserReference();
            return;
          }

          case Keys.ESCAPE: {
            event.preventDefault();
            userReferences.closeUserReferences();
            return;
          }
        }
      }

      if (event.key === Keys.ESCAPE) {
        stopReassigning();
        return;
      }

      // If user presses space without a match, we delete everything after the plus
      if (event.key === Keys.SPACEBAR) {
        const firstElement = path[path.length - 1] === 0;
        Transforms.insertText(editor, firstElement ? '+' : ' +', { at: path });
      }

      // Allow deleting when assignee is selected
      const deletedVoidNode = deleteVoidNodeOnPressDelete(editor, event, path);
      if (deletedVoidNode) {
        return;
      }

      // Disallow any pluses other than the initial '+'
      if (event.key === Keys.PLUS) {
        const currentNode = Node.get(editor, path);
        if (Text.isText(currentNode) && currentNode.text.includes('+')) {
          event.preventDefault();
          return;
        }
      }

      // Add a '+' if the user types '@'
      if (event.key === '@' || event.key === '+') {
        const currentNode = Node.get(editor, path);
        event.preventDefault();
        if (Text.isText(currentNode) && currentNode.text[offset - 1] === '+') {
          return;
        }
        Transforms.insertText(editor, '+');
        return;
      }

      // Set assignee IDs and revert to regular MessageTask view
      if (event.key === Keys.ENTER) {
        event.preventDefault();
        reassign();
        return;
      }
    },
    [editor, userReferences, stopReassigning, reassign],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside({
    onMouseDown: reassign,
    elementRef: containerRef,
    disabled: userReferences.userReferenceMenuOpen,
  });

  const showPlaceholder = useMemo(() => isComposerEmpty(value), [value]);

  return (
    <BoxWithPopper2
      popperPosition="bottom-start"
      forwardRef={containerRef}
      className={classes.textareaWrap}
      popperElementVisible={Boolean(userReferences.userReferenceMenuOpen)}
      onShouldHide={userReferences.closeUserReferences}
      popperElement={userReferences.menuElement}
      popperWidth="full"
    >
      <Slate
        editor={editor}
        initialValue={value as any}
        onChange={(newValue) => {
          if (newValue !== value) {
            const empty = !newValue.length;
            if (empty) {
              Transforms.insertNodes(editor, createInitialEditorValue([]));
            }
            setValue(newValue as any);
          }
          userReferences.updateUserReferences(editor);
          updateLocalAssigneeIDs();
        }}
      >
        <div className={cx(classes.editableContainer, classes.inputColor2)}>
          <WrappedEditable onKeyDown={onKeyDown} />
          {/* Use our own placeholder as Slate's doesn't allow changing opacity and shows when you've started creating some structure (e.g. list/quote) */}
          {showPlaceholder && (
            <span
              className={classes.placeholder}
            >{`Add assignee(s) with '+'`}</span>
          )}
        </div>
      </Slate>
    </BoxWithPopper2>
  );
}

// because the composer does not work inside a shadowRoot (used when in sdk),
// we need to Portal it out from shadow root, and then bring it back in the
// right position with HTML slot. This is the same trick as we use for the main
// message composer.
function WrappedEditable({
  onKeyDown,
}: {
  onKeyDown: (event: React.KeyboardEvent) => void;
}) {
  const slotName = useRef(`cord-task-reassigner-${uuid()}`).current;
  const componentElement =
    useContextThrowingIfNoProvider(ComponentContext)?.element;
  const style = {
    userModify: 'read-write',
    MozUserModify: 'read-write',
    WebkitUserModify: 'read-write',
  } as const;
  if (!componentElement || !componentElement.shadowRoot) {
    // no shadow roots, return editable as usual
    return (
      <Editable
        renderElement={reassignerRenderElement}
        renderLeaf={reassignerRenderLeaf}
        onKeyDown={onKeyDown}
      />
    );
  }
  return (
    <>
      <Portal target={componentElement}>
        <JssResetInjector
          rootElementID={slotName}
          rootElement={componentElement}
        >
          <div slot={slotName} id={slotName}>
            <Editable
              renderElement={reassignerRenderElement}
              renderLeaf={reassignerRenderLeaf}
              onKeyDown={onKeyDown}
              scrollSelectionIntoView={doNothing}
              style={style}
            />
          </div>
        </JssResetInjector>
      </Portal>
      <slot name={slotName} />
    </>
  );
}
