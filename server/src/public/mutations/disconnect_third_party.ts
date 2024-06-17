import { removeExternalConnection } from 'server/src/third_party_tasks/util.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
export const disconnectThirdPartyMutationResolver: Resolvers['Mutation']['disconnectThirdParty'] =
  async (_, args, context) => {
    const { connectionType } = args;

    const success = await removeExternalConnection(
      context.session.viewer,
      connectionType,
    );

    return {
      success,
      failureDetails: null,
    };
  };
