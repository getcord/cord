import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { ApplicationMutator } from 'server/src/entity/application/ApplicationMutator.ts';

export const deleteApplicationCustomS3BucketResolver: Resolvers['Mutation']['deleteApplicationCustomS3Bucket'] =
  async (_, args, context) => {
    const mutator = new ApplicationMutator(context.session.viewer);
    const success = await mutator.setS3BucketConfig(
      args.applicationID,
      undefined,
    );

    return {
      success,
      failureDetails: null,
    };
  };
