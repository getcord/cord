import { useCallback } from 'react';
import { useLiveQuery } from 'external/src/effects/useLiveQuery.ts';
import type { JsonObject, PreferencesValueType } from 'common/types/index.ts';
import type { PreferencesSubscriptionResult } from 'external/src/graphql/operations.ts';
import { useSetPreferenceMutation } from 'external/src/graphql/operations.ts';
import { jsonObjectReduce } from 'common/util/jsonObjectReducer.ts';

function reduce(x: JsonObject | undefined, y: PreferencesSubscriptionResult) {
  return jsonObjectReduce(x, y.preferencesLiveQuery);
}
export function useRemotePreferences() {
  const [preferences, setPreferences] = useLiveQuery(
    'PreferencesSubscription',
    reduce,
  );

  const [setRemotePreference] = useSetPreferenceMutation();

  const setPreference = useCallback(
    (key: string, value: PreferencesValueType) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      setPreferences((preferences) => ({
        ...preferences,
        [key]: value,
      }));

      void setRemotePreference({
        variables: { key, value },
      });
    },
    [setRemotePreference, setPreferences],
  );

  return [preferences, setPreference] as const;
}
