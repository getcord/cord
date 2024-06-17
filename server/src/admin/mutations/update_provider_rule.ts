import { ProviderRuleMutator } from 'server/src/entity/provider_rule/ProviderRuleMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const updateProviderRuleMutationResolver: Resolvers['Mutation']['updateProviderRule'] =
  async (_, args, context) => {
    const { id, ...fields } = args;

    const mutator = new ProviderRuleMutator(context.session.viewer);
    const updated = await mutator.update(id, fields);

    return {
      success: updated,
      failureDetails: null,
    };
  };
