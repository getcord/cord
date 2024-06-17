import { ProviderRuleTestMutator } from 'server/src/entity/provider_rule_test/ProviderRuleTestMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const createProviderRuleTestMutationResolver: Resolvers['Mutation']['createProviderRuleTest'] =
  async (_, args, context) => {
    const fields = {
      ...args,
      documentHTML: args.documentHTML ?? null,
      expectedName: args.expectedName ?? null,
      expectedContextData: args.expectedContextData ?? null,
    };

    const mutator = new ProviderRuleTestMutator(context.session.viewer);
    const provider = await mutator.create(fields);

    return {
      id: provider.id,
    };
  };
