import { Sequelize } from 'sequelize';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ProviderRuleEntity } from 'server/src/entity/provider_rule/ProviderRuleEntity.ts';

export class ProviderRuleMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async create(
    fields: Partial<ProviderRuleEntity>,
  ): Promise<ProviderRuleEntity> {
    return await ProviderRuleEntity.create({
      ...fields,
      order: Sequelize.literal(
        `(
          SELECT COALESCE(MAX("order") + 1, 0)
          FROM "${ProviderRuleEntity.tableName}"
          WHERE "providerID" = '${fields.providerID}'
        )`,
      ),
    });
  }

  async update(
    id: UUID,
    fields: Partial<ProviderRuleEntity>,
  ): Promise<boolean> {
    const [updated] = await ProviderRuleEntity.update(fields, {
      where: { id },
    });

    return updated === 1;
  }

  async delete(id: UUID): Promise<boolean> {
    const deleted = await ProviderRuleEntity.destroy({
      where: { id },
    });

    return deleted === 1;
  }

  async updateRuleOrder(providerID: UUID, ruleIDs: UUID[]) {
    await getSequelize().transaction(async (transaction) => {
      await Promise.all(
        ruleIDs.map((ruleID, index) =>
          ProviderRuleEntity.update(
            { order: index },
            {
              where: {
                id: ruleID,
                providerID,
              },
              transaction,
            },
          ),
        ),
      );
    });
  }
}
