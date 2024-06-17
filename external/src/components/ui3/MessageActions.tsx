import type { RefObject } from 'react';
import { useCallback, useMemo } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { MenuItem } from 'external/src/components/ui3/MenuItem.tsx';
import type { UUID } from 'common/types/index.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { isUserAuthorOfMessage } from 'external/src/lib/util.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Separator } from 'external/src/components/ui3/Separator.tsx';
import { useSetComposerToEditMode } from 'external/src/effects/useSetComposerEditMode.ts';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';

type Props = {
  closeMenu: () => void;
  threadID: UUID;
  message: MessageFragment;
  showSeparator: boolean;
  messageRef?: RefObject<HTMLDivElement>;
};

export const MessageActions = ({
  closeMenu,
  message,
  threadID,
  showSeparator,
  messageRef,
}: Props) => {
  const { t } = useCordTranslation('message');
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const viewerIsAuthorOfMessage = isUserAuthorOfMessage(
    message,
    user?.externalID,
  );

  const { setResolved } = useContextThrowingIfNoProvider(ThreadsContext2);
  const { onThreadReopen } = useContextThrowingIfNoProvider(ThreadListContext);
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const thread = useThreadData();

  const setMessageToEditMode = useSetComposerToEditMode();
  const onEditButtonClicked = useCallback(() => {
    setMessageToEditMode({
      message,
      thread,
      messageRef,
    });
    closeMenu();
  }, [closeMenu, message, messageRef, setMessageToEditMode, thread]);

  const { deleteMessage } = useMessageUpdater();
  const onDeleteButtonClicked = useCallback(() => {
    deleteMessage(message.id);
  }, [deleteMessage, message.id]);

  const EditMenuItem = useMemo(
    () =>
      thread?.resolved ? (
        <MenuItem
          menuItemAction={'message-edit-resolved'}
          label={t('edit_resolved_action')}
          leftItem={<Icon name="PencilSimpleLine" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            setResolved(threadID, false, true);
            onThreadReopen?.({
              threadID: thread.externalID,
              thread: getThreadSummary(thread, userByInternalID),
            });
            closeMenu();
          }}
        />
      ) : (
        <MenuItem
          menuItemAction={'message-edit'}
          label={t('edit_action')}
          leftItem={<Icon name="PencilSimpleLine" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            onEditButtonClicked();
          }}
        />
      ),
    [
      thread,
      t,
      setResolved,
      threadID,
      onThreadReopen,
      closeMenu,
      onEditButtonClicked,
      userByInternalID,
    ],
  );

  if (!viewerIsAuthorOfMessage) {
    return null;
  }

  const showActionButtons =
    viewerIsAuthorOfMessage && message.importedSlackMessageType !== 'reply';

  return (
    <>
      {showActionButtons && (
        <>
          {showSeparator && <Separator />}
          {EditMenuItem}
          {!thread?.resolved && (
            <MenuItem
              menuItemAction={'message-delete'}
              label={t('delete_action')}
              leftItem={<Icon name="Trash" size="large" />}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteButtonClicked();
              }}
            />
          )}
        </>
      )}
    </>
  );
};
