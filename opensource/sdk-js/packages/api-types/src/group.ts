import type {
  ServerUpdateGroupMembers,
  ServerUpdateGroup,
} from '@cord-sdk/types';

/**
 * https://docs.cord.com/rest-apis/groups/
 */
export interface UpdatePlatformGroupVariables extends ServerUpdateGroup {}

/**
 * https://docs.cord.com/rest-apis/groups/
 */
export interface UpdatePlatformGroupMembersVariables
  extends ServerUpdateGroupMembers {}
