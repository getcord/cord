import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { ApplicationMutator } from 'server/src/entity/application/ApplicationMutator.ts';

export const createApplicationCustomS3BucketResolver: Resolvers['Mutation']['createApplicationCustomS3Bucket'] =
  async (_, args, context) => {
    const fields = {
      bucket: args.bucket,
      region: args.region,
      accessKeyID: args.accessKeyID,
      accessKeySecret: args.accessKeySecret,
    };

    const mutator = new ApplicationMutator(context.session.viewer);
    const success = await mutator.setS3BucketConfig(args.applicationID, fields);

    return {
      success,
      failureDetails: null,
    };
  };
