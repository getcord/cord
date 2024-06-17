import type {
  ServerCreateUser,
  ServerListUserParameters,
  ServerUpdateUser,
  ServerListUser,
  ServerListUsers,
  ServerDeleteUser,
} from '@cord-sdk/types';

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface UpdatePlatformUserVariables extends ServerUpdateUser {}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface CreatePlatformUserVariables extends ServerCreateUser {}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface ListPlatformUserVariables extends ServerListUser {}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export type ListUsersResponseWithoutPagination = ServerListUser[];

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface ListUsersResponse extends ServerListUsers {}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface ListUserQueryParameters extends ServerListUserParameters {}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface DeleteUserVariables extends ServerDeleteUser {}
