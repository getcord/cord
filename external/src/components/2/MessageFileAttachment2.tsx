import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';
import type { FileFragment } from 'external/src/graphql/operations.ts';
import { FileAttachment2 } from 'external/src/components/ui2/FileAttachment2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  documentAttachment: {
    maxWidth: `calc(50% - (${cssVar('space-2xs')}/2))`,
    marginTop: cssVar('space-2xs'),
  },
});
type Props = {
  file: FileFragment;
};

export function MessageFileAttachment2({ file }: Props) {
  const { name, mimeType, size, url } = file;
  const { t } = useCordTranslation('message');
  const classes = useStyles();
  const uploadState = file.uploadStatus;
  const showErrorState =
    uploadState === 'failed' ||
    uploadState === 'cancelled' ||
    // Author has optimistically-inserted dataURI right after posting a message
    (uploadState === 'uploading' && !url.startsWith('data:'));

  return (
    <FileAttachment2
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
