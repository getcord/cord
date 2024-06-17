import { ProviderDocumentMutatorMutator } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const updateProviderDocumentMutatorMutationResolver: Resolvers['Mutation']['updateProviderDocumentMutator'] =
  async (_, args, context) => {
    const { id, config } = args;

    const mutator = new ProviderDocumentMutatorMutator(context.session.viewer);

    return {
      success: await mutator.update(id, { config }),
      failureDetails: null,
    };
  };
