import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

export const getOrgsQueryResolver: Resolvers['Query']['getOrgs'] = async (
  _,
  args,
  context,
) => {
  const hasAccessToApplication = await userHasAccessToApplication(
    context.session.viewer,
    args.applicationID,
    context.loaders.consoleUserLoader,
  );

  if (!hasAccessToApplication) {
    return null;
  }
  const orgs = await OrgEntity.findAll({
    where: {
      platformApplicationID: args.applicationID,
    },
  });

  return orgs.map(({ externalID, state, name }) => {
    return {
      id: externalID,
      name,
      // our REST APi docs show status as active and deleted, whereas our
      // database stores active and inactive
      status: state === 'inactive' ? 'deleted' : 'active',
    };
  });
};
