import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { SlackMirroredSupportThreadEntity } from 'server/src/entity/slack_mirrored_support_thread/SlackMirroredSupportThreadEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

export const removeSlackSupportOrgResolver: Resolvers['Mutation']['removeSlackSupportOrg'] =
  async (_, args, context) => {
    const { applicationID } = args;
    const userEmail = context.session.viewer.developerUserID!;
    const hasAccessToApplication = await userHasAccessToApplication(
      context.session.viewer,
      applicationID,
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

    try {
      await getSequelize().transaction(async (transaction) => {
        const app = await ApplicationEntity.findByPk(applicationID, {
          transaction,
        });

        if (!app) {
          throw new Error(
            'Application not found when trying to remove support',
          );
        }

        if (!app.supportOrgID) {
          throw new Error('No connected support org to remove');
        }

        await ApplicationEntity.update(
          { supportOrgID: null, supportSlackChannelID: null },
          { where: { id: applicationID }, transaction },
        );

        // Threads/messages which had been support threads will not be deleted, but
        // they will no longer be mirrored or treated as support threads
        // NB there is a constraint in the db that the org/channel combo must be unique
        // across applications
        await SlackMirroredSupportThreadEntity.destroy({
          where: {
            slackOrgID: app.supportOrgID,
            slackChannelID: app.supportSlackChannelID,
          },
        });

        await OrgMembersEntity.destroy({
          where: {
            userID: app.supportBotID!,
          },
        });
      });

      return {
        success: true,
        failureDetails: null,
      };
    } catch (err) {
      context.logger.logException(
        'Error when trying to remove slack support org',
        err,
        { applicationID, userEmail },
      );
      return {
        success: false,
        failureDetails: null,
      };
    }
  };
