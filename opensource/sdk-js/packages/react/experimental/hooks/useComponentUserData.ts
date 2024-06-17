import type { ClientUserData } from '@cord-sdk/types';
import { createContext, useContext, useMemo } from 'react';
import { sameIDs, useUserData } from '../../hooks/user.js';
import { useMemoObject } from '../../hooks/useMemoObject.js';
import { isDefined } from '../../common/util.js';

const SOURCES = [
  'onlyContext',
  'onlyApi',
  'preferContext',
  'preferApi',
] as const;
type DataSourceChoice = (typeof SOURCES)[number];

function assertValidSource(s: string): asserts s is DataSourceChoice {
  if (!SOURCES.includes(s as DataSourceChoice)) {
    throw new Error(
      `Unknown returnDataFrom value given to UserDataContext: ${s}`,
    );
  }
}

export type UserDataContextType = {
  users: Record<string, ClientUserData | null>;
  returnDataFrom?: DataSourceChoice;
};

export const UserDataContext = createContext<UserDataContextType>({
  users: {},
  returnDataFrom: 'onlyApi',
});

export function useComponentUserData(
  userID: string,
): ClientUserData | null | undefined;
export function useComponentUserData(
  userIDs: string[],
): Record<string, ClientUserData | null>;

export function useComponentUserData(
  userIDorIDs: string | string[],
): Record<string, ClientUserData | null> | ClientUserData | null | undefined {
  const context = useContext(UserDataContext);
  const returnDataFrom = context.returnDataFrom ?? 'onlyContext';
  assertValidSource(returnDataFrom);

  const memoizedUserIDorIDs = useMemoObject(userIDorIDs, sameIDs);
  const inputNeedingApiQuery = useMemo(() => {
    if (returnDataFrom === 'onlyContext') {
      return Array.isArray(memoizedUserIDorIDs) ? [] : '';
    }
    if (
      returnDataFrom === 'preferContext' &&
      Array.isArray(memoizedUserIDorIDs)
    ) {
      return memoizedUserIDorIDs.filter(
        (id) => context.users[id] === undefined,
      );
    }
    return memoizedUserIDorIDs;
  }, [context, memoizedUserIDorIDs, returnDataFrom]);

  // This very tortured call is to make the typechecker happy.  userIDorIDs
  // isn't a valid input for either overload of useUserData, but either of its
  // narrower types is.  The rules of hooks are also followed, because we're
  // calling the same hook on both branches.
  const fromApi = Array.isArray(inputNeedingApiQuery)
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useUserData(inputNeedingApiQuery, {
        skip: returnDataFrom === 'onlyContext',
      })
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useUserData(inputNeedingApiQuery, {
        skip: returnDataFrom === 'onlyContext',
      });

  return useMemoObject(
    mergeResults(memoizedUserIDorIDs, context.users, fromApi, returnDataFrom),
  );
}

function mergeResults(
  userIDorIDs: string | string[],
  users: Record<string, ClientUserData | null>,
  fromApi:
    | Record<string, ClientUserData | null>
    | ClientUserData
    | null
    | undefined,
  returnDataFrom: DataSourceChoice,
): Record<string, ClientUserData | null> | ClientUserData | null | undefined {
  if (returnDataFrom === 'onlyApi') {
    return fromApi;
  }
  // The code below needs to be careful to consider the difference between
  // returning null (which means the user doesn't exist) and undefined/not in
  // the returned object (which means the data is loading).  In general, a user
  // should not go from null to defined, so if the API is still loading and
  // might be considered, we shouldn't return null.
  if (Array.isArray(userIDorIDs)) {
    const fromApiMap = fromApi as Record<string, ClientUserData | null>; // In this branch, fromApi must be an object
    const result: Record<string, ClientUserData | null> = {};
    for (const userID of userIDorIDs) {
      const merged = mergeResult(
        users[userID],
        fromApiMap[userID],
        returnDataFrom,
      );
      if (merged !== undefined) {
        result[userID] = merged;
      }
    }
    return result;
  } else {
    return mergeResult(
      users[userIDorIDs],
      fromApi as ClientUserData | null | undefined, // In this branch, fromApi must be a non-object
      returnDataFrom,
    );
  }
}

function mergeResult(
  fromContext: ClientUserData | null | undefined,
  fromApi: ClientUserData | null | undefined,
  returnDataFrom: Exclude<DataSourceChoice, 'onlyApi'>,
) {
  if (returnDataFrom === 'onlyContext') {
    return fromContext ?? null;
  } else if (returnDataFrom === 'preferApi') {
    if (fromApi !== undefined) {
      return fromApi;
    } else if (isDefined(fromContext)) {
      return fromContext;
    } else {
      return undefined;
    }
  } else if (returnDataFrom === 'preferContext') {
    return fromContext !== undefined ? fromContext : fromApi;
  } else {
    const _: never = returnDataFrom;
    throw new Error('It should be impossible to reach here');
  }
}
