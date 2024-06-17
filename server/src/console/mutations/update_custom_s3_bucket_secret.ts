import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import { S3BucketMutator } from 'server/src/entity/s3_bucket/S3BucketMutator.ts';

export const updateCustomS3BucketSecretResolver: Resolvers['Mutation']['updateCustomS3BucketSecret'] =
  async (_, args, context) => {
    const userEmail = context.session.viewer.developerUserID!;
    const hasAccessToApplication = await userHasAccessToApplication(
      context.session.viewer,
      args.applicationID,
      context.loaders.consoleUserLoader,
    );
    if (!hasAccessToApplication) {
      context.logger.warn(
        'User without access to application tried to update it.',
        {
          userEmail,
          applicationID: args.applicationID,
        },
      );
      return {
        success: false,
        failureDetails: null,
      };
    }
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
