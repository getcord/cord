import { QueryTypes } from 'sequelize';

import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertServiceViewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export type MetricsEntry = { applicationID: UUID; date: string; value: number };

export class ApplicationUsageMetricMutator {
  constructor(public readonly viewer: Viewer) {}

  /**
   * Persist a batch of application usage metrics.
   *
   * Overwrites any existing values.
   *
   * @param metricID the metric ID for all rows to be written
   * @param data objects containing `applicationID`/`date`/`value` fields
   */
  async writeMetrics(metricID: UUID, data: MetricsEntry[]) {
    assertServiceViewer(this.viewer);

    await getSequelize().query(
      `INSERT INTO
       application_usage_metrics ("metricID", "applicationID", "date", "value")
       SELECT $1, *
       FROM unnest($2::uuid[], $3::date[], $4::integer[])
       ON CONFLICT ("metricID", "applicationID", "date")
       DO UPDATE SET value=EXCLUDED.value;`,
      {
        type: QueryTypes.INSERT,
        bind: [
          metricID,
          data.map((d) => d.applicationID),
          data.map((d) => d.date),
          data.map((d) => d.value),
        ],
      },
    );
  }
}
