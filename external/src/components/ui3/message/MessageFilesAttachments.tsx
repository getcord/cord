import { useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import {
  isInlineDisplayableImage,
  isInlineDisplayableVideo,
} from '@cord-sdk/react/common/lib/uploads.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import type { UUID } from 'common/types/index.ts';
import { MessageFileAttachment } from 'external/src/components/ui3/message/MessageFileAttachment.tsx';
import { MessageImageAttachment } from 'external/src/components/ui3/message/MessageImageAttachment.tsx';
import * as classes from 'external/src/components/ui3/message/MessageFilesAttachments.css.ts';
import type {
  MessageFileAttachmentFragment,
  MessageFragment,
} from 'external/src/graphql/operations.ts';
import { MessageVideoAttachment } from 'external/src/components/ui3/message/MessageVideoAttachment.tsx';
import { useMediaModal } from 'external/src/effects/useImageModal.tsx';
import { isNotNull } from 'common/util/index.ts';

type Props = {
  message?: MessageFragment;
  attachments: MessageFragment['attachments'];
};

export function MessageFilesAttachments({ message, attachments }: Props) {
  const [unsupportedVideoIDs, setUnsupportedVideoIDs] = useState<UUID[]>([]);

  const attachmentGroups = useMemo(() => {
    const imageFileAttachments: MessageFileAttachmentFragment[] = [];
    const videoFileAttachments: MessageFileAttachmentFragment[] = [];
    const documentFileAttachments: MessageFileAttachmentFragment[] = [];

    attachments.forEach((attachment) => {
      if (
        attachment.__typename !== 'MessageFileAttachment' ||
        !attachment.file
      ) {
        return;
      }

      if (isInlineDisplayableImage(attachment.file.mimeType)) {
        imageFileAttachments.push(attachment);
      } else if (
        isInlineDisplayableVideo(attachment.file.mimeType) &&
        !unsupportedVideoIDs.includes(attachment.file.id)
      ) {
        videoFileAttachments.push(attachment);
      } else {
        documentFileAttachments.push(attachment);
      }
    });

    return {
      imageFileAttachments,
      videoFileAttachments,
      documentFileAttachments,
    };
  }, [attachments, unsupportedVideoIDs]);

  const onUnsupportedFormat = useCallback((id: UUID) => {
    setUnsupportedVideoIDs((old) => [...old, id]);
  }, []);

  const imageFiles = useMemo(
    () =>
      attachmentGroups.imageFileAttachments
        .map((attachment) => attachment.file)
        .filter(isNotNull),
    [attachmentGroups.imageFileAttachments],
  );
  const videoFiles = useMemo(
    () =>
      attachmentGroups.videoFileAttachments
        .map((attachment) => attachment.file)
        .filter(isNotNull),
    [attachmentGroups.videoFileAttachments],
  );

  const showMediaModal = useMediaModal([...imageFiles, ...videoFiles], {
    onUnsupportedVideoFormat: onUnsupportedFormat,
  });
  return (
    <>
      <div
        className={cx(
          classes.messageImageAttachments,
          classes.messageAttachment,
        )}
      >
        {imageFiles.map((file, index) => (
          <MessageImageAttachment
            key={index}
            file={file}
            onClick={() =>
              showMediaModal({
                mediaIndex: index,
                ...(!!message && {
                  bannerConfig: {
                    source: message.source,
                    timestamp: message.timestamp,
                    attachmentType: MessageAttachmentType.FILE,
                  },
                }),
              })
            }
          />
        ))}
      </div>
      <div
        className={cx(
          classes.messageVideoAttachments,
          classes.messageAttachment,
        )}
      >
        {attachmentGroups.videoFileAttachments.map((attachment) => (
          <MessageVideoAttachment
            key={attachment.id}
            file={attachment.file!}
            onUnsupportedFormat={onUnsupportedFormat}
          />
        ))}
      </div>
      <div
        className={cx(
          classes.messageDocumentAttachments,
          classes.messageAttachment,
        )}
      >
        {attachmentGroups.documentFileAttachments.map((attachment, index) => (
          <MessageFileAttachment
            key={index}
            file={attachment.file!} // Wasn't sure how to handle this in typescript...
          />
        ))}
      </div>
    </>
  );
}

export const newMessageFilesAttachments = {
  NewComp: MessageFilesAttachments,
  configKey: 'messageFilesAttachments',
} as const;
