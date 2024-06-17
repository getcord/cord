import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { isValidMetadata } from 'common/types/index.ts';

export const setThreadMetadataResolver: Resolvers['Mutation']['setThreadMetadata'] =
  async (_, { threadID, metadata }, context) => {
    try {
      const thread = await context.loaders.threadLoader.loadThread(threadID);

      if (!thread) {
        return { success: false, failureDetails: null };
      }

      if (!isValidMetadata(metadata)) {
        return {
          success: false,
          failureDetails: {
            code: 'INVALID_METADATA',
            message: 'Metadata must be a flat JSON object',
          },
        };
      }

      if (isEqual(thread.metadata, metadata)) {
        return { success: true, failureDetails: null };
      }

      const threadMutator = new ThreadMutator(
        context.session.viewer,
        context.loaders,
      );
      const success = await threadMutator.setThreadMetadata(threadID, metadata);

      if (success) {
        await publishPubSubEvent('thread-properties-updated', { threadID });
      }

      return { success, failureDetails: null };
    } catch (e: any) {
      return {
        success: false,
        failureDetails: {
          code: e?.code ?? '',
          message: e?.message,
        },
      };
    }
  };
