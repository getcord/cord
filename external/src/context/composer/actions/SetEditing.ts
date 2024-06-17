import { ComposerActions } from 'external/src/context/composer/actions/index.ts';

import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';

export const SetEditingAction = action<UUID>(ComposerActions.SET_EDITING);

export const SetEditingReducer = actionReducer(
  (state: ComposerState, editingMessageID: UUID | null): ComposerState => ({
    ...state,
    editingMessageID,
  }),
);
