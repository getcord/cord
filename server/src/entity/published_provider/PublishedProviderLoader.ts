import { Sequelize } from 'sequelize';

import type {
  ProvidersResult,
  RuleProvider,
  UUID,
} from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { PublishedProviderEntity } from 'server/src/entity/published_provider/PublishedProviderEntity.ts';
import { cache, cachedResult } from 'server/src/util/cache.ts';
import { uuidHash } from 'server/src/util/hash.ts';

// Caching the full providers set for one minute is long enough. It means that
// instead of very many database queries for all providers, we only make one a
// minute.  Also if something other than the `PublishedProviderMutator` of this
// server (which invalidates the cache) changes the `published_providers`
// table, we pick it up after just one minute.
const CACHE_TTL_SECONDS = 60; // 1 minute
const CACHE_KEY = `published_rule_providers`;

export class PublishedProviderLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async getRuleProvider(id: UUID): Promise<RuleProvider | undefined> {
    const publishedProvider = await PublishedProviderEntity.findByPk(id);
    return publishedProvider?.ruleProvider;
  }

  async getRuleProviders(): Promise<ProvidersResult> {
    const publishedProviders = await PublishedProviderEntity.findAll({
      order: [
        [Sequelize.literal('"ruleProvider"->>\'name\''), 'ASC'],
        ['providerID', 'ASC'],
      ],
    });
    const ruleProviders = publishedProviders.map((pp) => pp.ruleProvider);
    return { ruleProviders, version: uuidHash(ruleProviders) };
  }

  async isProviderPublished(id: UUID): Promise<boolean> {
    const entity = await PublishedProviderEntity.findByPk(id);
    return entity !== null;
  }

  static getCachedRuleProviders = () =>
    cachedResult(
      () => {
        const loader = new PublishedProviderLoader(
          Viewer.createAnonymousViewer(),
        );
        return loader.getRuleProviders();
      },
      CACHE_KEY,
      CACHE_TTL_SECONDS,
    );

  static clearCachedRuleProviders = () => cache.del(CACHE_KEY);
}
