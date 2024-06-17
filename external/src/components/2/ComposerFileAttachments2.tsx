import { useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';

import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { isFileComposerAttachment } from 'external/src/lib/util.ts';
import type { ComposerFileAttachmentType } from 'external/src/context/composer/ComposerState.ts';
import { RemoveAttachmentAction } from 'external/src/context/composer/actions/RemoveAttachment.ts';
import type { UUID } from 'common/types/index.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { ComposerFileAttachment2 } from 'external/src/components/2/ComposerFileAttachment2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  attachmentsContainer: {
    flexWrap: 'wrap',
    gap: cssVar('space-2xs'),
  },
});

/**
 * @deprecated Use ui3/ComposerFileAttachments instead
 */
export function ComposerFileAttachments2() {
  const classes = useStyles();
  const {
    state: { attachments },
    dispatch: dispatchComposer,
  } = useContextThrowingIfNoProvider(ComposerContext);

  const fileAttachments = useMemo(
    () =>
      attachments.filter((attachment) =>
        isFileComposerAttachment(attachment),
      ) as ComposerFileAttachmentType[],
    [attachments],
  );

  const removeAttachment = useCallback(
    (id: UUID) => {
      dispatchComposer(RemoveAttachmentAction(id));
    },
    [dispatchComposer],
  );

  if (!fileAttachments.length) {
    return null;
  }

  return (
    <Row2
      className={classes.attachmentsContainer}
      marginLeft={'2xs'}
      marginRight={'2xs'}
    >
      {fileAttachments.map((attachment) => (
        <ComposerFileAttachment2
          attachment={attachment}
          onFileRemoved={removeAttachment}
          key={attachment.id}
        />
      ))}
    </Row2>
  );
}
