import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';

export const applicationQueryResolver: Resolvers['Query']['application'] =
  async (_, args, context) => {
    try {
      const hasAccessToApplication = await userHasAccessToApplication(
        context.session.viewer,
        args.id,
        context.loaders.consoleUserLoader,
      );
      if (hasAccessToApplication) {
        return await context.loaders.applicationLoader.load(args.id);
      }
      context.logger.error(
        'User without access to application tried to load it',
        {
          developerUserID: context.session.viewer.developerUserID,
          applicationID: args.id,
        },
      );
      return null;
    } catch (error: any) {
      context.logger.logException(
        'Error occurred while querying applications for console user.',
        error,
      );
      return null;
    }
  };
