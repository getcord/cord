import { usePreference } from 'external/src/effects/usePreference.ts';
import type { TaskInputType } from 'external/src/graphql/operations.ts';
import { DEFAULT_TASK_TYPE } from 'common/const/UserPreferenceKeys.ts';

export function useDefaultTaskType() {
  const [defaultTaskType, setDefaultTaskType] =
    usePreference<TaskInputType>(DEFAULT_TASK_TYPE);
  return [defaultTaskType ?? 'cord', setDefaultTaskType] as const;
}
