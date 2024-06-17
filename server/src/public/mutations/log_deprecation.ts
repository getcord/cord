import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const logDeprecationMutationResolver: Resolvers['Mutation']['logDeprecation'] =
  async (_, args, context) => {
    const key = args.key;
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );
    deprecated(`from-client:${key}`, platformApplicationID);
    return true;
  };
