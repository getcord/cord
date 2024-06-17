import { encodeSlackOAuthState } from 'server/src/auth/oauth.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';

export const encodedSlackTokenResolver: Resolvers['Query']['encodedSlackToken'] =
  async (_, { nonce, applicationID }, context) => {
    const hasAccessToApplication = await userHasAccessToApplication(
      context.session.viewer,
      applicationID,
      context.loaders.consoleUserLoader,
    );
    if (!hasAccessToApplication) {
      return null;
    }

    const state = {
      data: { platformApplicationID: applicationID },
      type: 'console_user' as const,
      nonce,
    };
    return encodeSlackOAuthState(state);
  };
