import { ProviderDocumentMutatorMutator } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const deleteProviderDocumentMutatorMutationResolver: Resolvers['Mutation']['deleteProviderDocumentMutator'] =
  async (_, args, context) => {
    const { id } = args;

    const mutator = new ProviderDocumentMutatorMutator(context.session.viewer);

    return {
      success: await mutator.delete(id),
      failureDetails: null,
    };
  };
