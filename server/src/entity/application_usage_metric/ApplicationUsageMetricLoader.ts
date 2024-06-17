import { QueryTypes } from 'sequelize';
import type { JsonObject, UUID } from 'common/types/index.ts';

import type { Viewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export class ApplicationUsageMetricLoader {
  constructor(public readonly viewer: Viewer) {}

  /**
   * Load stored application usage metrics from the database and return them in
   * the format in which we deliver them in GraphQL: an array of JSON objects,
   * one per day, in chronological order. Each object contains the field `date`,
   * with a date string, and fields for the requested metrics.
   */
  async loadUsageMetrics(
    applicationID: UUID,
    metrics: string[],
    days: number,
  ): Promise<JsonObject[]> {
    const rows = await getSequelize().query<{ data: JsonObject }>(
      `SELECT
        jsonb_build_object('date', d.day) ||
        jsonb_object_agg(mt.metric, m.value)
        AS data
      FROM (SELECT CURRENT_DATE-generate_series(1,$1) AS day) d
      CROSS JOIN application_usage_metric_types mt
      LEFT OUTER JOIN application_usage_metrics m
        ON m."applicationID"=$2
        AND m.date=d.day
        AND m."metricID"=mt.id
      WHERE mt.metric=ANY($3)
      GROUP BY d.day ORDER BY d.day;`,
      {
        type: QueryTypes.SELECT,
        bind: [days, applicationID, metrics],
      },
    );

    return rows.map((row) => row.data);
  }

  async loadLatestUsage(metric: string, applicationIDs: UUID[]) {
    const rows = await getSequelize().query<{ data: JsonObject }>(
      `SELECT
      m.date,
      m."applicationID",
      jsonb_object_agg(mt.metric, m.value) AS data
    FROM application_usage_metrics m
    JOIN application_usage_metric_types mt ON m."metricID" = mt.id
    WHERE
      m.date = (
        SELECT
          MAX(date)
        FROM
          application_usage_metrics
      )
      AND mt.metric=$1
      and m."applicationID"=ANY($2)
    GROUP BY
      m.date,
      m."applicationID";`,
      {
        type: QueryTypes.SELECT,
        bind: [metric, applicationIDs],
      },
    );

    return rows.map((row) => row.data);
  }
}
