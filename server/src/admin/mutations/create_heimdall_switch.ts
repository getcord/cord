import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { HeimdallMutator } from 'server/src/entity/heimdall/HeimdallMutator.ts';

export const createHeimdallSwitchResolver: Resolvers['Mutation']['createHeimdallSwitch'] =
  async (_, args, context) => {
    const mutator = new HeimdallMutator(
      context.session.viewer,
      context.loaders.heimdallLoader,
    );
    return await mutator.createOnOffSwitch(args.key);
  };
