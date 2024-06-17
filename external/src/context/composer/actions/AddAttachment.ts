import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type {
  ComposerAttachment,
  ComposerState,
} from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';

export const AddAttachment = action<ComposerAttachment>(
  ComposerActions.ADD_ATTACHMENT,
);

export const AddAttachmentReducer = actionReducer(
  (state: ComposerState, newAttachment: ComposerAttachment): ComposerState => ({
    ...state,
    attachments: [...state.attachments, newAttachment],
  }),
);
