import * as React from 'react';
import type { UUID, UploadedFile } from '@cord-sdk/types';
import { FileAttachment } from '../../experimental/components/composer/FileAttachment.js';
import { ImageAttachment } from '../../experimental/components/composer/ImageAttachment.js';
import { useCordTranslation } from '../../index.js';
import { isInlineDisplayableImage } from '../../common/lib/uploads.js';
import { Icon } from '../helpers/Icon.js';

type Props = {
  attachment: UploadedFile;
  onFileRemoved: (id: UUID) => void;
};

export function ComposerFileAttachment({ attachment, onFileRemoved }: Props) {
  const { t } = useCordTranslation('composer');
  const { id, name, mimeType, url, uploadStatus, size } = attachment;

  const uploading = uploadStatus === 'uploading';

  if (isInlineDisplayableImage(mimeType)) {
    return (
      <ImageAttachment
        id={id}
        url={url}
        uploading={uploading}
        onClick={() => onFileRemoved(id)}
        tooltipLabel={t('remove_file_action')}
        onHoverElement={<Icon name="X" size="large" />}
      />
    );
  }

  return (
    <FileAttachment
      id={id}
      mimeType={mimeType}
      fileName={name}
      uploading={uploading}
      onButtonClick={() => onFileRemoved(id)}
      actionLabel={t('remove_file_action')}
      fileSize={size}
    />
  );
}
