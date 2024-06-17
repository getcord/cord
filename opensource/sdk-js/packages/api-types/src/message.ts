import type {
  ServerCreateMessage,
  ServerUpdateMessage,
  ServerListThreadMessageParameters,
  ServerListMessageParameters,
  ServerAppendMessage,
} from '@cord-sdk/types';

/**
 * https://docs.cord.com/rest-apis/messages/
 */
export interface CreateMessageVariables extends ServerCreateMessage {}
/**
 * https://docs.cord.com/rest-apis/messages/
 */
export interface UpdateMessageVariables extends ServerUpdateMessage {}
/**
 * https://docs.cord.com/rest-apis/messages/
 */
export interface ListThreadMessageParameters
  extends ServerListThreadMessageParameters {}
/**
 * https://docs.cord.com/rest-apis/messages/
 */
export interface ListMessageParameters extends ServerListMessageParameters {}

export interface AppendMessageVariables extends ServerAppendMessage {}
