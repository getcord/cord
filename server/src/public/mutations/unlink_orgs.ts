import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { LinkedOrgsMutator } from 'server/src/entity/linked_orgs/LinkedOrgsMutator.ts';
import { SlackMirroredThreadMutator } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadMutator.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishUserIdentityUpdate } from 'server/src/pubsub/index.ts';

export const unlinkOrgsMutationResolver: Resolvers['Mutation']['unlinkOrgs'] =
  async (_, __, context) => {
    const { userID, orgID } = assertViewerHasIdentity(context.session.viewer);
    const slackOrgToDisconnect =
      await context.loaders.linkedOrgsLoader.getConnectedSlackOrgID(orgID);

    if (!slackOrgToDisconnect) {
      context.logger.warn('No linked org to unlink');
      return { success: false, failureDetails: null };
    }
    // Remove any mirrored thread entities, so the threads can potentially be
    // mirrored again with another Slack org in the future
    const slackMirroredThreadMutator = new SlackMirroredThreadMutator(
      context.session.viewer,
    );
    await slackMirroredThreadMutator.unlinkAllThreads(
      orgID,
      slackOrgToDisconnect,
    );

    const linkedOrgsMutator = new LinkedOrgsMutator(
      context.session.viewer,
      context.loaders,
    );
    const orgUnlinked = await linkedOrgsMutator.unlinkOrgs();
    if (orgUnlinked >= 1) {
      backgroundPromise(
        publishUserIdentityUpdate({
          userID,
          orgID,
          platformApplicationID: context.session.viewer.platformApplicationID!,
        }),
      );
    }
    return { success: orgUnlinked >= 1, failureDetails: null };
  };
