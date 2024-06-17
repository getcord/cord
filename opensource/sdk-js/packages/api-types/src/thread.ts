import type {
  ServerCreateThread,
  ServerListThreadParameters,
  ServerUpdateThread,
} from '@cord-sdk/types';

/**
 * https://docs.cord.com/rest-apis/threads/
 */
export interface CreateThreadVariables
  extends Omit<ServerCreateThread, 'resolved' | 'organizationID'> {}
/**
 * https://docs.cord.com/rest-apis/threads/
 */
export interface UpdateThreadVariables extends ServerUpdateThread {}
/**
 * https://docs.cord.com/rest-apis/threads/
 */
export interface ListThreadQueryParameters extends ServerListThreadParameters {}
