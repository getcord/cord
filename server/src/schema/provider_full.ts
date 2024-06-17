import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const providerFullResolver: Resolvers['ProviderFull'] = {
  rules: async (provider, _args, context) => {
    return await context.loaders.providerRuleLoader.loadForProvider(
      provider.id,
    );
  },

  documentMutators: async (provider, _args, context) => {
    return await context.loaders.providerDocumentMutatorLoader.loadForProvider(
      provider.id,
    );
  },

  tests: async (provider, _args, context) => {
    return await context.loaders.providerRuleTestLoader.loadForProvider(
      provider.id,
    );
  },

  public: async (provider, _args, context) => {
    return await context.loaders.publishedProviderLoader.isProviderPublished(
      provider.id,
    );
  },

  claimingApplication: async (provider, _args, context) => {
    if (provider.claimingApplication) {
      return await context.loaders.applicationLoader.load(
        provider.claimingApplication,
      );
    } else {
      return null;
    }
  },
};
