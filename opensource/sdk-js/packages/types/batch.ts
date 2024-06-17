import type { ID } from './core.js';
import type { ServerUpdateGroup } from './group.js';
import type { ServerUpdateUser } from './user.js';

type BatchUpdateUser = Omit<ServerUpdateUser, 'addGroups' | 'removeGroups'> & {
  id: ID;
};

type BatchUpdateGroup = ServerUpdateGroup & { id: ID };

/**
 * https://docs.cord.com/rest-apis/batch/
 */
export interface ServerUpdateBatch {
  /**
   * List of user objects. Every object must include the id field. If the user
   * already exists, all other fields are optional and only updated when
   * present. If the user does not already exist, fields are required as
   * described in the [Create or update a
   * user](https://docs.cord.com/rest-apis/users#Create-or-update-a-user)
   * API.
   *
   * @maxItems 10000
   */
  users?: BatchUpdateUser[];
  /**
   * @deprecated Use `groups` instead.
   *
   * @maxItems 1000
   */
  organizations?: BatchUpdateGroup[];
  /**
   * List of group objects. Every object must include the id field. If
   * the group already exists, all other fields are optional and only
   * updated when present. If the group does not already exist, fields
   * are required as described in the [Create or update a
   * group](https://docs.cord.com/rest-apis/groups/#create-or-update-a-group)
   * API.
   *
   * @maxItems 1000
   */
  groups?: BatchUpdateGroup[];
}
