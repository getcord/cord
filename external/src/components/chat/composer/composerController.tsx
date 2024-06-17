import { useMemo, useRef, useCallback } from 'react';

import { useMessageSender } from 'external/src/components/chat/composer/hooks/useMessageSender.ts';
import { useSlashMenu } from 'external/src/components/chat/composer/slashMenu/useSlashMenu.tsx';
import { useTypingUpdater } from 'external/src/components/chat/composer/hooks/useTypingUpdater.ts';
import { useUserReferences } from 'external/src/components/chat/composer/userReferences/useUserReferences.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useReffedFns } from 'external/src/effects/useReffedFns.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { EntityMetadata } from 'common/types/index.ts';

export function useComposerController({
  isDraftThread,
  externalOrgID,
  threadUrl,
  messageMetadata,
  threadMetadata,
  onSendMessage,
  dispatchMessageEditEndEvent,
  requestMentionableUsers,
}: {
  isDraftThread: boolean;
  requestMentionableUsers: boolean;
  externalOrgID: string | undefined;
  threadUrl?: string;
  messageMetadata?: EntityMetadata;
  threadMetadata?: EntityMetadata;
  onSendMessage?: () => unknown;
  dispatchMessageEditEndEvent?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const {
    state: { task, attachments, editingMessageID },
    editor,
    attachFiles,
    getValue,
    clearComposer,
  } = useContextThrowingIfNoProvider(ComposerContext);

  const userReferences = useUserReferences({
    editor,
    externalOrgID,
    requestMentionableUsers,
  });
  const slashMenu = useSlashMenu();
  const updateTyping = useTypingUpdater();
  const sendMessage = useMessageSender({
    isDraftThread,
    threadUrl,
    messageMetadata,
    threadMetadata,
    dispatchMessageEditEndEvent,
  });
  const sendMessageWithAction = useCallback(async () => {
    const sentStatus = await sendMessage();
    if (sentStatus?.success) {
      onSendMessage?.();
    }

    return sentStatus;
  }, [onSendMessage, sendMessage]);
  const enableAttachments = useFeatureFlag(FeatureFlags.ENABLE_ATTACHMENTS);

  const menu = slashMenu.visible
    ? slashMenu.slashMenuElement
    : userReferences.menuElement;
  const menuVisible = userReferences.userReferenceMenuOpen || slashMenu.visible;
  const closeMenu = useCallback(() => {
    if (userReferences.userReferenceMenuOpen) {
      userReferences.closeUserReferences();
    }
    if (slashMenu.visible) {
      slashMenu.closeMenu();
    }
  }, [slashMenu, userReferences]);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      await attachFiles(e.dataTransfer.files);
    },
    [attachFiles],
  );

  const fns = useReffedFns({
    updateTyping,
    sendMessage: sendMessageWithAction,
    closeMenu,
    onDrop,
    getValue,
    clearComposer,
  });

  return useMemo(
    () => ({
      attachments,
      composerRef,
      containerRef,
      editingMessageID,
      editor,
      enableAttachments,
      menu,
      menuVisible,
      slashMenu,
      task,
      userReferences,
      ...fns,
    }),
    [
      attachments,
      editingMessageID,
      editor,
      enableAttachments,
      menu,
      menuVisible,
      slashMenu,
      task,
      userReferences,
      fns,
    ],
  );
}
