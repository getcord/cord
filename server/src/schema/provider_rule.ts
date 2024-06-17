import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
export const providerRuleResolver: Resolvers['ProviderRule'] = {
  provider: async (rule, _args, context) => {
    const provider = await context.loaders.providerLoader.load(rule.providerID);
    if (!provider) {
      throw new Error(`Failed to load provider with id: ${rule.providerID}`);
    }
    return provider;
  },
};
