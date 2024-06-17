import { UniqueConstraintError } from 'sequelize';
import type {
  FailureDetails,
  Resolvers,
} from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import { ApplicationLoader } from 'server/src/entity/application/ApplicationLoader.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { SlackMirroredSupportThreadEntity } from 'server/src/entity/slack_mirrored_support_thread/SlackMirroredSupportThreadEntity.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { LogLevel } from 'common/types/index.ts';
import { Errors } from 'common/const/Errors.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';

export const updateSupportBotResolver: Resolvers['Mutation']['updateSupportBot'] =
  async (_, args, context) => {
    const {
      applicationID,
      supportSlackChannelID: newSupportSlackChannelID,
      name,
      profilePictureURL,
    } = args;

    const { viewer } = context.session;

    const userEmail = viewer.developerUserID!;
    const hasAccessToApplication = await userHasAccessToApplication(
      viewer,
      applicationID,
      context.loaders.consoleUserLoader,
    );

    try {
      if (!hasAccessToApplication) {
        throw new Error(
          'User without access to application tried to create a support bot.',
        );
      }

      const applicationLoader = new ApplicationLoader(viewer);

      const application = await applicationLoader.load(applicationID);

      if (!application) {
        throw new Error('No application found');
      }

      if (
        application.supportSlackChannelID &&
        application.supportSlackChannelID !== newSupportSlackChannelID
      ) {
        context.logger.debug('Updating Slack support channel', {
          args,
        });

        // Threads/messages which had been support threads will not be deleted, but
        // they will no longer be mirrored or treated as support threads
        await SlackMirroredSupportThreadEntity.destroy({
          where: {
            slackOrgID: application.supportOrgID,
            slackChannelID: application.supportSlackChannelID,
          },
        });
      }

      // This would happen if the bot is being created for the first time,
      // or there is an old bot that was created but removed from all its orgs
      // because the vendor disconnected the slack support org
      const newOrReconnectedBot = !application.supportSlackChannelID;

      await getSequelize().transaction(async (transaction) => {
        const bot = await new UserMutator(
          viewer,
          context.loaders,
        ).findOrCreateAndUpdateApplicationSupportBot(
          application,
          name,
          profilePictureURL,
          transaction,
        );

        if (!application.supportBotID) {
          logServerEvent({
            session: context.session,
            type: 'support-bot-profile-created',
            logLevel: LogLevel.DEBUG,
            payload: {
              applicationID,
              applicationName: application.name,
              userEmail,
            },
          });
        }

        if (newOrReconnectedBot) {
          // Add bot as org member for all orgs in application
          // No need to do this if the console user is just updating
          // bot name/picture
          const orgsPartOfApplication = await OrgEntity.findAll({
            where: {
              externalProvider: AuthProviderType.PLATFORM,
              platformApplicationID: applicationID,
            },
            transaction,
          });
          await OrgMembersEntity.bulkCreate(
            orgsPartOfApplication.map(({ id }) => ({
              userID: bot.id,
              orgID: id,
            })),
            { ignoreDuplicates: true, transaction },
          );
        }
        // This could error if the console user has chosen an org/channel ID combination
        // that is already being used (there is a db constraint). We throw a
        // specific error to tell the client that there the channel ID is already
        // being used. In the future we could make this better for the user by
        // adding applicationID to the slack_mirrored_support_threads
        // table and then dropping the constraint
        await application.update(
          {
            supportBotID: bot.id,
            supportSlackChannelID: newSupportSlackChannelID,
          },
          { transaction },
        );
      });

      return { success: true, failureDetails: null };
    } catch (e) {
      let failureDetails: FailureDetails | null = null;
      // Looking for a unique constraint error so we can send a message
      // back to the user
      if (e instanceof UniqueConstraintError) {
        failureDetails = {
          code: '400', // Not passing to client side
          message: Errors.APPLICATION_SUPPORT_ORG_AND_CHANNEL_ID_DUPLICATE,
        };
      }

      context.logger.logException(
        'Error occurred while user tried to update support settings',
        e,
        {
          applicationID,
          supportSlackChannelID: newSupportSlackChannelID,
          userEmail,
        },
      );

      return {
        success: false,
        failureDetails,
      };
    }
  };
