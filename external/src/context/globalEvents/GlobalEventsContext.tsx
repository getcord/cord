import type { MutableRefObject } from 'react';
import { createContext } from 'react';
import type {
  XFrameMessage,
  XFrameMessageRequestData,
  XFrameMessageType,
  XFrameMessageResponse,
  MessageListener,
} from 'external/src/lib/xframe/types.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type GlobalEventType = XFrameMessageType;
export type GlobalEvent<T extends GlobalEventType = GlobalEventType> =
  XFrameMessage<T>;
export type GlobalEventPayload<T extends GlobalEventType> =
  XFrameMessageRequestData<T>;
export type GlobalEventResponse<T extends GlobalEventType> =
  XFrameMessageResponse<T>;

export type SlackConnectEventsRefType = MutableRefObject<(() => void) | null>;

export type GlobalEventsContextType = {
  addGlobalEventListener: <T extends GlobalEventType>(
    type: T,
    callback: MessageListener<T>,
  ) => () => void;
  removeGlobalEventListener: <T extends GlobalEventType>(
    type: T,
    callback: MessageListener<T>,
  ) => void;
  triggerGlobalEvent: <T extends GlobalEventType>(
    targetWindow: Window | null,
    type: T,
    ...data: GlobalEventPayload<T> extends never ? [] : [GlobalEventPayload<T>]
  ) => GlobalEventResponse<T>;
  slackEvents: {
    onSlackConnectErrorRef: SlackConnectEventsRefType;
    onSlackConnectSuccessRef: SlackConnectEventsRefType;
  };
};

/**
 * By default, this context uses XFrame messages, as that's what the original
 * sidebar (extension/embed) uses.
 * SDK components don't need XFrame messages, so we implement these methods differently
 * (This is done by wrapping SDK components in a new Provider which implements them)
 */
export const GlobalEventsContext = createContext<
  GlobalEventsContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
