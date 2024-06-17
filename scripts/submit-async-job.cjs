#!/usr/bin/env node

/* This script allows you to submit a one-off job to the async tier.
 *
 * It reads your `.env` file for the database configuration, so start it from
 * the root directory of your monorepo checkout. Like this:
 *
 * # scripts/submit-async-job.cjs example '{"message": "hello everyone"}'
 *
 * The script takes two arguments: first the name of the job, and second a JSON
 * object with the job parameters.
 *
 * Have a look into `server/src/asyncTier/jobs.ts`! That file contains the job
 * names (e.g. 'example' for the EXAMPLE_JOB) as well as the type definitions
 * for the data objects.
 */

require('dotenv/config');
const PgBoss = require('pg-boss');

async function main() {
  const { argv, env } = process;

  if (argv.length !== 4) {
    throw `Usage: scripts/submit-async-job.cjs <job name> <json object>`;
  }
  const name = argv[2];
  const data = JSON.parse(argv[3]);

  const boss = new PgBoss({
    host: env.POSTGRES_HOST,
    port:
      env.POSTGRES_PORT !== undefined ? Number(env.POSTGRES_PORT) : undefined,
    database: env.POSTGRES_DB,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    schema: `pgboss_${env.CORD_TIER}`,
  });

  await boss.start();
  const result = await boss.send(name, data);
  console.log(`boss.send returned '${result}'`);
}

main().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
