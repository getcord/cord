import type { UserLocationData, ClientUserData } from '@cord-sdk/types';
import { isDefined } from '../util.js';

export type PresenceUser = {
  user: ClientUserData;
} & PresenceState;

type PresenceState = {
  present: boolean;
  lastPresentTime: number | null;
};

/**
 * Get all users who are, or have been at presenceData's location.
 */
export function getUsersAtLocation({
  excludeViewer,
  onlyPresentUsers,
  presenceData,
  usersDataByUserID,
  viewerID,
}: {
  excludeViewer: boolean;
  onlyPresentUsers: boolean;
  presenceData: UserLocationData[];
  usersDataByUserID: Record<string, ClientUserData | null>;
  viewerID: string | undefined;
}) {
  return presenceData
    .map((presence) => ({
      user: usersDataByUserID[presence.id],
      present: presence.ephemeral.locations.length > 0,
      lastPresentTime: presence.durable?.timestamp.getTime() ?? null,
    }))
    .filter(
      ({ user, present, lastPresentTime }) =>
        isDefined(user) &&
        !(excludeViewer && user.id === viewerID) &&
        !(present === false && !lastPresentTime) &&
        !(present === false && onlyPresentUsers),
    ) as PresenceUser[];
}
