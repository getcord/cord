import { useCordTranslation } from '@cord-sdk/react';
import { ImageAttachment } from 'external/src/components/ui3/composer/ImageAttachment.tsx';
import { FileAttachment } from 'external/src/components/ui3/composer/FileAttachment.tsx';
import type { UUID } from 'common/types/index.ts';
import { isInlineDisplayableImage } from '@cord-sdk/react/common/lib/uploads.ts';
import type { ComposerFileAttachmentType } from 'external/src/context/composer/ComposerState.ts';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

type Props = {
  attachment: ComposerFileAttachmentType;
  onFileRemoved: (id: UUID) => void;
};

export function ComposerFileAttachment({ attachment, onFileRemoved }: Props) {
  const { t } = useCordTranslation('composer');
  const {
    id,
    file,
    file: { name, mimeType, url, uploadStatus, size },
  } = attachment;

  const uploading = uploadStatus === 'uploading';

  return (
    <>
      {isInlineDisplayableImage(file.mimeType) ? (
        <ImageAttachment
          id={file.id}
          url={url}
          uploading={uploading}
          onClick={() => onFileRemoved(id)}
          tooltipLabel={t('remove_file_action')}
          onHoverElement={<Icon name="X" size="large" />}
        />
      ) : (
        <FileAttachment
          id={file.id}
          mimeType={mimeType}
          fileName={name}
          uploading={uploading}
          onButtonClick={() => onFileRemoved(id)}
          actionLabel={t('remove_file_action')}
          fileSize={size}
        />
      )}
    </>
  );
}
