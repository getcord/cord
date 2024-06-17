import type {
  ServerCreateApplication,
  ServerUpdateApplication,
  ServerDeleteApplication,
} from '@cord-sdk/types';

/**
 * https://docs.cord.com/rest-apis/applications/
 */
export interface CreateApplicationVariables extends ServerCreateApplication {}
/**
 * https://docs.cord.com/rest-apis/applications/
 */
export interface UpdateApplicationVariables extends ServerUpdateApplication {}
/**
 * https://docs.cord.com/rest-apis/applications/
 */
export interface DeleteApplicationVariables extends ServerDeleteApplication {}
