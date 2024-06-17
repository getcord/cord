import { createThread } from 'server/src/public/routes/platform/threads/CreateThreadHandler.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { serializableTransactionWithRetries } from 'server/src/entity/sequelize.ts';
import { publishNewThreadEvents } from 'server/src/entity/thread/new_thread_tasks/publishNewThreadEvents.ts';

export const createThreadResolver: Resolvers['Mutation']['createThread'] =
  sendErrors(async (_, args, context) => {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );

    // This is likely to be thrown when using an orgless user token, and
    // no groupID has been specified in the thread js api createThread method.
    if (!context.session.viewer.orgID) {
      return {
        success: false,
        failureDetails: {
          code: '400',
          message: 'Must specify a groupID.',
        },
      };
    }
    // We use SERIALIZABLE here because it's needed to ensure the threads and
    // thread_ids tables remain consistent, see thread_by_external_id.ts
    await serializableTransactionWithRetries(async (transaction) => {
      const { thread } = await createThread({
        id: args.externalThreadID ?? undefined,
        url: args.input.url,
        location: args.input.location,
        name: args.input.name,
        metadata: args.input.metadata ?? undefined,
        extraClassnames: args.input.extraClassnames,
        transaction,
        viewer: context.session.viewer,
        platformApplicationID,
        addSubscribers: args.input.addSubscribers ?? undefined,
      });

      await publishNewThreadEvents(args.input.location, thread, transaction);
    });
    return { success: true, failureDetails: null };
  });
