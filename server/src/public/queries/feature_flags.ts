import type { SimpleValue } from 'common/types/index.ts';
import {
  flagsUserFromContext,
  getFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const featureFlagsQueryResolver: Resolvers['Query']['featureFlags'] =
  async (_, args, context) => {
    const user = flagsUserFromContext(context);

    const flagValues = await Promise.all(
      args.keys.map((key) =>
        getFeatureFlagValue(key, user).then((value) => ({ key, value })),
      ),
    );
    return flagValues.filter(
      (fv): fv is { key: string; value: SimpleValue } => fv.value !== null,
    );
  };
