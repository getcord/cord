import type { UUID } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import {
  FeatureFlags,
  getFeatureFlagValue,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';

export async function getUsersToNotify(args: {
  context: RequestContext;
  flagsUser: FlagsUser;
  threadID: UUID;
  referencedUsers: UUID[];
  pageContextHash: UUID;
}): Promise<UUID[]> {
  const viewerUserID = assertViewerHasUser(args.context.session.viewer);
  // There is also a feature flag which, if on, will subscribe the whole org to
  // all threads.  This is invoked before this function runs, so that these users
  // are picked up by step 2 below.
  const [notifyVisitors, skipVisitorsIfSelfMentioned] = await Promise.all([
    getTypedFeatureFlagValue(
      FeatureFlags.NOTIFY_PAGE_VISITORS_OF_EVERY_MESSAGE,
      args.flagsUser,
    ),
    getFeatureFlagValue(
      'skip_notify_page_visitors_if_self_mentioned',
      args.flagsUser,
    ),
  ]);

  // 1. referenced users are always notified
  const usersToNotify = new Set<UUID>(args.referencedUsers);
  const selfMentioned = usersToNotify.has(viewerUserID);

  // 2. thread participants are notified if subscribed
  const threadParticipants = new Map<UUID, boolean>(
    (
      await args.context.loaders.threadParticipantLoader.loadForThreadIDNoOrgCheck(
        args.threadID,
      )
    ).map((tp) => [tp.userID, tp.subscribed]),
  );
  for (const [userID, subscribed] of threadParticipants) {
    if (subscribed && userID !== viewerUserID) {
      usersToNotify.add(userID);
    }
  }

  // 3. page visitors are notified if not unsubscribed
  const pageVisitors =
    await args.context.loaders.pageVisitorLoader.loadForContextHash(
      args.pageContextHash,
    );
  if (
    notifyVisitors === true &&
    !(selfMentioned && skipVisitorsIfSelfMentioned === true)
  ) {
    for (const { userID } of pageVisitors) {
      if (threadParticipants.get(userID) !== false && userID !== viewerUserID) {
        usersToNotify.add(userID);
      }
    }
  }
  return [...usersToNotify];
}
