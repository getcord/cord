import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { OrgMutator } from 'server/src/entity/org/OrgMutator.ts';

export const toggleInternalFlagOnOrgMutationResolver: Resolvers['Mutation']['toggleInternalFlagOnOrg'] =
  async (_, { orgID }, context) => {
    await new OrgMutator(context.session.viewer).toggleInternalFlag(orgID);

    return { success: true, failureDetails: null };
  };
