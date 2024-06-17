import { ProviderMutator } from 'server/src/entity/provider/ProviderMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const createProviderMutationResolver: Resolvers['Mutation']['createProvider'] =
  async (_, args, context) => {
    const mutator = new ProviderMutator(context.session.viewer);
    const provider = await mutator.createProvider(args);

    return {
      id: provider.id,
    };
  };
