import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';

export const SetShakingTodoAction = action<UUID | null>(
  ComposerActions.SET_SHAKING_TODO,
);

export const SetShakingTodoReducer = actionReducer(
  (state: ComposerState, todoID: UUID | null): ComposerState => {
    return {
      ...state,
      shakingTodoID: todoID,
    };
  },
);
