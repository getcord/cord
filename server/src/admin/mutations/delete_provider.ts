import { ProviderMutator } from 'server/src/entity/provider/ProviderMutator.ts';
import { PublishedProviderMutator } from 'server/src/entity/published_provider/PublishedProviderMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const deleteProviderMutationResolver: Resolvers['Mutation']['deleteProvider'] =
  async (_, args, context) => {
    const { id } = args;

    const providerMutator = new ProviderMutator(context.session.viewer);
    const publishedProviderMutator = new PublishedProviderMutator(
      context.session,
    );

    await publishedProviderMutator.unpublish(id);
    await providerMutator.delete(id);

    return {
      success: true,
      failureDetails: null,
    };
  };
