import { useCallback } from 'react';
import { PreferencesContext } from 'external/src/context/preferences/PreferencesContext.ts';
import type { PreferencesValueType } from 'common/types/index.ts';
import { USER_PREFERENCE_KEY_LENGTH_LIMIT } from 'common/const/UserPreferenceKeys.ts';
import { sha256Hash, SHA256_HASH_LENGTH } from 'common/util/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

/**
 * If the @key is `null`, the hook will return `[undefined, doNothing]`
 */
export function usePreference<T extends PreferencesValueType = boolean>(
  key: string | null,
): [T | undefined, (value: T) => void] {
  // If the key is excessively long, safely substitute with a shortened key
  const shortenedKey = key && enforceUserPreferenceKeyLengthLimit(key);

  const { preferences, setPreference } =
    useContextThrowingIfNoProvider(PreferencesContext);

  const value = shortenedKey
    ? (preferences[shortenedKey] as T | undefined)
    : undefined;
  const setValue = useCallback(
    (enabled: T) => {
      if (shortenedKey !== null) {
        setPreference(shortenedKey, enabled);
      }
    },
    [setPreference, shortenedKey],
  );

  return [value, setValue];
}

/**
 * Make sure a user preferences key fits within the length limit
 *
 * If the given key is smaller then the length limit, it is returned as is. If
 * the given key is as long as or longer than the length limit, a replacement
 * key is constructed whose length is exactly the limit.
 *
 * Replacement keys are always of length USER_PREFERENCE_KEY_LENGTH_LIMIT,
 * whereas keys that are kept unchanged must be shorter than that. This is to
 * make sure that replacement keys never clash with an original key.
 *
 * @param key the original key
 * @returns a key that is not longer than USER_PREFERENCE_KEY_LENGTH_LIMIT
 */
function enforceUserPreferenceKeyLengthLimit(key: string) {
  if (key.length >= USER_PREFERENCE_KEY_LENGTH_LIMIT) {
    return `${key.substring(
      0,
      USER_PREFERENCE_KEY_LENGTH_LIMIT - 1 - SHA256_HASH_LENGTH,
    )}!${sha256Hash(key)}`;
  } else {
    return key;
  }
}
