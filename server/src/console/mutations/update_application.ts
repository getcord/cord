import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import { verifyWebhookURL } from 'server/src/webhook/verifyWebhookURL.ts';

export const updateApplicationResolver: Resolvers['Mutation']['updateApplication'] =
  async (_, args, context) => {
    const {
      id,
      name,
      customLinks,
      customEmailTemplate,
      enableEmailNotifications,
      segmentWriteKey,
      iconURL,
      customNUX,
      redirectURI,
      eventWebhookURL,
      eventWebhookSubscriptions,
    } = args;

    const userEmail = context.session.viewer.developerUserID!;
    const hasAccessToApplication = await userHasAccessToApplication(
      context.session.viewer,
      id,
      context.loaders.consoleUserLoader,
    );
    if (!hasAccessToApplication) {
      context.logger.error(
        'User without access to application tried to update it.',
        {
          userEmail,
          applicationID: id,
        },
      );
      return {
        success: false,
        failureDetails: null,
      };
    }

    if (eventWebhookURL) {
      const app = await ApplicationEntity.findOne({
        where: { id },
      });
      if (!app) {
        throw new Error('Application not found');
      }
      if (eventWebhookURL !== app.eventWebhookURL) {
        try {
          await verifyWebhookURL(app, eventWebhookURL);
        } catch (error: any) {
          context.logger.warn(error);
          return {
            success: false,
            failureDetails: {
              code: error.code.toString(),
              message: error.message,
            },
          };
        }
      }
    }

    try {
      const [updated] = await ApplicationEntity.update(
        {
          name,
          customEmailTemplate,
          enableEmailNotifications,
          customLinks,
          segmentWriteKey,
          iconURL,
          customNUX,
          redirectURI,
          eventWebhookURL,
          eventWebhookSubscriptions,
        },
        { where: { id } },
      );

      return {
        success: updated === 1,
        failureDetails: null,
      };
    } catch (e) {
      context.logger.logException(
        'Error occurred while user tried to update application',
        e,
        {
          applicationID: id,
        },
      );
      return {
        success: false,
        failureDetails: null,
      };
    }
  };
