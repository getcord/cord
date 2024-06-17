import type { EntityMetadata, ID } from './core.js';
import type { PaginationDetails } from './pagination.js';
import type { ServerListUser } from './user.js';

export interface ServerGroupData {
  /**
   * ID of the group
   */
  id: ID;

  /**
   * Group name. Required when creating an group.
   */
  name: string;

  /**
   * Whether this group is active or deleted.  Attempting to log into a
   * deleted group will fail.
   */
  status: 'active' | 'deleted';

  /**
   * List of partner-specific IDs of the users who are members of this group
   */
  members: ID[];

  /**
   * If the group has connected to a Slack workspace
   */
  connectedToSlack: boolean;

  /**
   * Arbitrary key-value pairs that can be used to store additional information.
   */
  metadata: EntityMetadata;
}

export type ServerUpdateGroup = Partial<
  Omit<ServerGroupData, 'id' | 'members' | 'connectedToSlack'> & {
    /**
     * List of partner-specific IDs of the users who are members of this group.
     * This will replace the existing members.
     */
    members?: ID[];
  }
>;

export interface ServerUpdateGroupMembers {
  /**
   * The IDs of users to add to this group.
   */
  add?: ID[];
  /**
   * The IDs of users to remove from this group.
   */
  remove?: ID[];
}

export interface ServerGetGroup extends ServerGroupData {}

export interface ServerListGroup extends Omit<ServerGroupData, 'members'> {}

export interface ServerListGroupMember
  extends Omit<
    ServerListUser,
    'short_name' | 'profile_picture_url' | 'first_name' | 'last_name'
  > {}

export interface ServerListGroupMembers {
  users: ServerListGroupMember[];
  pagination: PaginationDetails;
}

export type ServerListGroupMembersParameters = {
  /**
   * Number of group members to return.
   * The default limit is set to 1000.
   */
  limit?: number;

  /**
   * Pagination token. This is returned in the `pagination` object of a previous response.
   */
  token?: string;
};
