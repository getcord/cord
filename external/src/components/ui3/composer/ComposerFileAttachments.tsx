import { useCallback, useMemo } from 'react';

import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { isFileComposerAttachment } from 'external/src/lib/util.ts';
import type { ComposerFileAttachmentType } from 'external/src/context/composer/ComposerState.ts';
import { RemoveAttachmentAction } from 'external/src/context/composer/actions/RemoveAttachment.ts';
import type { UUID } from 'common/types/index.ts';
import { ComposerFileAttachment } from 'external/src/components/ui3/composer/ComposerFileAttachment.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

import classes from 'external/src/components/ui3/composer/ComposerFileAttachments.css.ts';

export function ComposerFileAttachments() {
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
    <div className={classes.attachmentsContainer}>
      {fileAttachments.map((attachment) => (
        <ComposerFileAttachment
          attachment={attachment}
          onFileRemoved={removeAttachment}
          key={attachment.id}
        />
      ))}
    </div>
  );
}
