import Pg from 'pg';

import { getReadReplicaDbConfigFromEnv } from 'server/src/util/readReplicaDatabase.ts';
import env from 'server/src/config/Env.ts';
import type { MetricsEntry } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricMutator.ts';
import { ApplicationUsageMetricMutator } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricMutator.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { ApplicationUsageMetricTypeMutator } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricTypeMutator.ts';
import {
  applicationUsageMetricsQueries,
  isApplicationUsageMetricType,
} from 'server/src/metrics/applicationUsageMetrics.ts';
import type { ApplicationUsageMetricType } from 'server/src/metrics/applicationUsageMetrics.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';

export default new AsyncTierJobDefinition(
  'applicationUsageMetrics',
  applicationUsageMetricsJob,
).schedule({
  tier: 'staging',
  name: 'daily',
  cron: '30 6 * * *', // At 6:30am UTC every day
  data: {},
});

type ApplicationUsageMetricsData = {
  metrics?: string[];
  days?: number;
  overwriteDays?: number;
};

type MetricDefinition = {
  query: string;
  bind?: any[];
  days?: number;
};

async function applicationUsageMetricsJob(
  options: ApplicationUsageMetricsData,
  logger: Logger,
) {
  // Make a connection to the read replica. We can make all the heavy queries on
  // there, and then later use a separate connection to write the newly
  // calculated metrics into the `application_usage_metrics` table.
  const config = getReadReplicaDbConfigFromEnv(env);
  const pg = new Pg.Client(config);
  await pg.connect();
  await pg.query('SET search_path=cord,public;');

  // The SQL implementations of all queries are in
  // `server/src/metrics/applicationUsageMetrics.ts`
  const metricQueries = applicationUsageMetricsQueries();

  // For each type of metric, calculate missing values and then persist them to
  // the `application_usage_metrics` table
  const metrics = options.metrics ?? Object.keys(metricQueries);
  for (const metric of metrics) {
    if (isApplicationUsageMetricType(metric)) {
      await materialiseMetric(
        pg,
        logger,
        metric,
        metricQueries[metric],
        options.days,
        options.overwriteDays,
      );
    } else {
      logger.warn(
        'applicationUsageMetricsJob: invalid metric given in job data',
        { metric },
      );
    }
  }
}

/**
 * For a given metric, calculate and store values currently missing in the
 * `application_usage_metrics` table
 *
 * This function expects and SQL query (in `definition.query`) that calculates
 * the metric. The query must produce 3 columns: `applicationID`, `date` and
 * `value`. To simplify the writing of the metrics queries, they do not need to
 * check which appID/date tuples are already present in the
 * `application_usage_metrics` type, or worry about date ranges. In fact, they
 * shouldn't reference the `application_usage_metrics` table at all. If executed
 * on their own, these queries would produce the metric for all applications and
 * all times.
 *
 * This function wraps the given query, so that only the currently missing data
 * is calculated. Also no metrics are produces for an application before its
 * creation date.
 *
 * If the query does not include a row for a specific applicationID/date
 * combination, it counts as a zero value. That also simplifies query writing:
 * e.g. the number of messages per day can be implemented as a simple query
 * grouping all messages by application id and day and using the count of
 * message rows as the value. That query will not list any appID/day
 * combinations for which no messages exist, and thus this function will regard
 * that as a zero value for that appID/day and persist that.
 *
 * @param pg a `PgClient` connected to the read-only database (in prod that is
 * the read replica of our Aurora cluster, in dev it's just your local Postgres)
 * @param metric name of the metric (`ApplicationUsageMetricType`)
 * @param definition object containing the SQL query to calculate the metric
 * (`query`), optionally any placeholder values (`bind`) and the number of days
 * going back for which this metric should be calculated (`days` - defaults to
 * 30)
 */
async function materialiseMetric(
  pg: Pg.Client,
  logger: Logger,
  metric: ApplicationUsageMetricType,
  definition: MetricDefinition,
  days?: number,
  overwriteDays?: number,
) {
  const { query } = definition;

  const metricID = await new ApplicationUsageMetricTypeMutator(
    Viewer.createServiceViewer(),
  ).getOrCreateMetricID(metric);

  // These are the placeholder values part of the query definition passed to
  // this function.
  const bind = definition.bind ? [...definition.bind] : [];

  // We are adding three more placeholders: the value of `days` and
  // `overwriteDays` and the id of the metric. (The placeholder to be used for
  // `days` is `$1` if after adding `days` to the array the array length is 1,
  // and so forth. And then the same for `overwriteDays`, `metricID`.)
  bind.push(days ?? definition.days ?? 30);
  const daysPlaceholder = `$${bind.length}`;
  bind.push(overwriteDays ?? 2);
  const overwriteDaysPlaceholder = `$${bind.length}`;
  bind.push(metricID);
  const metricIDPlaceholder = `$${bind.length}`;

  // The given query is turned into one that gives us all the desired
  // behaviours. For that, we construct a matric of all applicationID/day
  // combinations, for *all* existing applications and the last `days` days
  // (default 30). We join that matrix with the matching rows of the given query
  // in order to add the `value` to it. If the given query is missing some rows
  // from our matrix, we just treat those as zero values. We then join with the
  // `application_usage_metrics` table, just so we can check which of the rows
  // we have now are already present in that table.
  //
  // After all the joining, we filter out the appID/date combinations that are
  // already present in the `application_usage_metrics` table for the given
  // metric. And we also filter out any appID/date combinations where the date
  // is earlier than the creation date of the application.
  //
  // This may sound complicated, but it gives us exactly the data that we need
  // to write into the `application_usage_metrics` table. Postgres is good at
  // figuring out how to execute the query, and takes into account heuristics
  // and estimates of table sizes etc. Given that we are running this async job
  // once a day, we usually only need to calculate the metric of the last day
  // (because all previous days are already in the `application_usage_metrics`
  // table). Postgres might well use this for optimising the query plan.
  //
  // Also, keep in mind that in prod this query is run against the read replica
  // of our Aurora cluster. So we don't add any load to the main prod db
  // instance. Once we have the results of this query, we will insert the data
  // (talking to the write instance, obviously).
  const wrappedQuery = `\
    WITH q AS (${query.trim()})
    SELECT
      a.id AS "applicationID",
      d.date::text AS "date",
      COALESCE(q.value, 0)::integer AS "value"
    FROM applications a
    CROSS JOIN (
      SELECT CURRENT_DATE-generate_series(1,${daysPlaceholder}) AS "date"
    ) d
    LEFT OUTER JOIN q ON (q."applicationID", q."date")=(a."id", d."date")
    LEFT OUTER JOIN application_usage_metrics exm
    ON (exm."applicationID", exm."metricID", exm."date")=
      (a."id", ${metricIDPlaceholder}, d."date")
    WHERE d."date" >= a."createdTimestamp"::date
    AND (
      exm IS NULL
      OR d."date" >= (CURRENT_DATE-${overwriteDaysPlaceholder}::integer)
    );`;

  const startTime = performance.now();
  const { rows } = await pg
    .query<MetricsEntry>(wrappedQuery, bind)
    .finally(() => {
      const endTime = performance.now();
      logger.info('applicationUsageMetricsJob: materialiseMetric - query', {
        metric,
        query: wrappedQuery,
        bind,
        durationMS: endTime - startTime,
      });
    });

  if (rows.length) {
    logger.info('applicationUsageMetricsJob: materialiseMetric - write', {
      metric,
      rows: rows.length,
    });
    await new ApplicationUsageMetricMutator(
      Viewer.createServiceViewer(),
    ).writeMetrics(metricID, rows);
  }
}
