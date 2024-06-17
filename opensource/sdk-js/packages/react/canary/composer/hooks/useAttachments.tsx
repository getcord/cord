import * as React from 'react';
import type { MessageFileAttachment } from '@cord-sdk/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ComposerFileAttachments } from '../../../components/composer/ComposerFileAttachments.js';
import type { CustomEditor } from '../../../slateCustom.js';
import { AddAttachmentsButton } from '../AddAttachments.js';
import type { ComposerProps } from '../../../experimental/types.js';
import { useToast } from '../../../experimental/hooks/useToast.js';
import { useCordTranslation } from '../../../hooks/useCordTranslation.js';
import { ComposerAttachmentInputWrapper } from '../ComposerAttachmentInput.js';
import { useUploadFileToCord } from './useUploadFileToCord.js';

const EMPTY_ARRAY: MessageFileAttachment[] = [];

export function useAttachments(initialAttachments?: MessageFileAttachment[]) {
  const [attachments, setAttachments] = useState<MessageFileAttachment[]>(
    initialAttachments ?? [],
  );

  useEffect(() => {
    setAttachments(initialAttachments ?? EMPTY_ARRAY);
  }, [initialAttachments]);

  const upsertAttachment = useCallback(
    (attachment: Partial<MessageFileAttachment>) => {
      setAttachments((prev) => {
        const prevAttachments = [...prev];
        // Allow sending files which are still uploading
        if (attachment.uploadStatus === 'uploading') {
          prevAttachments.push(attachment as MessageFileAttachment);
        }

        const updatedAttachments = updateAttachment(
          prevAttachments,
          attachment,
        );
        if (updatedAttachments) {
          return updatedAttachments;
        }

        return prev;
      });
    },
    [],
  );

  const removeAttachment = useCallback((attachmentID: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentID));
  }, []);

  const resetAttachments = useCallback(() => {
    setAttachments(initialAttachments ?? []);
    return undefined;
  }, [initialAttachments]);

  return {
    attachments,
    upsertAttachment,
    removeAttachment,
    resetAttachments,
    initialAttachments,
  };
}

function updateAttachment(
  attachments: MessageFileAttachment[],
  attachment: Partial<MessageFileAttachment>,
): MessageFileAttachment[] | null {
  const newAttachments = [...attachments];
  const uploadedFile = newAttachments.find((a) => a.id === attachment.id);
  // User might have removed the attachment;
  if (!uploadedFile) {
    return null;
  }
  uploadedFile.uploadStatus = attachment.uploadStatus!;
  uploadedFile.type = 'file';

  if (attachment.url) {
    uploadedFile.url = attachment.url;
  }

  return newAttachments;
}

export function useAddAttachmentToComposer(attachmentsProps: {
  initialAttachments: MessageFileAttachment[];
  editor: CustomEditor;
}): Pick<
  ComposerProps,
  | 'extraChildren'
  | 'onPaste'
  | 'onResetState'
  | 'isValid'
  | 'toolbarItems'
  | 'attachmentInputElement'
  | 'attachFilesToComposer'
> & {
  attachments: MessageFileAttachment[];
} {
  const { t } = useCordTranslation('composer');
  const { showToastPopup } = useToast();
  const { initialAttachments, editor } = attachmentsProps;
  const { attachments, upsertAttachment, removeAttachment, resetAttachments } =
    useAttachments(initialAttachments);

  const isValid = attachments.length > 0;
  const attachFiles = useUploadFileToCord(upsertAttachment);

  const attachFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAttachment = useCallback(() => {
    attachFileInputRef.current?.click();
  }, []);

  const onPaste = useCallback(
    ({ event }: { event: React.ClipboardEvent }) => {
      const { files } = event.clipboardData;
      const allFilesAreImages =
        files &&
        files.length > 0 &&
        [...files].every((file) => {
          const [mime] = file.type.split('/');
          return mime === 'image';
        });
      if (allFilesAreImages) {
        event.stopPropagation();
        const filesArr = [...files];
        attachFiles(filesArr).catch((error) => {
          const toastID = 'attach_file_action_failure';
          showToastPopup?.(
            toastID,
            t(toastID, {
              message: error.message,
            }),
            'error',
          );
        });
      }
    },
    [t, attachFiles, showToastPopup],
  );

  const attachmentsElement = useMemo(
    () =>
      attachments.length > 0 ? (
        <ComposerFileAttachments
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
        />
      ) : null,
    [attachments, removeAttachment],
  );
  const extraChildren = useMemo(
    () => [{ name: 'attachments', element: attachmentsElement }],
    [attachmentsElement],
  );
  const toolbarItems = useMemo(() => {
    return [
      {
        name: 'addAttachment',
        element: (
          <AddAttachmentsButton
            key="add-attachment-button"
            editor={editor}
            handleSelectAttachment={handleSelectAttachment}
          />
        ),
      },
    ];
  }, [editor, handleSelectAttachment]);

  const attachmentInputElement = useMemo(() => {
    return (
      <ComposerAttachmentInputWrapper
        attachFiles={attachFiles}
        ref={attachFileInputRef}
      />
    );
  }, [attachFiles]);

  return useMemo(
    () => ({
      toolbarItems,
      attachments,
      extraChildren,
      onResetState: resetAttachments,
      isValid,
      onPaste,
      attachmentInputElement,
      attachFilesToComposer: attachFiles,
    }),
    [
      toolbarItems,
      attachments,
      extraChildren,
      resetAttachments,
      isValid,
      onPaste,
      attachmentInputElement,
      attachFiles,
    ],
  );
}
