import type {
  ServerUpdateOrganizationMembers,
  ServerCreateOrganization,
  ServerUpdateOrganization,
} from '@cord-sdk/types';

/**
 * @deprecated Use UpdatePlatformGroupVariables
 * https://docs.cord.com/rest-apis/group/
 */
export interface UpdatePlatformOrganizationVariables
  extends ServerUpdateOrganization {}

/**
 * @deprecated Use UpdatePlatformGroupMembersVariables
 * https://docs.cord.com/rest-apis/groups/
 */
export interface UpdatePlatformOrganizationMembersVariables
  extends ServerUpdateOrganizationMembers {}

/**
 * @deprecated Use CreatePlatformGroupVariables
 * https://docs.cord.com/rest-apis/groups/
 */
export interface CreatePlatformOrganizationVariables
  extends ServerCreateOrganization {}
