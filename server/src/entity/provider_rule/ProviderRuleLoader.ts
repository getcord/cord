import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { ProviderRuleEntity } from 'server/src/entity/provider_rule/ProviderRuleEntity.ts';

export class ProviderRuleLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadForProvider(id: UUID) {
    return await ProviderRuleEntity.findAll({
      where: { providerID: id },
      order: [['order', 'asc']],
    });
  }
}
