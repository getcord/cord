import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';

import { isInlineDisplayableImage } from '@cord-sdk/react/common/lib/uploads.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { MessageAttachmentType } from 'common/types/index.ts';
import { MessageFileAttachment2 } from 'external/src/components/2/MessageFileAttachment2.tsx';
import { MessageImageAttachment2 } from 'external/src/components/2/MessageImageAttachment2.tsx';
import type {
  MessageFileAttachmentFragment,
  MessageFragment,
} from 'external/src/graphql/operations.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newMessageFilesAttachments } from 'external/src/components/ui3/message/MessageFilesAttachments.tsx';
import { isNotNull } from 'common/util/index.ts';
import { useMediaModal } from 'external/src/effects/useImageModal.tsx';

const useStyles = createUseStyles({
  documentAttachments: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: cssVar('space-2xs'),
  },
});

type Props = {
  message?: MessageFragment;
  attachments: MessageFragment['attachments'];
};

export const MessageFilesAttachments2 = withNewCSSComponentMaybe(
  newMessageFilesAttachments,
  function MessageFilesAttachments2({ message, attachments }: Props) {
    const classes = useStyles();
    const { imageFileAttachments, documentFileAttachments } = useMemo(() => {
      const imageFiles: MessageFileAttachmentFragment[] = [];
      const documentFiles: MessageFileAttachmentFragment[] = [];

      attachments.forEach((attachment) => {
        if (
          attachment.__typename !== 'MessageFileAttachment' ||
          !attachment.file
        ) {
          return;
        }

        if (isInlineDisplayableImage(attachment.file.mimeType)) {
          imageFiles.push(attachment);
        } else {
          documentFiles.push(attachment);
        }
      });

      return {
        imageFileAttachments: imageFiles,
        documentFileAttachments: documentFiles,
      };
    }, [attachments]);

    const imageFiles = useMemo(
      () =>
        imageFileAttachments
          .map((attachment) => attachment.file)
          .filter(isNotNull),
      [imageFileAttachments],
    );

    const showMediaModal = useMediaModal(imageFiles);
    return (
      <>
        {imageFiles.map((file, index) => (
          <MessageImageAttachment2
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
        <Box2 className={classes.documentAttachments}>
          {documentFileAttachments.map((attachment, index) => (
            <MessageFileAttachment2
              key={index}
              file={attachment.file!} // Wasn't sure how to handle this in typescript...
            />
          ))}
        </Box2>
      </>
    );
  },
);
