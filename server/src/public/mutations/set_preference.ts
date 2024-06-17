import { UserPreferenceMutator } from 'server/src/entity/user_preference/UserPreferenceMutator.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

const MAX_VALUE_SIZE_BYTES = 1024;

export const setPreferenceMutationResolver: Resolvers['Mutation']['setPreference'] =
  async (_, args, context) => {
    const { key, value } = args;
    if (JSON.stringify(value).length >= MAX_VALUE_SIZE_BYTES) {
      throw new ApiCallerError('invalid_request', {
        message: 'Value too large',
      });
    }

    const mutator = new UserPreferenceMutator(context.session.viewer);
    await mutator.setViewerPreference(key, value);

    return null;
  };
