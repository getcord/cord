import type {
  EntityMetadata,
  FilterParameters,
  GroupID,
  ID,
  ListenerRef,
  OrganizationID,
  PaginationParams,
  UserID,
} from './core.js';
import type { PaginationDetails } from './pagination.js';

/**
 * The data associated with a Cord user.
 */
export interface ClientUserData {
  /**
   * The user's ID.  This is unique within a project.
   */
  id: UserID;
  /**
   * The user's name.
   */
  name: string | null;
  /**
   * The user's short name.  In most cases, Cord components will prefer using
   * this name over `name` when set.
   */
  shortName: string | null;
  /**
   * The primary display name of the user.  This is a readonly field that's
   * provided as a convenience.  Its value is the user's shortName or name,
   * preferring shortName if both are set, or the string "unknown" if neither is
   * set.
   */
  displayName: string;
  /**
   * The secondary display name of the user, in cases where you might want to
   * display a secondary name (such as in a subtitle).  This is a readonly field
   * that's provided as a convenience.  Its value is the user's name or
   * shortName, preferring name if both are set, or the string "Unknown" if
   * neither is set.
   */
  secondaryDisplayName: string;
  /**
   * A URL to the user's profile picture.
   */
  profilePictureURL: string | null;
  /**
   * Any metadata that has been set for the user.
   */
  metadata: EntityMetadata;
}

/**
 * The data associated with the Cord user that's currently logged in.
 */
export interface ViewerUserData extends ClientUserData {
  /**
   * @deprecated - see groupID
   */
  organizationID: OrganizationID | null;
  /**
   * The identifier for the group that the current user is using (i.e.,
   * the group specified in the access token). Null if and only if no
   * group was specified in the access token.
   */
  groupID: GroupID | null;
  notificationPreferences: { sendViaSlack: boolean; sendViaEmail: boolean };
  /**
   * If the user has connected to a Slack user
   */
  isSlackConnected: boolean;
  /**
   * @deprecated - see groupIsSlackConnected
   */
  organizationIsSlackConnected: boolean;
  /**
   * If the group is connected to a Slack workspace
   */
  groupIsSlackConnected: boolean;
  /**
   * The group ids the user is currently a member of.
   */
  groups: GroupID[];
}

export type SingleUserUpdateCallback = (user: ClientUserData | null) => unknown;
export type MultipleUserUpdateCallback = (
  users: Record<string, ClientUserData | null>,
) => unknown;
export type ViewerUserUpdateCallback = (user: ViewerUserData) => unknown;

/**
 * @deprecated - use GroupMembersData instead
 */
export type OrgMembersData = PaginationParams & {
  orgMembers: ClientUserData[];
};
/**
 * @deprecated - use GroupMembersDataCallback instead
 */
export type OrgMembersDataCallback = (data: OrgMembersData) => unknown;
/**
 * @deprecated - use ObserveGroupMembersOptions instead
 */
export type ObserveOrgMembersOptions = {
  organizationID?: string;
};

export type GroupMembersData = PaginationParams & {
  groupMembers: ClientUserData[];
};
export type GroupMembersDataCallback = (data: GroupMembersData) => unknown;

/**
 * Options for the `observeOrgMembers` function in the User API.
 */
export type ObserveGroupMembersOptions = {
  /**
   * The group to search for.  The viewer must be a member of the
   * group in order to receive its data.
   */
  groupID?: string;
};

/**
 * The notification preferences for a user.
 */
export type NotificationPreferences = {
  /**
   * Whether notifications should be sent via slack.
   */
  sendViaSlack: boolean;
  /**
   * Whether notifications should be sent via email.
   */
  sendViaEmail: boolean;
};

/**
 * Use ConnectToSlackOptions instead
 */
export type ConnectToSlackCallback = (success: boolean) => void;

/**
 * Options for the `connectToSlack` function in the User API.
 */
export type ConnectToSlackOptions = {
  /**
   * This callback will be called once the user has finished/cancelled
   * the oauth process. If users interrupt the OAuth process by closing the popup window, this callback will not run.
   * The argument passed to the callback is a boolean which states if the user has successfully connected Slack.
   */
  onCompleteOAuth?: (success: boolean) => void;
  /**
   * The group the user should connect to Slack in.  The viewer must be a member of the
   * group in order for the connection flow to trigger.
   */
  groupID?: string;
};

/** Options for the `disconnectSlackWorkspace` function in the User API */
export type DisconnectSlackWorkspaceOptions = {
  /**
   * The argument passed to the callback will tell you whether the user has
   * successfully disconnected.
   */
  onDisconnect?: (success: boolean) => void;
  /**
   * The group the user will disconnect the Slack workspace from.  The viewer must be a member of the
   * group in order for the disconnection flow to trigger.
   */
  groupID?: string;
};

export type SearchUsersSortByLocation = {
  type: 'location';
  location: Location;
};

export type SearchUsersSortBy = SearchUsersSortByLocation;

export type SearchUsersSortDirection = 'ascending' | 'descending';

/**
 * Options for the `searchUsers` function
 */
export type SearchUsersOptions = {
  /**
   * The string to match the start of a user's name.
   */
  searchQuery?: string;
  /**
   * The group to search within. The viewer must be a member of the
   * group in order to receive its data.
   *
   * If unset, tries to read one from the client auth token.
   */
  groupID?: string;
  /**
   * Sort users in order of when they visited the location.
   */
  sortBy?: SearchUsersSortBy;
  /**
   * This option controls the direction that `sortBy`
   * sorts. Combined with `sortBy`, it determines
   * which searched users are "first".
   *
   * It's a string enum which can have one of the following
   * values:
   *
   * `ascending`: sort users who have not visited the location first in the list,
   * followed by those who visited a long time ago, followed by those who visited
   * recently.
   *
   * `descending`: sort users who have recently visited the location first in the
   * list, followed by those who visited a long time ago, followed by those who
   * have not visited the location at all.
   *
   * If unset, defaults to `descending`.
   */
  sortDirection?: SearchUsersSortDirection;
};

export type SearchUsersResult = {
  users: ClientUserData[];
};

export interface ICordUserSDK {
  /**
   * This method allows you to set notification preferences for the current viewer.
   * @example Overview
   * ```javascript
   * window.CordSDK.user.setNotificationPreferences({ sendViaSlack: true, sendViaEmail: true});
   * ```
   * @param preferences - An object with two optional properties, `sendViaSlack` and `sendViaEmail`,
   * to specify the new notification preferences for the viewer.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  setNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<true>;
  /**
   * This method allows you to observe data about a user, including live
   * updates.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.user.observeUserData(userID, callback);
   * window.CordSDK.user.unobserveUserData(ref);
   * ```
   * @example Usage
   * ```javascript
   * const ref = window.CordSDK.user.observeUserData(
   *   'user-123',
   *   (data) => {
   *     // Received an update!
   *     console.log("User name", data.name);
   *     console.log("User short name", data.shortName);
   *     console.log("User profile picture URL", data.profilePictureURL);
   *   }
   * );
   * ```
   * @param userID - The user to fetch data for.
   * @param callback - This callback will be called once with the current data,
   * and then again every time the data changes.  The argument passed to the
   * callback is an object which will contain the fields described under
   * "Available Data" above.  If there's no user with that ID, the callback will
   * be called with `null`.
   * @returns A reference number which can be passed to `unobserveUserData` to
   * stop observing user data.
   */
  observeUserData(
    userID: UserID,
    callback: SingleUserUpdateCallback,
  ): ListenerRef;
  /**
   * This method allows you to observe data about multiple users, including live
   * updates.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.user.observeUserData(userIDs, callback);
   * window.CordSDK.user.unobserveUserData(ref);
   * ```
   * @example Usage
   * ```javascript
   * const ref = window.CordSDK.user.observeUserData(
   *   ['user-123', 'user-456'],
   *   (data) => {
   *     // Received an update!
   *     console.log("User-123 name", data['user-123']?.name);
   *     console.log("User-456 name", data['user-456']?.name);
   *   }
   * );
   * ```
   * @param userIDs - The list of user IDs to fetch data for.
   * @param callback - This callback will be called once with the current data,
   * and then again every time the data changes.  The argument passed to the
   * callback is an object with a property for each requested user ID.  If the
   * property is missing, the data for that user has not yet been loaded; if
   * there's no user with that ID, it will be `null`; and otherwise it will be
   * an object which will contain the fields described under "Available Data"
   * above.
   * @returns A reference number which can be passed to `unobserveUserData` to
   * stop observing user data.
   */
  observeUserData(
    userIDs: Array<UserID>,
    callback: MultipleUserUpdateCallback,
  ): ListenerRef;
  unobserveUserData(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe data about the logged-in user, including
   * live updates.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.user.observeViewerData(
   *   (data) => {
   *     // Received an update!
   *     console.log("User name", data.name);
   *     console.log("User short name", data.shortName);
   *     console.log("User profile picture URL", data.profilePictureURL);
   *     console.log("Group ID", data.groupID);
   *   }
   * );
   * ```
   * @param callback - This callback will be called once with the current data,
   * and then again every time the data changes.  The argument passed to the
   * callback is an object which will contain the fields described under
   * "Available Data" above.
   * @returns A reference number which can be passed to `unobserveViewerData` to
   * stop observing the data.
   */
  observeViewerData(callback: ViewerUserUpdateCallback): ListenerRef;
  unobserveViewerData(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe the members of a group the current user is
   * a member of - either the current group the viewer is logged into, or, if
   * specified as an option, another group the viewer is a member of.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.user.observeGroupMembers(
   *   ({ groupMembers, loading, hasMore, fetchMore }) => {
   *     console.log('Got a group members update:');
   *     if (loading) {
   *       console.log('Loading...');
   *     }
   *     groupMembers.forEach((groupMember) =>
   *       console.log(`Group member ${groupMember.id} is called ${groupMember.name}!`),
   *     );
   *     if (!loading && hasMore && groupMembers.length < 25) {
   *       // Get the first 25 group members, 10 at a time.
   *       fetchMore(10);
   *     }
   *   },
   *   {groupID: 'group123'}
   * );
   * ```
   * @param callback - This callback will be called once with the current data,
   * and then again every time the data changes.  The argument passed to the
   * callback is an object which will contain the fields described under
   * "Available Data" above.
   * @param options - An object of filters.
   * @returns A reference number which can be passed to `unobserveGroupMembers` to
   * stop observing the data.
   */
  observeGroupMembers(
    callback: GroupMembersDataCallback,
    options?: ObserveGroupMembersOptions,
  ): ListenerRef;
  unobserveGroupMembers(ref: ListenerRef): boolean;
  /*
   * @deprecated Renamed to sdk.user.observeGroupMembers.
   */
  observeOrgMembers(
    callback: OrgMembersDataCallback,
    options?: ObserveOrgMembersOptions,
  ): ListenerRef;
  /*
   * @deprecated Renamed to sdk.user.unobserveGroupMembers.
   */
  unobserveOrgMembers(ref: ListenerRef): boolean;

  /**
   * Calling this method will trigger a popup window to appear containing a flow
   * for the user to link their Cord user to a Slack user.
   * Completion of the flow will additionally connect the user's Slack workspace
   * to their Cord group if that Cord group is not already
   * connected to a Slack workspace.
   * Calling this method will not do anything if the Cord user is already linked
   * to a Slack user.
   * @example Overview
   * ```javascript
   * window.CordSDK.user.connectToSlack(
   *    (success) => console.log('Has user successfully signed into Slack', success)
   * );
   * ```
   * @returns This function returns a promise that resolves to nothing when the Slack connection popup window opens.
   */
  connectToSlack(callback: ConnectToSlackCallback): Promise<void>;
  /**
   * Calling this method will trigger a popup window to appear containing a flow
   * for the user to link their Cord user to a Slack user.
   * Completion of the flow will additionally connect the user's Slack workspace
   * to their Cord group if that Cord group is not already
   * connected to a Slack workspace.
   * Calling this method will not do anything if the Cord user is already linked
   * to a Slack user.
   * @example Overview
   * ```javascript
   * window.CordSDK.user.connectToSlack({
   *    onCompleteOAuth: (success) => console.log('Has user successfully signed into Slack: ', success)
   * });
   * ```
   * @returns This function returns a promise that resolves to nothing when the Slack connection popup window opens.
   */
  connectToSlack(options?: ConnectToSlackOptions): Promise<void>;

  /**
   * This method will disconnect the Slack workspace from the Cord group.
   * This means all users who were connected to Slack will also be disconnected.
   * @example Overview
   * ```javascript
   * window.CordSDK.user.disconnectSlackWorkspace({
   *    onDisconnect: (success) => console.log('User successfully disconnected: ', success)
   * });
   * ```
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  disconnectSlackWorkspace(
    options?: DisconnectSlackWorkspaceOptions,
  ): Promise<boolean>;

  /**
   * This method allows searching for users with various options.
   * Using the `searchQuery` will filter users by what their name start with.
   * @example Overview
   * ```javascript
   * // Will return a list of users with names beginning with 'al'
   * await window.CordSDK.user.searchUsers({ searchQuery: 'al', groupID: 'my-group-id'});
   * ```
   * @returns A promise that resolves to into an object with `users` which
   * is a list of users in the group. This is a one time return.
   */
  searchUsers(options?: SearchUsersOptions): Promise<SearchUsersResult>;
}

export interface ServerUserData {
  /**
   * Provided ID for the user
   *
   */
  id: ID;

  /**
   * Email address
   *
   * @format email
   */
  email: string | null;

  /**
   * Full user name
   */
  name: string | null;

  /**
   * Short user name. In most cases, this will be preferred over name when set.
   */
  shortName: string | null;

  /**
   * @deprecated alias for shortName.
   */
  short_name: string | null;

  status: 'active' | 'deleted';

  /**
   * This must be a valid URL, which means it needs to follow the usual URL
   * formatting and encoding rules. For example, any space character will need
   * to be encoded as `%20`. We recommend using your programming language's
   * standard URL encoding function, such as `encodeURI` in Javascript.
   *
   * @format uri
   */
  profilePictureURL: string | null;

  /**
   * Alias for profilePictureURL. This field is deprecated.
   *
   * @deprecated
   *
   * @format uri
   */
  profile_picture_url: string | null;

  /**
   * User's first name. This field is deprecated and has no effect.
   *
   * @deprecated
   */
  first_name: string | null;

  /**
   * User's last name. This field is deprecated and has no effect.
   *
   * @deprecated
   */
  last_name: string | null;

  /**
   * Arbitrary key-value pairs that can be used to store additional information.
   */
  metadata: EntityMetadata;

  /**
   * Creation timestamp
   */
  createdTimestamp: Date | null;
}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export type ServerUpdateUser = Partial<
  Omit<ServerUserData, 'id' | 'createdTimestamp'>
> & {
  /**
   * A list of group IDs this user should be made a member of.  It is an error
   * to specify a group that doesn't exist or one that is also being removed in
   * the same call.  It is not an error to add a user to a group they're already
   * a member of.
   */
  addGroups?: GroupID[];

  /**
   * A list of group IDs this user should stop being a member of.  It is an
   * error to specify a group that doesn't exist or one that is also being added
   * in the same call.  It is not an error to remove a user from a group they
   * are not a member of.
   */
  removeGroups?: GroupID[];
};

/**
 * @deprecated type for deprecated api route
 */
export type ServerCreateUser = Omit<
  ServerUpdateUser,
  'addGroups' | 'removeGroups'
> &
  Required<Pick<ServerUserData, 'id'>>;

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface ServerListUser extends Omit<ServerUserData, 'email'> {
  email: string | null;
}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface ServerGetUser extends ServerListUser {
  /**
   * @deprecated - use groups instead
   */
  organizations: ID[];
  /**
   * List of groups the user is a member of.
   */
  groups: ID[];
  /**
   * A list containing all the groups the user has explicity linked their Slack
   * profile to. This list excludes groups connected to a Slack workspace where
   * the user has not linked their Slack profile.
   */
  groupIDsWithLinkedSlackProfile: GroupID[];
}

/**
 * https://docs.cord.com/rest-apis/users/
 */
export interface ServerListUsers {
  users: ServerListUser[];
  pagination: PaginationDetails;
}

export type ServerListUserParameters = {
  /**
   * Number of users to return.
   * The default limit is set to 1000.
   */
  limit?: number;

  /**
   * Pagination token. This is returned in the `pagination` object of a previous response.
   */
  token?: string;

  /**
   * This is a JSON object with one optional entry.  Users will be matched
   * against the filter specified. This is a partial match, which means any keys
   * other than the ones you specify are ignored when checking for a match.
   * Please note that because this is a query parameter in a REST API, this JSON
   * object must be URI encoded before being sent.
   */
  filter?: Pick<FilterParameters, 'metadata'>;
};

export interface ServerDeleteUser {
  /**
   * The user will be deleted only if this value is true.
   */
  permanently_delete: boolean;
}
