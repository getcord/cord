import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import { ApplicationMutator } from 'server/src/entity/application/ApplicationMutator.ts';

export const createApplicationCustomS3BucketResolver: Resolvers['Mutation']['createApplicationCustomS3Bucket'] =
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
