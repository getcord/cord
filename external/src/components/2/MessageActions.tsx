import { useCallback, useMemo } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import type { UUID } from 'common/types/index.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { isUserAuthorOfMessage } from 'external/src/lib/util.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { useSetComposerToEditMode } from 'external/src/effects/useSetComposerEditMode.ts';

type Props = {
  closeMenu: () => void;
  threadID: UUID;
  message: MessageFragment;
  showSeparator: boolean;
};

export const MessageActions = ({
  closeMenu,
  message,
  threadID,
  showSeparator,
}: Props) => {
  const { t } = useCordTranslation('message');
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const viewerIsAuthorOfMessage = isUserAuthorOfMessage(
    message,
    user?.externalID,
  );

  const { setResolved } = useContextThrowingIfNoProvider(ThreadsContext2);

  const thread = useThreadData();

  const setMessageToEditMode = useSetComposerToEditMode();
  const onEditButtonClicked = useCallback(() => {
    setMessageToEditMode({ message, thread });
    closeMenu();
  }, [setMessageToEditMode, message, closeMenu, thread]);

  const { deleteMessage } = useMessageUpdater();
  const onDeleteButtonClicked = useCallback(() => {
    deleteMessage(message.id);
  }, [deleteMessage, message.id]);

  const EditMenuItem2 = useMemo(
    () =>
      thread?.resolved ? (
        <MenuItem2
          label={t('edit_resolved_action')}
          leftItem={<Icon2 name="PencilSimpleLine" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            setResolved(threadID, false, true);
            closeMenu();
          }}
        />
      ) : (
        <MenuItem2
          label={t('edit_action')}
          leftItem={<Icon2 name="PencilSimpleLine" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            onEditButtonClicked();
          }}
        />
      ),
    [
      closeMenu,
      onEditButtonClicked,
      setResolved,
      thread?.resolved,
      threadID,
      t,
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
          {showSeparator && <Separator2 marginVertical="3xs" />}
          {EditMenuItem2}
          {!thread?.resolved && (
            <MenuItem2
              label={t('delete_action')}
              leftItem={<Icon2 name="Trash" size="large" />}
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
