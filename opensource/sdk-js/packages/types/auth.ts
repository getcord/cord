import type { ID } from './core.js';
import type { ServerUpdateGroup } from './group.js';
import type { ServerUpdateOrganization } from './organization.js';
import type { ServerUpdateUser } from './user.js';

/**
 * https://docs.cord.com/reference/authentication/
 * @additionalProperties true
 */
export interface ClientAuthTokenData {
  /**
   * @deprecated - use project_id instead
   * @format uuid
   */
  app_id?: string;
  /**
   * Your project ID
   * @format uuid
   */
  project_id?: string;
  /**
   * The ID for the user
   */
  user_id: ID;
  /**
   * @deprecated - use group_id instead
   */
  organization_id?: ID;
  /**
   * The ID for the user’s group
   */
  group_id?: ID;
  /**
   * If present, update’s the user’s details, or creates a user with those
   * details if the user_id is new to Cord. This is an object that contains the
   * same fields as the [user management REST
   * endpoint](https://docs.cord.com/rest-apis/users/)
   */
  user_details?: ServerUpdateUser;
  /**
   * @deprecated - use group_details instead
   */
  organization_details?: ServerUpdateOrganization;
  /**
   * If present, updates the group's details, or creates a group
   * with those details if the group_id is new to Cord. This is an object
   * that contains the same fields as the [group management REST
   * endpoint](https://docs.cord.com/rest-apis/groups/)
   */
  group_details?: ServerUpdateGroup;
}
