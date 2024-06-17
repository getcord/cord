#!/usr/bin/env -S node --enable-source-maps

/**
 * This script calculates an application usage metrics for the given
 * application. It does not read the data from the application_usage_metrics
 * table, but instead performs the calculation. The calculated values are not
 * persisted, but only printed out on the terminal.
 *
 * The purpose of the script is to test metrics queries.
 */

import 'dotenv/config.js';
import Pg from 'pg';
import yargs from 'yargs';

import {
  applicationUsageMetricTypes,
  applicationUsageMetricsQueries,
  isApplicationUsageMetricType,
} from 'server/src/metrics/applicationUsageMetrics.ts';
import { assertUUID } from 'common/util/index.ts';
import { getReadReplicaDbConfigFromEnv } from 'server/src/util/readReplicaDatabase.ts';

const argv = yargs(process.argv.slice(2))
  .option('appID', {
    type: 'string',
    demandOption: true,
    description: 'id of application for which metrics will be calculated',
  })
  .option('metric', {
    type: 'string',
    demandOption: true,
    description: 'name of metric to calculate',
    choices: applicationUsageMetricTypes,
  })
  .option('days', {
    type: 'number',
    default: 30,
    description: 'number of days',
  })
  .strict()
  .help()
  .alias('help', 'h').argv;

const { appID, metric, days } = argv;

async function main() {
  if (!isApplicationUsageMetricType(metric)) {
    throw new Error(`Unknown metric: ${metric}`);
  }
  assertUUID(appID);
  if (typeof days !== 'number' || days <= 0) {
    throw new Error(`Invalid value for --days: ${days}`);
  }

  const config = getReadReplicaDbConfigFromEnv(process.env);
  const pg = new Pg.Client(config);
  await pg.connect();
  await pg.query('SET search_path=cord,public;');

  const metricQueries = applicationUsageMetricsQueries();
  const mq = metricQueries[metric];
  const query = mq.query;
  const bind = mq.bind ? [...mq.bind] : [];

  // We are adding two more placeholders: the values of `days` and `appID`. (The
  // placeholder to be used for `days` is `$1` if after adding `days` to the
  // array the array length is 1, and so forth. And then the same for
  // `appID`.)
  bind.push(days);
  const daysPlaceholder = `$${bind.length}`;
  bind.push(appID);
  const appIDPlaceholder = `$${bind.length}`;

  // We are wrapping the query here, in order to restrict the query to the
  // requested number of days, but also to make sure to list all of the last
  // `days` days, not just the ones returned by the given query. (If days are
  // missing in the given query, we will print those out as `null` - the actual
  // async job that persist the data will treat them as zero values.) We also
  // check the creation date of the given application, and won't output any days
  // before creation.
  const wrappedQuery = `\
  WITH q AS (${query.trim()})
  SELECT
    d.date::text AS "date",
    q.value::integer AS "value"
  FROM applications a
  CROSS JOIN (
    SELECT CURRENT_DATE-generate_series(1,${daysPlaceholder}) AS "date"
  ) d
  LEFT OUTER JOIN q ON (q."applicationID", q."date")=(a."id", d."date")
  WHERE a.id = ${appIDPlaceholder}
  AND d."date" >= a."createdTimestamp"::date
  ORDER BY d."date";`;

  const startTime = performance.now();
  const { rows } = await pg.query<{ date: string; value: number | null }>(
    wrappedQuery,
    bind,
  );
  const endTime = performance.now();

  console.log(`Query time: ${endTime - startTime}ms`);
  for (const { date, value } of rows) {
    console.log(`${date} : ${value ?? 'null (meaning 0)'}`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
