import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export const setSubscribedByExternalIDMutationResolver: Resolvers['Mutation']['setSubscribedByExternalID'] =
  sendErrors(async (_, args, originalContext) => {
    const { externalID, subscribed } = args;

    const thread =
      await originalContext.loaders.threadLoader.loadByExternalID(externalID);

    if (!thread) {
      throw new ApiCallerError('thread_not_found');
    }

    const context = await getRelevantContext(originalContext, thread.orgID);

    const originalSubscribers = new Set(
      await context.loaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
        thread.id,
      ),
    );

    const threadParticipantMutator = new ThreadParticipantMutator(
      context.session.viewer,
      context.loaders,
    );

    const result = await threadParticipantMutator.setViewerSubscribed(
      thread,
      subscribed,
    );

    const newSubscribers = new Set(
      await context.loaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
        thread.id,
      ),
    );

    const removed = [...originalSubscribers].filter(
      (s) => !newSubscribers.has(s),
    );
    const added = [...newSubscribers].filter(
      (s) => !originalSubscribers.has(s),
    );
    if (removed.length > 0 || added.length > 0) {
      backgroundPromise(
        publishPubSubEvent(
          'thread-filterable-properties-updated',
          { orgID: thread.orgID },
          { threadID: thread.id, changes: { subscribers: { added, removed } } },
        ),
      );
    }

    return { success: result, failureDetails: null };
  });
