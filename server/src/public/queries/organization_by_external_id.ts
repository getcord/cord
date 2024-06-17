import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const organizationByExternalIDQueryResolver: Resolvers['Query']['organizationByExternalID'] =
  async (_, args, context) => {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );
    const platformOrg = await context.loaders.orgLoader.loadPlatformOrg(
      platformApplicationID,
      args.id,
    );
    if (!platformOrg) {
      throw new Error("Couldn't find platform org");
    }

    if (
      !(await context.loaders.orgMembersLoader.viewerCanAccessOrg(
        platformOrg.id,
      ))
    ) {
      throw new Error(`Viewer cannot access org ${args.id}`);
    }

    return platformOrg;
  };
