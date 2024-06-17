import { ProviderRuleMutator } from 'server/src/entity/provider_rule/ProviderRuleMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const deleteProviderRuleMutationResolver: Resolvers['Mutation']['deleteProviderRule'] =
  async (_, args, context) => {
    const { id } = args;

    const mutator = new ProviderRuleMutator(context.session.viewer);

    return {
      success: await mutator.delete(id),
      failureDetails: null,
    };
  };
