import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { verifyWebhookURL } from 'server/src/webhook/verifyWebhookURL.ts';

export const updateApplicationResolver: Resolvers['Mutation']['updateApplication'] =
  async (_, args, _context) => {
    const {
      id,
      name,
      customLinks,
      customEmailTemplate,
      enableEmailNotifications,
      segmentWriteKey,
      iconURL,
      customNUX,
      environment,
      defaultProvider,
      redirectURI,
      eventWebhookURL,
      eventWebhookSubscriptions,
    } = args;

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
          environment,
          defaultProvider: defaultProvider ?? null,
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
      return {
        success: false,
        failureDetails: null,
      };
    }
  };
