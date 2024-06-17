import { useState, useRef, useEffect } from 'react';
import type { ClientUserData } from '@cord-sdk/types';
import {
  OrgMemberAddedTypeName,
  OrgMemberRemovedTypeName,
} from 'common/types/index.ts';
import {
  useOrgMembersByExtIDPaginatedQuery,
  useOrgMembersUpdatedSubscription,
} from 'external/src/graphql/operations.ts';
import { batchReactUpdates } from 'external/src/lib/util.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

export function useGetGroupMembers({
  externalGroupID,
  initialPageSize,
}: {
  externalGroupID: string;
  initialPageSize: number;
}) {
  const [groupMembers, setGroupMembers] = useState<
    ClientUserData[] | undefined
  >(undefined);

  const [hasMore, setHasMore] = useState(true);
  const [paginationToken, setPaginationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    error,
    loading: gqlLoading,
    refetch,
  } = useOrgMembersByExtIDPaginatedQuery({
    skip: !externalGroupID,
    variables: {
      externalOrgID: externalGroupID,
      after: null,
      limit: initialPageSize,
    },
    onCompleted: (data) => {
      if (!gqlLoading && !error && data) {
        batchReactUpdates(() => {
          const {
            users: newOrgMembers,
            hasMore: newHasMore,
            token: newToken,
          } = data.orgMembersByExternalIDPaginated;

          setHasMore(newHasMore);
          setPaginationToken(newToken);
          setLoading(gqlLoading);

          const newData = newOrgMembers.map((u) => userToUserData(u));
          const oldList = groupMembers ?? [];

          setGroupMembers([...oldList, ...newData]);
        });
      }
    },
    notifyOnNetworkStatusChange: true, // Needed to make onCompleted be called again when refetch is called.
  });

  const fetchMore = async (howMany: number) => {
    setLoading(true);
    await refetch({
      externalOrgID: externalGroupID,
      limit: howMany,
      after: paginationToken,
    });
  };

  const { data: subscriptionData } = useOrgMembersUpdatedSubscription({
    skip: !externalGroupID,
    variables: {
      externalOrgID: externalGroupID,
    },
  });

  const lastProcessedEventRef = useRef<typeof subscriptionData>();

  useEffect(() => {
    if (subscriptionData) {
      // Ensure we don't process the same event twice because some other
      // dependency changed
      if (lastProcessedEventRef.current === subscriptionData) {
        return;
      }
      lastProcessedEventRef.current = subscriptionData;
      switch (subscriptionData.orgMembersByExternalIDUpdated.__typename) {
        case OrgMemberAddedTypeName: {
          if (!subscriptionData.orgMembersByExternalIDUpdated.user) {
            return;
          }
          const addedUser = userToUserData(
            subscriptionData.orgMembersByExternalIDUpdated.user,
          );
          const oldOrgMembersList = groupMembers ?? [];

          setGroupMembers([...oldOrgMembersList, addedUser]);
          break;
        }
        case OrgMemberRemovedTypeName: {
          const removedUserExtID =
            subscriptionData.orgMembersByExternalIDUpdated.externalUserID;
          const oldOrgMembersList = groupMembers ?? [];
          const newOrgMembersList = oldOrgMembersList.filter(
            (u) => u.id !== removedUserExtID,
          );

          setGroupMembers(newOrgMembersList);
          break;
        }
        default:
          console.warn(
            'Unhandled org member event',
            subscriptionData.orgMembersByExternalIDUpdated,
          );
      }
    }
  }, [groupMembers, subscriptionData]);

  return {
    groupMembers: groupMembers ?? [],
    loading,
    hasMore,
    fetchMore,
  };
}
