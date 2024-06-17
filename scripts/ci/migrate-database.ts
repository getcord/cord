#!/usr/bin/env -S node --enable-source-maps

import { performance } from 'perf_hooks';

import 'dotenv/config.js';
import { getPendingMigrations } from 'scripts/lib/migrate_db.mjs';

import { postMessageFactory, runCommandLine } from 'scripts/ci/lib/helpers.ts';
import env from 'server/src/config/Env.ts';

async function main(): Promise<number> {
  // Get us a function to post important messages to the Slack ops channel
  const postErrorMessage = await postMessageFactory(
    env.CORD_OPS_SLACK_CHANNEL_ID,
  );

  const postInfoMessage = await postMessageFactory(
    env.PROD_CHANGES_SLACK_CHANNEL_ID,
  );

  try {
    // Do we need to do a database migration?
    // This checks whether the current database schema on the prod/staging
    // database has all the migrations applied that we ship in the container.
    console.log('Check if migration is pending');
    const pendingMigrations = await getPendingMigrations();
    const migrationNeeded = pendingMigrations.length > 0;

    if (!migrationNeeded) {
      console.log('\n\nNo database migration required');
      return 0;
    }

    const migrationsSuffix = `\n\n• ${pendingMigrations.join('\n• ')}`;
    // We need to apply the database migration!
    console.log('\n\nStarting a database migration');
    await postInfoMessage('Starting a database migration:' + migrationsSuffix);

    // Print out warnings on Slack if the migration is taking a long time.
    const migrationStartTime = performance.now();
    const timeoutID = setInterval(() => {
      void postErrorMessage(
        `Database migration still has not finished after ${Math.round(
          (performance.now() - migrationStartTime) / 1000,
        )} seconds`,
      );
    }, 30 * 1000);

    const exitCode = await runCommandLine('npm', ['run', 'migrate']).finally(
      () => clearInterval(timeoutID),
    );

    if (exitCode === 0) {
      const completionMessage =
        'Successfully completed database migrations:' + migrationsSuffix;
      await postInfoMessage(completionMessage);
    } else {
      throw new Error(
        `'npm run migrate' failed (process exit code: ${exitCode})`,
      );
    }
  } catch (err) {
    await postErrorMessage(`Database migration failed: ${err}`);
    throw err;
  }

  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
