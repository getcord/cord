import { useState } from 'react';
import { createUseStyles } from 'react-jss';

import type { FileFragment } from 'external/src/graphql/operations.ts';
import { ImageAttachment2 } from 'external/src/components/ui2/ImageAttachment2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  imageAttachmentContainer: {
    maxWidth: '100%',
    marginTop: cssVar('space-2xs'),
  },
});

type Props = {
  file: FileFragment;
  onClick: () => void;
};
export function MessageImageAttachment2({ file, onClick }: Props) {
  const classes = useStyles();
  const [fileDownloadFailed, setFileDownloadFailed] = useState(false);
  const { url, name } = file;

  const uploadState = file.uploadStatus;

  const showErrorState =
    uploadState === 'failed' ||
    fileDownloadFailed ||
    // Author has optimistically-inserted dataURI right after posting a message
    (uploadState === 'uploading' && !url.startsWith('data:'));

  return (
    <ImageAttachment2
      className={classes.imageAttachmentContainer}
      uploading={uploadState === 'uploading'}
      url={url}
      onClick={onClick}
      onImageError={() => setFileDownloadFailed(true)}
      showErrorState={showErrorState}
      tooltipLabel={name}
    />
  );
}
