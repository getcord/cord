import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { UserHiddenAnnotationsEntity } from 'server/src/entity/user_hidden_annotations/UserHiddenAnnotationsEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const resetUserHiddenAnnotationsResolver: Resolvers['Mutation']['resetUserHiddenAnnotations'] =
  async (_, _args, context) => {
    const { userID, orgID } = assertViewerHasIdentity(context.session.viewer);

    try {
      await UserHiddenAnnotationsEntity.destroy({
        where: { userID, orgID },
      });

      return { success: true, failureDetails: null };
    } catch {
      return { success: false, failureDetails: null };
    }
  };
