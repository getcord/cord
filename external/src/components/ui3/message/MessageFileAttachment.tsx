import { useCordTranslation } from '@cord-sdk/react';
import type { FileFragment } from 'external/src/graphql/operations.ts';
import { FileAttachment } from 'external/src/components/ui3/composer/FileAttachment.tsx';
import * as classes from 'external/src/components/ui3/message/MessageFileAttachment.css.ts';

type Props = {
  file: FileFragment;
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
