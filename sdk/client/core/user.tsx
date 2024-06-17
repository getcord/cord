import { useEffect } from 'react';
import type { ApolloClient } from '@apollo/client';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type {
  ICordUserSDK,
  ListenerRef,
  MultipleUserUpdateCallback,
  SingleUserUpdateCallback,
  ClientUserData,
  ViewerUserData,
  ViewerUserUpdateCallback,
  NotificationPreferences,
  OrgMembersDataCallback,
  ObserveOrgMembersOptions,
  ObserveGroupMembersOptions,
  GroupMembersDataCallback,
  FetchMoreCallback,
  ConnectToSlackCallback,
  ConnectToSlackOptions,
  DisconnectSlackWorkspaceOptions,
  SearchUsersResult,
  SearchUsersOptions,
} from '@cord-sdk/types';
import type {
  UserFragment,
  SetPreferenceMutationVariables,
  SetPreferenceMutationResult,
  UnlinkOrgMutationResult,
  AccessTokenQueryResult,
  AutocompleteQueryResult,
} from 'external/src/graphql/operations.ts';
import {
  AccessTokenQuery,
  AutocompleteQuery,
  SetPreferenceMutation,
  UnlinkOrgMutation,
} from 'external/src/graphql/operations.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { CordSDK } from 'sdk/client/core/index.tsx';
import type { CordInternalCall } from 'sdk/client/core/index.tsx';
import {
  logApiCall,
  logDeprecatedCall,
} from 'sdk/client/core/cordAPILogger.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import type { NotificationChannels } from 'common/types/index.ts';
import { NOTIFICATION_CHANNELS } from 'common/const/UserPreferenceKeys.ts';
import { defaultNotificationPreference } from 'common/util/notifications.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';
import { makeGenericExporter } from 'sdk/client/core/genericExporter.tsx';
import {
  checkGroupIDExists,
  throwUnknownApiError,
} from 'sdk/client/core/util.ts';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { listenForSlackOAuthMessages } from 'external/src/lib/auth/oauthMessageHandler.ts';
import { openPopupWindow } from 'external/src/lib/auth/utils.ts';
import { useGetGroupMembers } from 'sdk/client/core/react/useGetGroupMembers.ts';
import { DEFAULT_GROUP_MEMBERS_INITIAL_PAGE_SIZE } from 'common/const/Api.ts';
import { useReffedFn } from '@cord-sdk/react/hooks/useReffedFn.ts';

type RequestUsersFunction = (...ids: string[]) => void;

type ListenerRecord =
  | {
      type: 'single';
      id: string;
      callback: SingleUserUpdateCallback;
    }
  | {
      type: 'multiple';
      ids: Array<string>;
      callback: MultipleUserUpdateCallback;
    };

type GroupMemberListenerState = {
  callback: GroupMembersDataCallback;
  options: ObserveGroupMembersOptions;
};

export type InternalUserSDK = ICordUserSDK & {
  _getViewer(): ViewerUserData | null;
};

export class UserSDK implements ICordUserSDK {
  private _viewerListeners = new Map<ListenerRef, ViewerUserUpdateCallback>();
  private _viewerData: ViewerUserData | null = null;

  private _userListeners = new Map<ListenerRef, ListenerRecord>();
  private _users = new Map<string, ClientUserData | null>();

  private _orgMemberExporter = makeGenericExporter(OrgMemberReporter);

  private _requestUsers: RequestUsersFunction = this._enqueueUserForRequest;
  private _usersPendingRequest = new Set<string>();

  private _listenerKey = 0;

  private _slackOAuthStopListening: (() => void) | undefined = undefined;

  constructor(private client: ApolloClient<any>) {}

  observeViewerData(
    callback: ViewerUserUpdateCallback,
    options: CordInternalCall = {},
  ): ListenerRef {
    if (!options.__cordInternal) {
      logApiCall('user', 'observeViewerData');
    }
    const key = this._listenerKey++;
    this._viewerListeners.set(key, callback);
    if (this._viewerData) {
      callback(this._viewerData);
    }
    return key;
  }
  unobserveViewerData(ref: ListenerRef): boolean {
    if (this._viewerListeners.has(ref)) {
      this._viewerListeners.delete(ref);
      return true;
    }
    return false;
  }

  observeUserData(
    userID: string,
    callback: SingleUserUpdateCallback,
    options?: CordInternalCall,
  ): ListenerRef;
  observeUserData(
    userIDs: string[],
    callback: MultipleUserUpdateCallback,
    options?: CordInternalCall,
  ): ListenerRef;
  observeUserData(
    userIDorIDs: string | Array<string>,
    callback: SingleUserUpdateCallback | MultipleUserUpdateCallback,
    options: CordInternalCall = {},
  ): ListenerRef {
    if (!options.__cordInternal) {
      logApiCall('user', 'observeUserData');
    }
    const key = this._listenerKey++;
    if (
      Array.isArray(userIDorIDs) &&
      userIDorIDs.every((id) => typeof id === 'string')
    ) {
      this._userListeners.set(key, {
        type: 'multiple',
        ids: [...userIDorIDs],
        callback: callback as MultipleUserUpdateCallback,
      });
      this._requestUsers(...userIDorIDs);
    } else if (typeof userIDorIDs === 'string') {
      this._userListeners.set(key, {
        type: 'single',
        id: userIDorIDs,
        callback: callback as SingleUserUpdateCallback,
      });
      this._requestUsers(userIDorIDs);
    } else {
      throw new Error('Argument must be a string or array of strings');
    }
    this._callListener(this._userListeners.get(key)!);
    return key;
  }
  unobserveUserData(ref: ListenerRef): boolean {
    if (this._userListeners.has(ref)) {
      this._userListeners.delete(ref);
      return true;
    }
    return false;
  }

  /**
   * @deprecated Renamed to sdk.user.observeGroupMembers.
   */
  observeOrgMembers(
    callback: OrgMembersDataCallback,
    options: ObserveOrgMembersOptions = {},
  ): ListenerRef {
    logDeprecatedCall('user.observeOrgMembers');

    const callbackWithGroup = ({
      groupMembers,
      loading,
      fetchMore,
      hasMore,
    }: {
      groupMembers: ClientUserData[];
      loading: boolean;
      fetchMore: FetchMoreCallback;
      hasMore: boolean;
    }) => {
      callback({ orgMembers: groupMembers, loading, fetchMore, hasMore });
    };
    const optionsWithGroup = { groupID: options.organizationID };

    return this._orgMemberExporter.observe({
      callback: callbackWithGroup,
      options: optionsWithGroup,
    });
  }

  /**
   * @deprecated Renamed to sdk.user.unobserveGroupMembers.
   */
  unobserveOrgMembers(ref: ListenerRef): boolean {
    return this._orgMemberExporter.unobserve(ref);
  }

  observeGroupMembers(
    callback: GroupMembersDataCallback,
    options: ObserveGroupMembersOptions = {},
  ): ListenerRef {
    logApiCall('user', 'observeGroupMembers');
    return this._orgMemberExporter.observe({
      callback,
      options,
    });
  }

  unobserveGroupMembers(ref: ListenerRef): boolean {
    return this._orgMemberExporter.unobserve(ref);
  }

  get _OrgMemberExporterElement() {
    return this._orgMemberExporter.Element;
  }

  async setNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<true> {
    logApiCall('user', 'setNotificationPreferences');
    const prioritizedPreferences = {
      ...this._viewerData?.notificationPreferences,
      ...preferences,
    };
    const result = await this.client.mutate<
      SetPreferenceMutationResult,
      SetPreferenceMutationVariables
    >({
      mutation: SetPreferenceMutation,
      variables: {
        key: 'notification_channels',
        value: {
          slack: prioritizedPreferences.sendViaSlack,
          email: prioritizedPreferences.sendViaEmail,
        },
      },
    });
    if (result.errors?.length) {
      const concatenatedErrors = result.errors.join(', ');
      throw new Error(
        `Something went wrong trying to update your notification preferences: ${concatenatedErrors}`,
      );
    }
    return true;
  }

  async connectToSlack(callback: ConnectToSlackCallback): Promise<void>;
  async connectToSlack(options: ConnectToSlackOptions): Promise<void>;
  async connectToSlack(
    options: ConnectToSlackCallback | ConnectToSlackOptions = {},
  ): Promise<void> {
    logApiCall('user', 'connectToSlack');
    if (
      this._viewerData?.isSlackConnected ||
      CordSDK.get().options.enable_slack === false
    ) {
      return;
    }

    let onCompleteOAuth: ConnectToSlackOptions['onCompleteOAuth'] = undefined;
    let groupID: string | undefined = undefined;

    // To allow backwards compatibility
    if (typeof options !== 'object') {
      onCompleteOAuth = options;
      logDeprecatedCall('user.connectToSlack: ConnectToSlackCallback');
    }

    if ('onCompleteOAuth' in options) {
      onCompleteOAuth = options.onCompleteOAuth;
    }

    if ('groupID' in options) {
      groupID = options.groupID;
    }

    checkGroupIDExists('connectToSlack', this._viewerData?.groupID, groupID);

    const { data, error } = await this.client.query<AccessTokenQueryResult>({
      query: AccessTokenQuery,
      variables: { groupID: null, _externalOrgID: groupID },
    });

    if (error) {
      throw new Error(error.message);
    }

    const slackConnectURL = `${API_ORIGIN}/auth/slack/linking-confirmation?authToken=${data.viewer.accessToken}`;
    openPopupWindow(slackConnectURL);
    const stopListening = listenForSlackOAuthMessages({
      onComplete: () => onCompleteOAuth?.(true),
      onError: () => onCompleteOAuth?.(false),
      onCancelled: () => onCompleteOAuth?.(false),
    });
    if (this._slackOAuthStopListening) {
      this._slackOAuthStopListening();
    }
    this._slackOAuthStopListening = stopListening;
  }

  async disconnectSlackWorkspace(
    options: DisconnectSlackWorkspaceOptions = {},
  ): Promise<boolean> {
    logApiCall('user', 'disconnectSlackWorkspace');
    const onDisconnect: DisconnectSlackWorkspaceOptions['onDisconnect'] =
      options?.onDisconnect;
    const groupID: DisconnectSlackWorkspaceOptions['groupID'] =
      options?.groupID;

    checkGroupIDExists(
      'disconnectSlackWorkspace',
      this._viewerData?.groupID,
      groupID,
    );

    if (
      this._viewerData?.groupID &&
      (!this._viewerData?.groupIsSlackConnected ||
        !this._viewerData?.organizationIsSlackConnected)
    ) {
      onDisconnect?.(true);
      return true;
    }

    const result = await this.client.mutate<UnlinkOrgMutationResult>({
      mutation: UnlinkOrgMutation,
      variables: {
        _externalOrgID: groupID,
      },
    });

    if (result.data?.unlinkOrgs.success !== undefined) {
      onDisconnect?.(result.data?.unlinkOrgs.success);
      return result.data?.unlinkOrgs.success;
    } else if (result.errors?.length) {
      onDisconnect?.(false);
      throw result.errors[0];
    } else {
      onDisconnect?.(false);
      throwUnknownApiError();
    }
  }

  async searchUsers(options?: SearchUsersOptions): Promise<SearchUsersResult> {
    logApiCall('user', 'searchUsers');
    const groupID = options?.groupID;

    const groupIDToQuery = checkGroupIDExists(
      'searchUsers',
      this._viewerData?.groupID,
      groupID,
    );

    const location = options?.sortBy?.location;
    const sortUsersDirection = options?.sortDirection;
    const { data, error } = await this.client.query<AutocompleteQueryResult>({
      query: AutocompleteQuery,
      variables: {
        nameQuery: options?.searchQuery,
        _externalOrgID: groupIDToQuery,
        sortUsersBy: location,
        sortUsersDirection,
      },
    });

    if (error) {
      throw new Error('SearchUsers: Could not get retrieve users');
    }

    const usersInGroup: ClientUserData[] =
      data.organizationByExternalID?.usersWithOrgDetails
        .filter((users) => users !== undefined)
        .map((user) => userToUserData(user)) ?? [];

    return { users: usersInGroup };
  }

  // Old functions that were called from (undocumented) code in the NPM package,
  // and thus might still be called by old versions our customers have installed

  // TODO(flooey): Remove these when we're pretty sure they're not called
  // anymore
  getViewerID(): Promise<string> {
    return new Promise((resolve) => {
      const listenerRef = this.observeViewerData(
        (viewerData) => {
          resolve(viewerData.id);
          this.unobserveViewerData(listenerRef);
        },
        { __cordInternal: true },
      );
    });
  }
  addUserListener(
    id: string,
    listener: (user: ClientUserData) => unknown,
  ): ListenerRef {
    return this.observeUserData(id, (userData) => {
      if (userData) {
        listener(userData);
      }
    });
  }
  removeUserListener(ref: ListenerRef): void {
    this.unobserveUserData(ref);
  }

  private _callListener(record: ListenerRecord) {
    if (record.type === 'single') {
      if (this._users.has(record.id)) {
        record.callback(this._users.get(record.id) as ClientUserData | null);
      }
    } else {
      const ids = [...record.ids];
      const idsWithValues = ids.filter((id) => this._users.has(id));
      if (idsWithValues.length > 0) {
        const callbackValue: Record<string, ClientUserData | null> = {};
        idsWithValues.forEach(
          (id) =>
            (callbackValue[id] = this._users.get(id) as ClientUserData | null),
        );
        record.callback(callbackValue);
      }
    }
  }

  _setViewer(viewer: ViewerUserData) {
    this._viewerData = viewer;
    [...this._viewerListeners.values()].forEach((f) => f(viewer));
  }

  _getViewer(): ViewerUserData | null {
    return this._viewerData;
  }

  _onUsersUpdated(
    users: Record<string, UserFragment>,
    fetchedUsers: Set<string>,
  ) {
    const updatedIds = new Set<string>();
    for (const id of fetchedUsers.keys()) {
      const user = users[id] as UserFragment | undefined;
      const userData = user ? userToUserData(user) : null;
      if (!isEqual(userData, this._users.get(id))) {
        this._users.set(id, userData);
        updatedIds.add(id);
      }
    }
    for (const listenerRecord of this._userListeners.values()) {
      if (listenerRecord.type === 'single') {
        if (updatedIds.has(listenerRecord.id)) {
          this._callListener(listenerRecord);
        }
      } else {
        if (listenerRecord.ids.some((id) => updatedIds.has(id))) {
          this._callListener(listenerRecord);
        }
      }
    }
  }

  _setRequestUsersFunction(requestUsers: RequestUsersFunction | null) {
    if (requestUsers) {
      this._requestUsers = requestUsers;
      if (this._usersPendingRequest.size > 0) {
        // pending user requests found, requesting
        requestUsers(...this._usersPendingRequest);
        this._usersPendingRequest.clear();
      }
    } else {
      this._requestUsers = this._enqueueUserForRequest;
    }
  }

  _enqueueUserForRequest(...ids: string[]) {
    for (const id of ids) {
      this._usersPendingRequest.add(id);
    }
  }
}

function OrgMemberReporter({
  state: { callback, options },
}: {
  state: GroupMemberListenerState;
}) {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const viewerExternalOrgID = organization?.externalID;

  const groupID = options?.groupID;

  const externalGroupID = checkGroupIDExists(
    'observeGroupMembers',
    viewerExternalOrgID,
    groupID,
  );

  const {
    groupMembers,
    loading,
    hasMore,
    fetchMore: realFetchMore,
  } = useGetGroupMembers({
    externalGroupID,
    initialPageSize: DEFAULT_GROUP_MEMBERS_INITIAL_PAGE_SIZE,
  });

  // Non-React callers might expect to hold on to a function like fetchMore, so
  // make sure they can do that, and we'll call the "most recent" one for them
  // internally.
  const fetchMore = useReffedFn(realFetchMore);

  useEffect(() => {
    callback({
      groupMembers: groupMembers ?? [],
      fetchMore,
      loading,
      hasMore,
    });
  }, [callback, fetchMore, groupMembers, hasMore, loading]);

  return null;
}

export function UserExporter({ users: userSDK }: { users: UserSDK }) {
  const {
    byExternalID: { users, fetchedUsers, requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  const {
    user: viewer,
    isSlackConnected,
    organizations,
  } = useContextThrowingIfNoProvider(IdentityContext);
  const { organization: viewerOrg } =
    useContextThrowingIfNoProvider(OrganizationContext);

  const [notificationPreferences] = usePreference<NotificationChannels>(
    NOTIFICATION_CHANNELS,
  );

  useEffect(() => {
    const preferences = {
      ...defaultNotificationPreference,
      ...notificationPreferences,
    };
    userSDK._setViewer({
      ...userToUserData(viewer),
      organizationID: viewerOrg?.externalID ?? null,
      notificationPreferences: {
        sendViaEmail: preferences.email,
        sendViaSlack: preferences.slack,
      },
      isSlackConnected,
      organizationIsSlackConnected: Boolean(viewerOrg?.linkedOrganization),
      groupID: viewerOrg?.externalID ?? null,
      groupIsSlackConnected: Boolean(viewerOrg?.linkedOrganization),
      groups: organizations.map((org) => org.externalID),
    });
  }, [
    userSDK,
    viewer,
    viewerOrg?.externalID,
    notificationPreferences,
    viewerOrg?.linkedOrganization,
    isSlackConnected,
    organizations,
  ]);

  useEffect(() => {
    userSDK._setRequestUsersFunction(requestUsers);

    return () => {
      userSDK._setRequestUsersFunction(null);
    };
  }, [userSDK, requestUsers]);

  useEffect(() => {
    userSDK._onUsersUpdated(users, fetchedUsers);
  }, [users, fetchedUsers, userSDK]);

  useEffect(() => {
    // on unmount clear the current users
    return () => {
      userSDK._onUsersUpdated({}, new Set());
    };
  }, [userSDK]);

  return null;
}
