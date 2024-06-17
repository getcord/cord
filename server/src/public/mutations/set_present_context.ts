import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { setUserPresentContext } from 'server/src/presence/utils.ts';
import { assertViewerHasSingleOrgForWrite } from 'server/src/auth/index.ts';

export const setPresentContextMutationResolver: Resolvers['Mutation']['setPresentContext'] =
  async (_, args, context) => {
    const { present, durable, context: userContext, exclusivityRegion } = args;

    // Check error here to make sure we throw a useful error message.
    assertViewerHasSingleOrgForWrite(
      context.session.viewer,
      'Must specify a group ID when setting presence to control who can see it',
    );

    await setUserPresentContext({
      userContext,
      present,
      durable,
      context,
      exclusivityRegion,
    });
    return true;
  };
