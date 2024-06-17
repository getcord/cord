import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';

export const RemoveAttachmentAction = action<UUID>(
  ComposerActions.REMOVE_ATTACHMENT,
);

export const RemoveAttachmentReducer = actionReducer(
  (state: ComposerState, attachmentId: UUID): ComposerState => ({
    ...state,
    attachments: state.attachments.filter(
      (attachment) => attachment.id !== attachmentId,
    ),
  }),
);
