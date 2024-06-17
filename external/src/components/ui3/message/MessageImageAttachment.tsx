import { useState } from 'react';

import type { FileFragment } from 'external/src/graphql/operations.ts';
import { ImageAttachment } from 'external/src/components/ui3/composer/ImageAttachment.tsx';

type Props = {
  file: FileFragment;
  onClick: () => void;
};
export function MessageImageAttachment({ onClick, file }: Props) {
  const [fileDownloadFailed, setFileDownloadFailed] = useState(false);
  const { url, name } = file;

  const uploadState = file.uploadStatus;

  const showErrorState =
    uploadState === 'failed' ||
    uploadState === 'cancelled' ||
    fileDownloadFailed ||
    // Author has optimistically-inserted dataURI right after posting a message
    (uploadState === 'uploading' && !url.startsWith('data:'));

  return (
    <ImageAttachment
      id={file.id}
      uploading={uploadState === 'uploading'}
      url={url}
      onClick={onClick}
      onImageError={() => setFileDownloadFailed(true)}
      showErrorState={showErrorState}
      tooltipLabel={name}
    />
  );
}
