import { ProviderEntity } from 'server/src/entity/provider/ProviderEntity.ts';
import { PublishedProviderMutator } from 'server/src/entity/published_provider/PublishedProviderMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const setProviderPublishedMutationResolver: Resolvers['Mutation']['setProviderPublished'] =
  async (_, args, context) => {
    const { id, published } = args;

    const provider = await ProviderEntity.findByPk(id);
    if (!provider) {
      return { success: false, failureDetails: null };
    }

    const mutator = new PublishedProviderMutator(context.session);
    if (published) {
      await mutator.publish(id);
    } else {
      await mutator.unpublish(id);
    }

    return { success: true, failureDetails: null };
  };
