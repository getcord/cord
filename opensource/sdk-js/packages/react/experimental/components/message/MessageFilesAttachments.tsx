import * as React from 'react';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import type {
  ClientUserData,
  MessageAttachment,
  MessageFileAttachment as MessageFileAttachmentType,
  UUID,
} from '@cord-sdk/types';
import {
  isInlineDisplayableImage,
  isInlineDisplayableVideo,
} from '../../../common/lib/uploads.js';
import { isNotNull } from '../../../common/util.js';
import withCord from '../hoc/withCord.js';
import { useMediaModal } from '../../hooks/useMediaModal.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import type { StyleProps } from '../../types.js';
import classes from './MessageFilesAttachments.css.js';
import { MessageFileAttachment } from './MessageFileAttachment.js';
import { MessageImageAttachment } from './MessageImageAttachment.js';
import { MessageVideoAttachment } from './MessageVideoAttachment.js';

export type MessageFilesAttachmentsProps = {
  authorData: ClientUserData | null | undefined;
  createdAt: Date | undefined;
  attachments: MessageAttachment[];
} & MandatoryReplaceableProps &
  StyleProps;

export const MessageFilesAttachments = withCord<
  React.PropsWithChildren<MessageFilesAttachmentsProps>
>(
  forwardRef(function MessageFilesAttachments(
    {
      attachments,
      authorData,
      createdAt,
      className,
      ...restProps
    }: MessageFilesAttachmentsProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const [unsupportedVideoIDs, setUnsupportedVideoIDs] = useState<UUID[]>([]);

    const attachmentGroups = useMemo(() => {
      const imageFileAttachments: MessageFileAttachmentType[] = [];
      const videoFileAttachments: MessageFileAttachmentType[] = [];
      const documentFileAttachments: MessageFileAttachmentType[] = [];

      attachments.forEach((attachment) => {
        if (attachment.type !== 'file' || !attachment) {
          return;
        }

        if (isInlineDisplayableImage(attachment.mimeType)) {
          imageFileAttachments.push(attachment);
        } else if (
          isInlineDisplayableVideo(attachment.mimeType) &&
          !unsupportedVideoIDs.includes(attachment.id)
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
      () => attachmentGroups.imageFileAttachments.filter(isNotNull),
      [attachmentGroups.imageFileAttachments],
    );
    const videoFiles = useMemo(
      () => attachmentGroups.videoFileAttachments.filter(isNotNull),
      [attachmentGroups.videoFileAttachments],
    );

    const [mediaModal, openMediaModal] = useMediaModal({
      medias: [...imageFiles, ...videoFiles],
      user: authorData,
      createdAt,
    });

    return (
      <>
        <div
          className={cx(
            classes.messageImageAttachments,
            classes.messageAttachment,
            className,
          )}
          ref={ref}
          {...restProps}
        >
          {imageFiles.map((file, index) => (
            <MessageImageAttachment
              key={index}
              file={file}
              onClick={() => {
                openMediaModal(index);
              }}
            />
          ))}
        </div>
        <div
          className={cx(
            classes.messageVideoAttachments,
            classes.messageAttachment,
            className,
          )}
          {...restProps}
        >
          {videoFiles.map((attachment) => (
            <MessageVideoAttachment
              key={attachment.id}
              file={attachment}
              onUnsupportedFormat={onUnsupportedFormat}
            />
          ))}
        </div>
        <div
          className={cx(
            classes.messageDocumentAttachments,
            classes.messageAttachment,
            className,
          )}
          {...restProps}
        >
          {attachmentGroups.documentFileAttachments.map((attachment, index) => (
            <MessageFileAttachment key={index} file={attachment} />
          ))}
        </div>
        {mediaModal}
      </>
    );
  }),
  'MessageFilesAttachments',
);
