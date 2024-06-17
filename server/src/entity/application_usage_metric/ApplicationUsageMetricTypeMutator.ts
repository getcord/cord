import { Sequelize } from 'sequelize';

import type { Viewer } from 'server/src/auth/index.ts';
import { assertServiceViewer } from 'server/src/auth/index.ts';
import type { ApplicationUsageMetricType } from 'server/src/metrics/applicationUsageMetrics.ts';
import { ApplicationUsageMetricTypeEntity } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricTypeEntity.ts';

export class ApplicationUsageMetricTypeMutator {
  constructor(public readonly viewer: Viewer) {}

  async getOrCreateMetricID(metric: ApplicationUsageMetricType) {
    assertServiceViewer(this.viewer);

    const [entity] = await ApplicationUsageMetricTypeEntity.findOrCreate({
      where: { metric },
      defaults: { id: Sequelize.literal('DEFAULT') },
    });

    return entity.id;
  }
}
