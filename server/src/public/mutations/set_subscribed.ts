import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export const setSubscribedMutationResolver: Resolvers['Mutation']['setSubscribed'] =
  async (_, args, originalContext) => {
    const { threadID, subscribed } = args;

    const thread =
      await originalContext.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      throw new Error('Thread does not exist');
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

    await threadParticipantMutator.setViewerSubscribed(thread, subscribed);

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
          { threadID, changes: { subscribers: { added, removed } } },
        ),
      );
    }

    return true;
  };
