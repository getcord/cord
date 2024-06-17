import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';

export const applicationFlagQueryResolver: Resolvers['Query']['applicationFlag'] =
  async (_, args) => {
    const user = {
      userID: 'anonymous',
      platformApplicationID: args.applicationID,
      version: null,
    };

    const key = args.flagKey;

    return await getFeatureFlagValue(key, user).then((value) =>
      value !== null
        ? {
            key,
            value,
          }
        : undefined,
    );
  };
