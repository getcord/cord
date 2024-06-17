import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const orgMembersByExtIDPaginatedResolver: Resolvers['Query']['orgMembersByExternalIDPaginated'] =
  async (_, { externalOrgID, after, limit }, context) => {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );

    const viewersOrgs =
      await context.loaders.orgMembersLoader.loadAllImmediateOrgIDsForUser();

    const org = await context.loaders.orgLoader.loadPlatformOrg(
      platformApplicationID,
      externalOrgID,
    );

    if (!org) {
      context.logger.error(`Org not found for ${externalOrgID}`);
      return { users: [], hasMore: false, token: undefined };
    }

    if (!viewersOrgs.includes(org.id)) {
      context.logger.error(`Viewer cannot access org`);
      return { users: [], hasMore: false, token: undefined };
    }

    return await context.loaders.userLoader.loadAllUsersInOrgPaginatedByUserID(
      org.id,
      after ?? undefined,
      limit ?? undefined,
    );
  };
