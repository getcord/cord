import type { UserFragment } from 'common/graphql/types.ts';
import type { ClientUserData } from '@cord-sdk/types';

export function userToUserData(internalUser: UserFragment): ClientUserData {
  return {
    id: internalUser.externalID,
    name: internalUser.name,
    shortName: internalUser.shortName,
    displayName: internalUser.displayName,
    secondaryDisplayName: internalUser.fullName,
    profilePictureURL: internalUser.profilePictureURL,
    metadata: internalUser.metadata,
  };
}

export function usersToUserData(
  internalUsers: UserFragment[],
): ClientUserData[] {
  return internalUsers.map((u) => userToUserData(u));
}
