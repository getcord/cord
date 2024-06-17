import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type {
  ComposerAttachment,
  ComposerState,
} from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';

export const SetAttachmentsAction = action<ComposerAttachment[]>(
  ComposerActions.SET_ATTACHMENTS,
);

export const SetAttachmentsReducer = actionReducer(
  (state: ComposerState, attachments: ComposerAttachment[]): ComposerState => ({
    ...state,
    attachments,
  }),
);
