import { ProviderDocumentMutatorMutator } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const createProviderDocumentMutatorMutationResolver: Resolvers['Mutation']['createProviderDocumentMutator'] =
  async (_, args, context) => {
    const fields = args;

    const mutator = new ProviderDocumentMutatorMutator(context.session.viewer);
    const documentMutator = await mutator.create(fields);

    return {
      id: documentMutator.id,
    };
  };
