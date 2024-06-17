import type {
  EntityMetadata,
  UUID,
  Location,
  Nullable,
} from 'common/types/index.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

export type SetPropertiesPayload = {
  id: UUID;
  resolved?: boolean;
  resolvedTimestamp?: Nullable<Date>;
  name?: Nullable<string>;
  metadata?: EntityMetadata;
  extraClassnames?: Nullable<string>;
  url?: string;
  location?: Location;
};

export const SetPropertiesAction = action<SetPropertiesPayload>(
  ThreadsActions.SET_PROPERTIES,
);

export const SetPropertiesReducer = actionReducer(
  (state: ThreadsState, payload: SetPropertiesPayload) => {
    const thread = state.threadsData[payload.id];
    if (!thread) {
      return state;
    }

    // We sometimes get updates where nothing has changed, and we don't want to
    // trigger a rerender for that, so check to make sure we are actually
    // changing something
    let different = false;
    let field: keyof typeof payload;
    for (field in payload) {
      if (
        payload[field] !== undefined &&
        !isEqual(payload[field], thread[field]) // Some props are objects (eg, location)
      ) {
        different = true;
        break;
      }
    }
    if (!different) {
      return state;
    }

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: {
          ...thread,
          ...payload,
        },
      },
    };
  },
);
