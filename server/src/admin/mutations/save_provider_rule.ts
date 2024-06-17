import { ProviderRuleMutator } from 'server/src/entity/provider_rule/ProviderRuleMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const saveProviderRuleMutationResolver: Resolvers['Mutation']['saveProviderRule'] =
  async (_, args, context) => {
    const { id, ...rest } = args;
    const fields = {
      ...rest,
      contextTransformation: {
        ...rest.contextTransformation,
        data: rest.contextTransformation.data ?? null,
      },
    };

    const mutator = new ProviderRuleMutator(context.session.viewer);

    if (id) {
      await mutator.update(id, fields);
      return { id };
    } else {
      const rule = await mutator.create(fields);
      return { id: rule.id };
    }
  };
