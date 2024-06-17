import { isEmployee } from 'common/util/index.ts';
import { PublishedProviderLoader } from 'server/src/entity/published_provider/PublishedProviderLoader.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const providersQueryResolver: Resolvers['Query']['providers'] = async (
  _,
  { latest, version },
  context,
) => {
  const isViewerEmployee = isEmployee(context.session.viewer.orgID);

  // if the user is an employee + has requested latest, return everything directly from the database
  const result = await (isViewerEmployee && latest
    ? context.loaders.providerLoader.loadAllRuleProviders()
    : PublishedProviderLoader.getCachedRuleProviders());

  if (version === result.version) {
    return null;
  } else {
    return result;
  }
};
