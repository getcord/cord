import * as React from 'react';
import type { UploadedFile } from '@cord-sdk/types';
import { FileAttachment } from '../composer/FileAttachment.js';
import { useCordTranslation } from '../../../index.js';
import * as classes from '../../../components/message/MessageFileAttachment.css.js';

type Props = {
  file: UploadedFile;
};

export function MessageFileAttachment({ file }: Props) {
  const { t } = useCordTranslation('message');
  const { name, mimeType, size, url } = file;
  const uploadState = file.uploadStatus;
  const showErrorState =
    uploadState === 'failed' ||
    uploadState === 'cancelled' ||
    // Author has optimistically-inserted dataURI right after posting a message
    (uploadState === 'uploading' && !url.startsWith('data:'));

  return (
    <FileAttachment
      id={file.id}
      className={classes.documentAttachment}
      mimeType={mimeType}
      fileName={name}
      fileSize={size}
      uploading={uploadState === 'uploading'}
      showErrorState={showErrorState}
      url={url}
      actionLabel={t('download_action')}
    />
  );
}
