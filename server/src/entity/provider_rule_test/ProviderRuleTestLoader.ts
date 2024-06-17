import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { ProviderRuleTestEntity } from 'server/src/entity/provider_rule_test/ProviderRuleTestEntity.ts';

export class ProviderRuleTestLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadForProvider(id: UUID) {
    return await ProviderRuleTestEntity.findAll({
      where: { providerID: id },
    });
  }
}
