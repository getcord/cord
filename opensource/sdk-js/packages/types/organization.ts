import type { EntityMetadata, ID } from './core.js';

/**
 * @deprecated use ServerGroupData instead
 */
export interface ServerOrganizationData {
  /**
   * ID of the organization
   */
  id: ID;

  /**
   * Organization name. Required when creating an organization.
   */
  name: string;

  /**
   * Whether this organization is active or deleted.  Attempting to log into a
   * deleted organization will fail.
   */
  status: 'active' | 'deleted';

  /**
   * List of partner-specific IDs of the users who are members of this organization
   */
  members: ID[];

  /**
   * If the organization has connected to a Slack workspace
   */
  connectedToSlack: boolean;

  /**
   * Arbitrary key-value pairs that can be used to store additional information.
   */
  metadata: EntityMetadata;
}

/**
 * @deprecated use ServerUpdateGroup instead
 */
export type ServerUpdateOrganization = Partial<
  Omit<ServerOrganizationData, 'id' | 'members' | 'connectedToSlack'> & {
    /**
     * List of partner-specific IDs of the users who are members of this organization.
     * This will replace the existing members.
     */
    members?: ID[];
  }
>;

/**
 * @deprecated use ServerUpdateGroupMembers instead
 */
export interface ServerUpdateOrganizationMembers {
  /**
   * The IDs of users to add to this organization.
   */
  add?: ID[];
  /**
   * The IDs of users to remove from this organization.
   */
  remove?: ID[];
}

/**
 * @deprecated type for deprecated api route
 */
export type ServerCreateOrganization = Omit<
  ServerOrganizationData,
  'connectedToSlack' | 'status' | 'members' | 'metadata'
> &
  Partial<Pick<ServerOrganizationData, 'status' | 'members' | 'metadata'>>;

/**
 * @deprecated use ServerGetGroup instead
 */
export interface ServerGetOrganization extends ServerOrganizationData {}

/**
 * @deprecated use ServerListGroup instead
 */
export interface ServerListOrganization
  extends Omit<ServerOrganizationData, 'members'> {}
