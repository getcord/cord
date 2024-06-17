import type { Context } from 'react';
import { useContext } from 'react';
import { assert } from 'common/util/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

// Giving a dummy default value to React.createContext is an anti-pattern.
// When creating contexts, **YOU MUST** initialise them like so:
// `createContext(NO_PROVIDER_DEFINED);`
// When reading a value from the Context, **YOU MUST** use this custom hook.
// The only 2 `React.useContext` in the codebase are when we might or might not have
// a provider and need to do different things accordingly.
// For more info, see  https://www.notion.so/getcord/useContext-refactor-c6be26be1b8941fe8a7593542a6c8044
export function useContextThrowingIfNoProvider<C>(
  context: Context<C | typeof NO_PROVIDER_DEFINED>,
): C {
  const contextValue = useContext(context);
  assert(
    contextValue !== NO_PROVIDER_DEFINED,
    `Context is not wrapped in a provider.`,
  );
  return contextValue;
}
