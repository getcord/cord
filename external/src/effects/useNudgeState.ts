import { useCallback } from 'react';
import type { NudgeType } from 'external/src/lib/nudge.ts';
import { PreferencesContext } from 'external/src/context/preferences/PreferencesContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const dismissedKeyForNudge = (type: NudgeType) => `nudge_${type}_dismissed`;
const seenKeyForNudge = (type: NudgeType) => `nudge_${type}_seen`;

export function useNudgeState() {
  const { preferences, setPreference } =
    useContextThrowingIfNoProvider(PreferencesContext);

  const isNudgeDismissed = useCallback(
    (nudgeType: NudgeType) =>
      preferences[dismissedKeyForNudge(nudgeType)] === true,
    [preferences],
  );

  const dismissNudge = useCallback(
    (nudgeType: NudgeType) =>
      setPreference(dismissedKeyForNudge(nudgeType), true),
    [setPreference],
  );

  const isNudgeSeen = useCallback(
    (nudgeType: NudgeType) => preferences[seenKeyForNudge(nudgeType)] === true,
    [preferences],
  );

  const setNudgeSeen = useCallback(
    (nudgeType: NudgeType, seen: boolean) =>
      setPreference(seenKeyForNudge(nudgeType), seen),
    [setPreference],
  );

  return { isNudgeDismissed, dismissNudge, isNudgeSeen, setNudgeSeen };
}
