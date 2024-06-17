import { ADMIN_APP_ID } from 'server/src/admin/queries/cord_session_token.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

export const adminPlatformUsersQueryResolver: Resolvers['Query']['adminPlatformUsers'] =
  async (_, __, context) => {
    const orgID = assertViewerHasOrg(context.session.viewer);
    const platformOrg = await context.loaders.orgLoader.loadPlatformOrg(
      ADMIN_APP_ID,
      orgID,
    );
    if (!platformOrg) {
      throw new Error("Couldn't find platform org");
    }
    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: platformOrg.id,
      },
    });
    return await context.loaders.userLoader.loadUsersInOrg(
      orgMembers.map((om) => om.userID),
      platformOrg.id,
    );
  };
