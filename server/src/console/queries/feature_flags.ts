import type { SimpleValue } from 'common/types/index.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const featureFlagsQueryResolver: Resolvers['Query']['featureFlags'] =
  async (_, args, context) => {
    let userID = 'anonymous';
    const userEmail = context.session.viewer.developerUserID;

    if (userEmail) {
      const consoleUser =
        await context.loaders.consoleUserLoader.loadUser(userEmail);
      if (consoleUser) {
        userID = consoleUser.id;
      }
    }

    const user = {
      userID,
      platformApplicationID: 'console',
      version: context.clientVersion,
    };

    const flagValues = await Promise.all(
      args.keys.map((key) =>
        getFeatureFlagValue(key, user).then((value) => ({ key, value })),
      ),
    );
    return flagValues.filter(
      (fv): fv is { key: string; value: SimpleValue } => fv.value !== null,
    );
  };
