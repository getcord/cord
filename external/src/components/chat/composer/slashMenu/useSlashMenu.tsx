import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactEditor } from 'slate-react';
import { Transforms, Node, Text } from 'slate';

import { useLogger } from 'external/src/logging/useLogger.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { useComposerTask } from 'external/src/components/chat/composer/hooks/useComposerTask.ts';
import { useAnnotationCreator } from 'external/src/components/chat/composer/hooks/useAnnotationCreator.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { SimpleInlineMenu } from 'external/src/components/SimpleInlineMenu.tsx';

export function useSlashMenu() {
  const { addTask, task } = useComposerTask();
  const createAnnotation = useAnnotationCreator();
  const { startAttachFlow, editor, getSelection } =
    useContextThrowingIfNoProvider(ComposerContext);

  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [selectedSlashMenuIndex, setSelectedSlashMenuIndex] = useState(0);

  const { logEvent } = useLogger();

  const { supportsAnnotations } = useContextThrowingIfNoProvider(EmbedContext);

  const { enableTasks, enableAnnotations } =
    useContextThrowingIfNoProvider(ConfigurationContext);

  const deleteSearchTerm = useCallback(() => {
    ReactEditor.focus(editor);
    const selection = getSelection();
    if (selection) {
      Transforms.select(editor, selection);
    }
    Transforms.delete(editor, {
      distance: selection?.anchor.offset,
      unit: 'character',
      reverse: true,
    });
  }, [editor, getSelection]);

  const createOnClick = useCallback(
    (onClick: () => void) => {
      return () => {
        deleteSearchTerm();
        onClick();
      };
    },
    [deleteSearchTerm],
  );

  const menuItems = useMemo(
    () => [
      {
        id: 'annotation' as const,
        title: 'Annotate',
        icon: <Icon2 name={'AnnotationPin'} />,
        onClick: createOnClick(() => {
          logEvent('composer-slash-menu-annotation');
          void createAnnotation();
        }),
      },
      {
        id: 'attachment' as const,
        title: 'Attach file',
        icon: <Icon2 name="Paperclip" />,
        onClick: createOnClick(() => {
          logEvent('composer-slash-menu-attachment');
          startAttachFlow();
        }),
      },
      {
        id: 'task' as const,
        title: 'Task',
        icon: <Icon2 name="Clipboard" />,
        onClick: createOnClick(() => {
          logEvent('composer-slash-menu-task');
          addTask();
        }),
      },
      {
        id: 'todo' as const,
        title: 'Todo',
        icon: <Icon2 name="CheckSquare" />,
        onClick: createOnClick(() => {
          logEvent('composer-slash-menu-todo');
          EditorCommands.toggleBlock(editor, MessageNodeType.TODO);
        }),
      },
    ],
    [
      addTask,
      createAnnotation,
      createOnClick,
      editor,
      logEvent,
      startAttachFlow,
    ],
  );

  const itemsToShow = useMemo(() => {
    if (searchTerm === null) {
      return [];
    }
    return menuItems.filter((item) => {
      if (!item.title.toLowerCase().includes(searchTerm?.toLowerCase())) {
        return false;
      }
      switch (item.id) {
        case 'annotation':
          return supportsAnnotations && enableAnnotations;
        case 'task':
          // Only 1 task allowed per message
          return enableTasks && !task;
        case 'todo':
          return enableTasks;
        case 'attachment':
          return true;
      }
    });
  }, [
    menuItems,
    searchTerm,
    supportsAnnotations,
    task,
    enableTasks,
    enableAnnotations,
  ]);

  useEffect(() => {
    if (selectedSlashMenuIndex >= itemsToShow.length) {
      setSelectedSlashMenuIndex(0);
    }
  }, [itemsToShow.length, selectedSlashMenuIndex]);

  const selectNext = useCallback(() => {
    setSelectedSlashMenuIndex((prev) => (prev + 1) % itemsToShow.length);
  }, [itemsToShow.length]);

  const selectPrev = useCallback(() => {
    setSelectedSlashMenuIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? itemsToShow.length - 1 : next;
    });
  }, [itemsToShow.length]);

  const closeMenu = useCallback(() => setSearchTerm(null), [setSearchTerm]);

  const chooseSlashMenuItem = useCallback(() => {
    itemsToShow[selectedSlashMenuIndex].onClick();
    closeMenu();
  }, [closeMenu, itemsToShow, selectedSlashMenuIndex]);

  // If selected text starts with '/', update the search term for slash menu
  const updateSlashMenu = useCallback(() => {
    if (editor.selection) {
      const { offset } = editor.selection.anchor;
      const currentNode = Node.get(editor, editor.selection.anchor.path);
      if (Text.isText(currentNode) && currentNode.text[0] === '/') {
        const slashText = currentNode.text.slice(1, offset);
        if (slashText.includes(' ')) {
          setSearchTerm(null);
        } else {
          setSearchTerm(slashText);
        }
      } else {
        setSearchTerm(null);
      }
    }
  }, [editor]);

  const visible = Boolean(searchTerm !== null && itemsToShow.length);

  const slashMenuElement = useMemo(
    () => (
      <SimpleInlineMenu
        menuItems={itemsToShow}
        closeMenu={closeMenu}
        selection={{
          selectedIndex: selectedSlashMenuIndex,
          setSelectedIndex: setSelectedSlashMenuIndex,
        }}
      />
    ),
    [closeMenu, itemsToShow, selectedSlashMenuIndex],
  );

  return useMemo(
    () => ({
      visible,
      selectNext,
      selectPrev,
      closeMenu,
      chooseSlashMenuItem,
      slashMenuElement,
      updateSlashMenu,
    }),
    [
      visible,
      selectNext,
      selectPrev,
      closeMenu,
      chooseSlashMenuItem,
      slashMenuElement,
      updateSlashMenu,
    ],
  );
}
