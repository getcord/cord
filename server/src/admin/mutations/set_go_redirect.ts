import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import {
  AdminGoRedirectEntity,
  canonicalizeRedirectName,
  isValidRedirectName,
} from 'server/src/entity/go_redirect/AdminGoRedirectEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import env from 'server/src/config/Env.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export const setGoRedirectMutationResolver: Resolvers['Mutation']['setGoRedirect'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const user = await context.loaders.userLoader.loadUser(userID);
    if (!user) {
      throw new Error('WTF');
    }
    const { name: originalName, url } = args.redirect;
    const name = canonicalizeRedirectName(originalName);

    if (!isValidRedirectName(name)) {
      return {
        success: false,
        failureDetails: {
          code: 'bad_name',
          message: `Can't name a redirect "${name}"`,
        },
      };
    }

    await getSequelize().transaction(async (transaction) => {
      const redirect = await AdminGoRedirectEntity.findOne({
        where: {
          name,
        },
        transaction,
      });
      if (!redirect) {
        await AdminGoRedirectEntity.create(
          {
            name,
            url,
            creatorUserID: userID,
            updaterUserID: userID,
          },
          { transaction },
        );
        if (env.CORD_GO_REDIRECTS_SLACK_CHANNEL_ID) {
          backgroundPromise(
            sendMessageToCord(
              `${userDisplayName(user)} created a new go redirect: \`<https://${
                env.ADMIN_SERVER_HOST
              }/go/edit/${name}|go/${name}>\` pointing to ${url}`,
              env.CORD_GO_REDIRECTS_SLACK_CHANNEL_ID,
              'go-redirects',
            ),
          );
        }
        return;
      } else {
        redirect.url = url;
        redirect.updaterUserID = userID;
        return await redirect.save({ transaction });
      }
    });
    return { success: true, failureDetails: null };
  };
