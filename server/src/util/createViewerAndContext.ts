import { contextWithSession } from 'server/src/RequestContext.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

//createViewerAndContext was made with the notifications REST API and webhook in mind
export async function createViewerAndContext(
  platformApplicationID: string,
  user: UserEntity,
  platformType: 'api' | 'webhook',
) {
  // Pick an arbitrary org -- we need one to construct a viewer, but the notifs
  // code doesn't really care at all what the ID actually is
  const arbitraryOrgMembership = await OrgMembersEntity.findOne({
    where: { userID: user.id },
  });

  if (!arbitraryOrgMembership) {
    switch (platformType) {
      case 'api':
        throw new ApiCallerError('user_not_in_organization', {
          message: 'Could not find any active org for user',
        });
      case 'webhook':
        throw new Error('Could not find any active org for recipient user');
      default: {
        // Force a TypeScript error if platformType is not 'api' or 'webhook'
        const _: never = platformType;
        throw new Error('Invalid platform type: ' + platformType);
      }
    }
  }

  // Foreign key restrictions should mean this always exists if the above
  // membership exists.
  const arbitraryOrg = (await OrgEntity.findByPk(
    arbitraryOrgMembership.orgID,
  ))!;

  const viewer = await Viewer.createLoggedInPlatformViewer({
    user,
    org: arbitraryOrg,
  });

  const context = await contextWithSession(
    { viewer },
    getSequelize(),
    null,
    null,
  );

  return context;
}
