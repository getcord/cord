import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { InitialState } from 'external/src/context/composer/ComposerState.ts';

export const ResetComposerStateAction = action<void>(
  ComposerActions.RESET_COMPOSER_STATE,
);

export const ResetComposerStateReducer = actionReducer(
  (): ComposerState => ({
    ...InitialState({}),
  }),
);
