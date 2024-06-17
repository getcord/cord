import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

export const usageStatsQueryResolver: Resolvers['Query']['usageStats'] = async (
  _,
  _args,
  context,
) => {
  const customerID = await consoleUserToCustomerID(
    context.session.viewer,
    context.loaders.consoleUserLoader,
  );

  const applications = await ApplicationEntity.findAll({
    where: { customerID },
  });

  const mauRows =
    await context.loaders.applicationUsageMetricLoader.loadLatestUsage(
      'users_exposed_to_cord_28d',
      applications.map((app) => app.id),
    );

  const mau = mauRows.reduce(
    (x, y) => x + ((y.users_exposed_to_cord_28d ?? 0) as number),
    0,
  );

  return { mau };
};
