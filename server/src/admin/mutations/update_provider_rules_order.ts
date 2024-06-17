import { ProviderRuleMutator } from 'server/src/entity/provider_rule/ProviderRuleMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const updateProviderRulesOrderMutationResolver: Resolvers['Mutation']['updateProviderRulesOrder'] =
  async (_, args, context) => {
    const { providerID, ruleIDs } = args;

    const mutator = new ProviderRuleMutator(context.session.viewer);
    await mutator.updateRuleOrder(providerID, ruleIDs);

    return {
      success: true,
      failureDetails: null,
    };
  };
