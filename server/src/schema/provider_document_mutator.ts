import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
export const providerDocumentMutatorResolver: Resolvers['ProviderDocumentMutator'] =
  {
    provider: async (mutator, _args, context) => {
      const provider = await context.loaders.providerLoader.load(
        mutator.providerID,
      );
      if (!provider) {
        throw new Error(
          `Failed to load provider with id: ${mutator.providerID}`,
        );
      }
      return provider;
    },
  };
