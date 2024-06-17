import type { Resolvers } from 'server/src/console/resolverTypes.ts';

export const applicationsQueryResolver: Resolvers['Query']['applications'] =
  async (_, _args, context) => {
    try {
      const userEmail = context.session.viewer.developerUserID!;
      const user = await context.loaders.consoleUserLoader.loadUser(userEmail);
      const applications = user!.customerID
        ? await context.loaders.applicationLoader.loadApplicationsForConsoleUser(
            user!.customerID,
          )
        : [];
      const applicationIDs = applications.map((a) => a.id);
      const [userCounts, orgCounts] = await Promise.all([
        context.loaders.applicationLoader.countActiveUsersForApplications(
          applicationIDs,
        ),
        context.loaders.applicationLoader.countOrgsForApplications(
          applicationIDs,
        ),
      ]);
      return applications.map((application) => ({
        application,
        userCount: userCounts.get(application.id) ?? 0,
        orgCount: orgCounts.get(application.id) ?? 0,
      }));
    } catch (error: any) {
      context.logger.logException(
        'Error occurred while querying applications for console user.',
        error,
        {
          userEmail: context.session.viewer.developerUserID,
          orgID: context.session.viewer.orgID,
          platformApplicationID: context.session.viewer.platformApplicationID,
          userID: context.session.viewer.userID,
        },
      );
      return [];
    }
  };
