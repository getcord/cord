import { ProviderMutator } from 'server/src/entity/provider/ProviderMutator.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const updateProviderMutationResolver: Resolvers['Mutation']['updateProvider'] =
  async (_, args, context) => {
    const { id, ...fields } = {
      ...args,
      name: args.name ?? undefined,
      iconURL: args.iconURL ?? undefined,
      domains: args.domains ?? undefined,
      nuxText: args.nuxText ?? undefined,
      mergeHashWithLocation: args.mergeHashWithLocation ?? undefined,
      disableAnnotations: args.disableAnnotations ?? undefined,
      visibleInDiscoverToolsSection:
        args.visibleInDiscoverToolsSection ?? undefined,
      claimingApplication: args.claimingApplication ?? undefined,
    };

    const mutator = new ProviderMutator(context.session.viewer);
    const updated = await mutator.updateProvider(id, fields);

    return {
      success: updated,
      failureDetails: null,
    };
  };
