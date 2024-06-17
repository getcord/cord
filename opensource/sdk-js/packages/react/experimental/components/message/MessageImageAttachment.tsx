import * as React from 'react';
import { useState } from 'react';

import type { UploadedFile } from '@cord-sdk/types';
import { ImageAttachment } from '../composer/ImageAttachment.js';

type Props = {
  file: UploadedFile;
  onClick: () => void;
};
export function MessageImageAttachment({ onClick, file }: Props) {
  const [fileDownloadFailed, setFileDownloadFailed] = useState(false);
  const { url, name, id } = file;

  const uploadState = file.uploadStatus;

  const showErrorState =
    uploadState === 'failed' ||
    uploadState === 'cancelled' ||
    fileDownloadFailed ||
    // Author has optimistically-inserted dataURI right after posting a message
    (uploadState === 'uploading' && !url.startsWith('data:'));

  return (
    <ImageAttachment
      id={id}
      uploading={uploadState === 'uploading'}
      url={url}
      onClick={onClick}
      onImageError={() => setFileDownloadFailed(true)}
      showErrorState={showErrorState}
      tooltipLabel={name}
    />
  );
}
