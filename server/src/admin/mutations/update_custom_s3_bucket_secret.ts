import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { S3BucketMutator } from 'server/src/entity/s3_bucket/S3BucketMutator.ts';

export const updateCustomS3BucketSecretResolver: Resolvers['Mutation']['updateCustomS3BucketAccessKey'] =
  async (_, args, context) => {
    const mutator = new S3BucketMutator(context.session.viewer);
    const success = await mutator.updateAccessKeySecret(
      args.id,
      args.keyID,
      args.keySecret,
    );

    return {
      success,
      failureDetails: null,
    };
  };
