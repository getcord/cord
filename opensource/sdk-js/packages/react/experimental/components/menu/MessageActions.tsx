import * as React from 'react';
import type { ClientMessageData } from '@cord-sdk/types';

import { useMemo } from 'react';

import { isUserAuthorOfMessage } from '../../../common/util.js';

import { Separator } from '../helpers/Separator.js';
import { useViewerData } from '../../../hooks/user.js';
import { useThread } from '../../../hooks/thread.js';
import { setResolved } from '../../../common/lib/thread.js';
import { useCordTranslation } from '../../../index.js';
import { Icon } from '../../../components/helpers/Icon.js';
import { MenuItem } from './MenuItem.js';
import type { MenuProps } from './Menu.js';

export type MessageActionsProps = React.PropsWithChildren<{
  closeMenu: () => void;
  threadID: string;
  message?: ClientMessageData;
  showSeparator: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
}>;

export function useMessageActions({
  closeMenu,
  message,
  threadID,
  setEditing,
  showSeparator,
}: MessageActionsProps) {
  const { t } = useCordTranslation('message');
  const user = useViewerData();

  const { thread } = useThread(threadID, { skip: !threadID });

  return useMemo(() => {
    const items: MenuProps['items'] = [];
    if (!thread || !user || !message) {
      return items;
    }

    const viewerIsAuthorOfMessage = isUserAuthorOfMessage(message, user?.id);
    if (!viewerIsAuthorOfMessage) {
      return items;
    }

    const onEditButtonClicked = () => {
      setEditing(true);
      closeMenu();
    };
    const onDeleteButtonClicked = () => {
      deleteMessage(message.id);
    };

    if (showSeparator) {
      items.push({
        element: <Separator canBeReplaced />,
        name: 'message-actions-separator',
      });
    }

    const editMenuItem = thread?.resolved ? (
      <MenuItem
        canBeReplaced
        menuItemAction={'message-edit-resolved'}
        label={t('edit_resolved_action')}
        leftItem={<Icon name="PencilSimpleLine" size="large" />}
        onClick={(event) => {
          event.stopPropagation();
          void setResolved(threadID, false);
          // [ONI]-TODO if we are in a ThreadList we should call its `onThreadReopen` with fresh thread
          closeMenu();
        }}
      />
    ) : (
      <MenuItem
        canBeReplaced
        menuItemAction={'message-edit'}
        label={t('edit_action')}
        leftItem={<Icon name="PencilSimpleLine" size="large" />}
        onClick={(event) => {
          event.stopPropagation();
          onEditButtonClicked();
        }}
      />
    );
    items.push({ element: editMenuItem, name: 'message-edit' });

    if (!thread?.resolved) {
      const deleteMenuItem = (
        <MenuItem
          canBeReplaced
          menuItemAction={'message-delete'}
          label={t('delete_action')}
          leftItem={<Icon name="Trash" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            onDeleteButtonClicked();
          }}
        />
      );
      items.push({ element: deleteMenuItem, name: 'message-delete' });
    }
    return items;
  }, [
    closeMenu,
    thread,
    threadID,
    t,
    user,
    message,
    setEditing,
    showSeparator,
  ]);
}

function deleteMessage(messageID: string) {
  void window?.CordSDK?.thread.updateMessage(messageID, {
    deleted: true,
  });
}
