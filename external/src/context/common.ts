import type { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type ActionType = ComposerActions | ThreadsActions;

interface Action<Payload = any> {
  type: ActionType;
  payload: Payload;
}

export type ActionReducer<State> = (state: State, action: Action) => State;

export type ActionDispatch = (action: Action) => void;

// generic action function, to be used to each action to define its type and payload
export const action =
  <Payload>(type: ActionType) =>
  (payload?: Payload): Action<Payload> => ({
    type,
    payload: payload as Payload,
  });

// generic action reducer, to be used by each action to reduce state using the action specific payload
export const actionReducer =
  <State, Payload = any>(callback: (state: State, payload: Payload) => State) =>
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  (state: State, action: Action<Payload>) =>
    callback(state, action.payload);

// generic context reducer function, to be reused by each context to reduce all its actions
export const contextReducer =
  <State>(
    actions: Map<ActionType, ActionReducer<State>>,
  ): ActionReducer<State> =>
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  (state: State, action: Action): State => {
    const reducer = actions.get(action.type);
    if (reducer) {
      return reducer(state, action);
    } else {
      console.warn(
        'Chat action dispatched which has no reducer. Action: ' +
          JSON.stringify(action, null, 4),
      );
    }

    return state;
  };
