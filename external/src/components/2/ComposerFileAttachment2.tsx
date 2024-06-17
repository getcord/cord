import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import type { UUID } from 'common/types/index.ts';
import { isInlineDisplayableImage } from '@cord-sdk/react/common/lib/uploads.ts';
import type { ComposerFileAttachmentType } from 'external/src/context/composer/ComposerState.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { FileAttachment2 } from 'external/src/components/ui2/FileAttachment2.tsx';
import { ImageAttachment2 } from 'external/src/components/ui2/ImageAttachment2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

type Props = {
  attachment: ComposerFileAttachmentType;
  onFileRemoved: (id: UUID) => void;
};

const useStyles = createUseStyles({
  attachment: {
    maxWidth: `calc(50% - (${cssVar('space-2xs')}/2))`,
  },
  image: {
    height: `calc(${cssVar('space-xl')}*2)`,
  },
});

/**
 * @deprecated Use ui3/ComposerFileAttachment instead
 */
export function ComposerFileAttachment2({ attachment, onFileRemoved }: Props) {
  const { t } = useCordTranslation('composer');
  const classes = useStyles();
  const {
    id,
    file,
    file: { name, mimeType, url, uploadStatus, size },
  } = attachment;

  const uploading = uploadStatus === 'uploading';

  return (
    <>
      {isInlineDisplayableImage(file.mimeType) ? (
        <ImageAttachment2
          className={cx(classes.attachment, classes.image)}
          url={url}
          uploading={uploading}
          onClick={() => onFileRemoved(id)}
          tooltipLabel={t('remove_file_action')}
          onHoverElement={<Icon2 name="X" size="large" />}
        />
      ) : (
        <FileAttachment2
          className={classes.attachment}
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
