import { useApolloClient } from '@apollo/client';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type { UUID } from 'common/types/index.ts';
import {
  useUserLiveQuerySubscription,
  UsersByExternalIDQuery,
  UsersQuery,
} from 'external/src/graphql/operations.ts';
import type {
  UserFragment,
  UsersByExternalIDQueryResult,
  UsersByExternalIDQueryVariables,
  UsersQueryResult,
  UsersQueryVariables,
} from 'external/src/graphql/operations.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { NetworkStatusContext } from 'external/src/context/network/NetworkStatusContext.tsx';

export type UserContextType = {
  addUsers: (...users: UserFragment[]) => void;
  byInternalID: {
    users: Record<UUID, UserFragment>;
    fetchedUsers: Set<UUID>;
    loading: boolean;
    userByID: (id: UUID) => UserFragment | undefined;
    usersByID: (...ids: UUID[]) => UserFragment[];
    requestUsers: (...ids: UUID[]) => void;
  };
  byExternalID: {
    users: Record<string, UserFragment>;
    fetchedUsers: Set<UUID>;
    loading: boolean;
    userByID: (id: string) => UserFragment | undefined;
    usersByID: (...ids: string[]) => UserFragment[];
    requestUsers: (...ids: string[]) => void;
  };
};

export const UsersContext = React.createContext<
  UserContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function UsersProvider(props: React.PropsWithChildren<any>) {
  const apolloClient = useApolloClient();
  const { addDisconnectListener } =
    useContextThrowingIfNoProvider(NetworkStatusContext);

  // NOTE(flooey): requestedUsers + fetchedUsers is to support the case where
  // someone requests a user that doesn't exist.  We track which users we've
  // gotten results for, so that an ID doesn't sit in requestedUsers forever and
  // constantly get fetched.  We could instead stick a null or something in
  // users, but I figured it was better to spend an extra state variable here
  // and not make the callers have to worry about nulls in users
  const [requestedUsersExternal, setRequestedUsersExternal] = useState<
    Set<string>
  >(new Set());
  const [internalUsersLoading, setInternalUsersLoading] =
    useState<boolean>(false);
  const [fetchedUsersExternal, setFetchedUsersExternal] = useState<Set<string>>(
    new Set(),
  );
  const [externalUsersLoading, setExternalUsersLoading] =
    useState<boolean>(false);
  const [usersExternal, setUsersExternal] = useState<
    Record<string, UserFragment>
  >({});

  const [requestedUsersInternal, setRequestedUsersInternal] = useState<
    Set<UUID>
  >(new Set());
  const [fetchedUsersInternal, setFetchedUsersInternal] = useState<Set<UUID>>(
    new Set(),
  );
  const [usersInternal, setUsersInternal] = useState<
    Record<UUID, UserFragment>
  >({});

  const addUsers = useCallback((...usersToAdd: UserFragment[]) => {
    setUsersInternal((users) => {
      if (usersToAdd.every((u) => isEqual(users[u.id], u))) {
        return users;
      }
      const result = {
        ...users,
      };
      for (const user of usersToAdd) {
        result[user.id] = user;
      }
      return result;
    });
    setFetchedUsersInternal((users) => {
      if (usersToAdd.some((u) => !users.has(u.id))) {
        return new Set([...users, ...usersToAdd.map((u) => u.id)]);
      }
      return users;
    });
    if (usersToAdd.some((u) => u.externalID)) {
      setUsersExternal((users) => {
        if (
          usersToAdd.every(
            (u) => !u.externalID || isEqual(users[u.externalID], u),
          )
        ) {
          return users;
        }
        const result = {
          ...users,
        };
        for (const user of usersToAdd) {
          if (user.externalID) {
            result[user.externalID] = user;
          }
        }
        return result;
      });
      setFetchedUsersExternal((users) => {
        if (usersToAdd.some((u) => u.externalID && !users.has(u.externalID))) {
          return new Set([
            ...users,
            ...usersToAdd
              .filter((u) => !!u.externalID)
              .map((u) => u.externalID),
          ]);
        }
        return users;
      });
    }
  }, []);

  const [since, setSince] = useState<number>();
  const uptoRef = useRef<number>();

  useUserLiveQuerySubscription({
    variables: {
      since,
    },
    onData: ({ data }) => {
      if (data.data) {
        addUsers(...data.data.userLiveQuery.users);
        uptoRef.current = data.data.userLiveQuery.upto;
      }
    },
  });

  useEffect(() => {
    return addDisconnectListener(() => {
      setSince(uptoRef.current);
    });
  }, [addDisconnectListener]);

  const requestUsersExternal = useCallback((...ids: string[]) => {
    setRequestedUsersExternal((users) => {
      if (ids.some((id) => !users.has(id))) {
        return new Set([...users, ...ids]);
      }
      return users;
    });
  }, []);

  const requestUsersInternal = useCallback((...ids: UUID[]) => {
    setRequestedUsersInternal((users) => {
      if (ids.some((id) => !users.has(id))) {
        return new Set([...users, ...ids]);
      }
      return users;
    });
  }, []);

  const usersByIDExternal = useCallback(
    (...ids: string[]) => ids.map((id) => usersExternal[id]).filter((u) => !!u),
    [usersExternal],
  );

  const userByIDExternal = useCallback(
    (id: string) => usersByIDExternal(id)[0],
    [usersByIDExternal],
  );

  const usersByIDInternal = useCallback(
    (...ids: UUID[]) => ids.map((id) => usersInternal[id]).filter((u) => !!u),
    [usersInternal],
  );

  const userByIDInternal = useCallback(
    (id: UUID) => usersByIDInternal(id)[0],
    [usersByIDInternal],
  );

  useEffect(() => {
    const toFetch = [...requestedUsersExternal].filter(
      (u) => !fetchedUsersExternal.has(u),
    );
    if (toFetch.length > 0) {
      void (async () => {
        // TODO(flooey): This can be swapped to useLazyUsersByExternalIDQuery
        // once we upgrade to Apollo client 3.5 or higher
        const { data, loading } = await apolloClient.query<
          UsersByExternalIDQueryResult,
          UsersByExternalIDQueryVariables
        >({
          query: UsersByExternalIDQuery,
          variables: {
            externalIDs: toFetch,
          },
        });
        if (data && data.usersByExternalID.length > 0) {
          addUsers(...data.usersByExternalID);
        }
        setExternalUsersLoading(loading);
      })();
    }
  }, [apolloClient, requestedUsersExternal, fetchedUsersExternal, addUsers]);

  useEffect(() => {
    const toFetch = [...requestedUsersInternal].filter(
      (u) => !fetchedUsersInternal.has(u),
    );
    if (toFetch.length > 0) {
      void (async () => {
        // TODO(flooey): This can be swapped to useLazyUsersQuery
        // once we upgrade to Apollo client 3.5 or higher
        const { data, loading } = await apolloClient.query<
          UsersQueryResult,
          UsersQueryVariables
        >({
          query: UsersQuery,
          variables: {
            ids: toFetch,
          },
        });
        if (data && data.users.length > 0) {
          addUsers(...data.users);
        }
        setInternalUsersLoading(loading);
      })();
    }
  }, [apolloClient, requestedUsersInternal, fetchedUsersInternal, addUsers]);

  const contextValue = useMemo(
    () => ({
      addUsers,
      byInternalID: {
        users: usersInternal,
        fetchedUsers: fetchedUsersInternal,
        loading: internalUsersLoading,
        userByID: userByIDInternal,
        usersByID: usersByIDInternal,
        requestUsers: requestUsersInternal,
      },
      byExternalID: {
        users: usersExternal,
        fetchedUsers: fetchedUsersExternal,
        loading: externalUsersLoading,
        userByID: userByIDExternal,
        usersByID: usersByIDExternal,
        requestUsers: requestUsersExternal,
      },
    }),
    [
      addUsers,
      internalUsersLoading,
      externalUsersLoading,
      usersInternal,
      fetchedUsersInternal,
      userByIDInternal,
      usersByIDInternal,
      requestUsersInternal,
      usersExternal,
      fetchedUsersExternal,
      userByIDExternal,
      usersByIDExternal,
      requestUsersExternal,
    ],
  );

  return (
    <UsersContext.Provider value={contextValue}>
      {props.children}
    </UsersContext.Provider>
  );
}
