import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ProviderRuleTestEntity } from 'server/src/entity/provider_rule_test/ProviderRuleTestEntity.ts';

export class ProviderRuleTestMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async create(
    fields: Partial<ProviderRuleTestEntity>,
  ): Promise<ProviderRuleTestEntity> {
    return await ProviderRuleTestEntity.create({
      ...fields,
    });
  }

  async delete(id: UUID): Promise<boolean> {
    const deleted = await ProviderRuleTestEntity.destroy({
      where: { id },
    });

    return deleted === 1;
  }
}
