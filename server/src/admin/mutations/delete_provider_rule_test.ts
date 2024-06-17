import { ProviderRuleTestMutator } from 'server/src/entity/provider_rule_test/ProviderRuleTestMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const deleteProviderRuleTestMutationResolver: Resolvers['Mutation']['deleteProviderRuleTest'] =
  async (_, args, context) => {
    const { id } = args;

    const mutator = new ProviderRuleTestMutator(context.session.viewer);

    return {
      success: await mutator.delete(id),
      failureDetails: null,
    };
  };
