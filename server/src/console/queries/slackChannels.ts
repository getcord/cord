import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';

export const slackChannelsQueryResolver: Resolvers['Query']['slackChannelsForConsole'] =
  async (_, { applicationID }, context) => {
    try {
      const hasAccessToApplication = await userHasAccessToApplication(
        context.session.viewer,
        applicationID,
        context.loaders.consoleUserLoader,
      );
      if (!hasAccessToApplication) {
        throw new Error(
          'User without access to application tried to load slack channels',
        );
      }
      const application =
        await context.loaders.applicationLoader.load(applicationID);
      if (!application?.supportOrgID) {
        // User has not yet selected a slack org, so cannot return any slack channels
        return [];
      }

      const org = await context.loaders.orgLoader.loadOrg(
        application.supportOrgID,
      );

      if (!org) {
        throw new Error(`No support org found for application`);
      }

      const slackChannels = [
        ...(await context.loaders.slackChannelLoader.loadJoinedSlackChannels([
          org.id,
        ])),
        ...(await context.loaders.slackChannelLoader.loadJoinableSlackChannels([
          org.id,
        ])),
      ];
      return slackChannels;
    } catch (error: any) {
      context.logger.logException(
        'Error occurred while querying slack channels for console user.',
        error,
        {
          userEmail: context.session.viewer.developerUserID,
          applicationID,
        },
      );
      return [];
    }
  };
