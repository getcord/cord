import { Sequelize, Transaction } from 'sequelize';

import type { UUID } from 'common/types/index.ts';
import type { Session } from 'server/src/auth/index.ts';
import { ProviderLoader } from 'server/src/entity/provider/ProviderLoader.ts';
import { PublishedProviderEntity } from 'server/src/entity/published_provider/PublishedProviderEntity.ts';
import { PublishedProviderLoader } from 'server/src/entity/published_provider/PublishedProviderLoader.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ProviderEntity } from 'server/src/entity/provider/ProviderEntity.ts';

export class PublishedProviderMutator {
  constructor(private session: Session) {
    if (!session.isAdmin) {
      throw new Error('Only admins can mutate published provider sets');
    }
  }

  async publish(providerID: UUID): Promise<void> {
    await getSequelize().transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (transaction) => {
        const providerLoader = new ProviderLoader(this.session.viewer);
        const provider = await providerLoader.loadRuleProvider(
          providerID,
          transaction,
        );

        if (provider) {
          await PublishedProviderEntity.upsert(
            {
              providerID,
              lastPublishedTimestamp: Sequelize.fn('NOW'),
              ruleProvider: provider,
            },
            { transaction },
          );
          await ProviderEntity.update(
            { dirty: false },
            {
              where: { id: providerID },
              transaction,
            },
          );
        } else {
          await PublishedProviderEntity.destroy({
            where: { providerID },
            transaction,
          });
        }
      },
    );

    PublishedProviderLoader.clearCachedRuleProviders();
  }

  async unpublish(providerID: UUID) {
    await getSequelize().transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (transaction) => {
        await PublishedProviderEntity.destroy({
          where: { providerID },
          transaction,
        });
        await ProviderEntity.update(
          { dirty: true },
          {
            where: { id: providerID },
            transaction,
          },
        );
      },
    );
    PublishedProviderLoader.clearCachedRuleProviders();
  }
}
