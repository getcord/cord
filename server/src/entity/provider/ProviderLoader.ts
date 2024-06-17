import type { Transaction } from 'sequelize';

import type { Viewer } from 'server/src/auth/index.ts';
import type {
  UUID,
  RuleProvider,
  ProvidersResult,
} from 'common/types/index.ts';
import { ProviderEntity } from 'server/src/entity/provider/ProviderEntity.ts';
import { DEFAULT_CSS_MUTATOR_CONFIG } from 'common/const/Styles.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { uuidHash } from 'server/src/util/hash.ts';

function populateDefaultCSS(provider: RuleProvider) {
  provider.documentMutators.map((dm) => {
    if (dm.type === 'default_css') {
      dm.config = DEFAULT_CSS_MUTATOR_CONFIG;
    }
  });
  return provider;
}

function rowToRuleProvider(row: any): RuleProvider {
  const {
    id,
    name,
    domains,
    iconURL,
    nuxText,
    mergeHashWithLocation,
    disableAnnotations,
    visibleInDiscoverToolsSection,
    documentMutators,
    rules,
    claimingApplication,
  } = row;
  const ruleProvider: RuleProvider = {
    id,
    name,
    domains,
    platformApplicationID: claimingApplication,
    iconURL,
    nuxText,
    mergeHashWithLocation,
    disableAnnotations,
    visibleInDiscoverToolsSection,
    documentMutators,
    rules,
  };
  return populateDefaultCSS(ruleProvider);
}

export class ProviderLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async load(id: UUID) {
    return await ProviderEntity.findByPk(id);
  }

  async loadAll() {
    return await ProviderEntity.findAll({
      order: [['name', 'ASC']],
    });
  }

  async loadRuleProvider(
    id: UUID,
    transaction?: Transaction,
  ): Promise<RuleProvider | null> {
    const [rows] = await getSequelize().query(
      `SELECT * FROM providers_view WHERE id=$1;`,
      {
        bind: [id],
        transaction,
      },
    );
    if (rows.length) {
      return rowToRuleProvider(rows[0]);
    } else {
      return null;
    }
  }

  async loadAllRuleProviders(): Promise<ProvidersResult> {
    const [rows] = await getSequelize().query(
      `SELECT * FROM providers_view ORDER BY name, id;`,
    );
    const ruleProviders = rows.map(rowToRuleProvider);
    return { ruleProviders, version: uuidHash(ruleProviders) };
  }
}
