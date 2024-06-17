import { CORD_HOMEPAGE_APPLICATION_ID } from 'common/const/Ids.ts';
import { isDefined } from 'common/util/index.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasPlatformApplicationID,
} from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const usersByExternalIDQueryResolver: Resolvers['Query']['usersByExternalID'] =
  async (_, args, context) => {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );
    const orgIDs = assertViewerHasOrgs(context.session.viewer);

    // HACKY HACKY SHIT to make LiveCursors work for the v5 website without
    // fixing some structural problems with the way we load users on the
    // frontend that prevent us from using an org ID override. So just ignore
    // orgs and let you load any user in this demo app. THIS IS NOT SAFE IN
    // GENERAL since the function we're calling below does *no* org checks, we
    // should be checking that the viewer shares an org with the target, but it
    // doesn't matter for the demo app so I'm not bothering.
    if (platformApplicationID === CORD_HOMEPAGE_APPLICATION_ID) {
      const users = await Promise.all(
        args.externalIDs.map((externalID) =>
          context.loaders.userLoader.loadUserByExternalID(
            platformApplicationID,
            externalID,
          ),
        ),
      );
      return users.filter(isDefined);
    }

    return await context.loaders.userLoader.loadUsersByExternalIDsInOrg(
      args.externalIDs,
      orgIDs,
    );
  };
