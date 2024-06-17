#!/usr/bin/env -S node --enable-source-maps

/*
 * Build this script:
 * # build/index.mjs --mode=development --target=scripts
 *
 * Run like this:
 * # dist/scripts/drop-provider-id.js --applicationID "xxx"
 *
 * This script will:
 * - find all pages that belong to the given platform application and have
 *   providerID set. ProviderID's were set in the embed world but are not used in
 *   SDK world.
 * - drop providerID from found pages and recompute the pageContextHash
 * - update all entities referencing the old pageContextHash
 */
import 'dotenv/config.js';
import { QueryTypes } from 'sequelize';
import yargs from 'yargs';
import { initSequelize, getSequelize } from 'server/src/entity/sequelize.ts';
import type { Location, UUID } from 'common/types/index.ts';
import { migrateObjects } from 'scripts/lib/migrate_objects.ts';
import { COMMIT_ARG, maybePrintDryRunWarning } from 'scripts/lib/util.ts';
const argv = yargs(process.argv.slice(2))
  .option('applicationID', {
    type: 'string',
    description: 'ID of the application that is moving from embed to SDK',
    demandOption: true,
  })
  .options(COMMIT_ARG)
  .strict()
  .help()
  .alias('help', 'h').argv;

async function main() {
  await initSequelize('script');
  return await getSequelize().transaction(async (transaction) => {
    // Find all pages that belong to orgs belonging to given application
    const pages: Array<{
      orgID: UUID;
      contextHash: UUID;
      contextData: Location;
    }> = await getSequelize().query(
      `SELECT
          p."orgID", p."contextHash", p."contextData"
       FROM pages p
       INNER JOIN orgs o
          ON p."orgID" = o."id"
       WHERE
          o."platformApplicationID"=$1 AND
          p."providerID" IS NOT NULL;`,
      {
        type: QueryTypes.SELECT,
        bind: [argv.applicationID],
        transaction,
      },
    );

    maybePrintDryRunWarning(argv);

    console.log(
      `Found ${pages.length} pages belonging to application ${argv.applicationID}`,
    );

    let count = 0;
    for (const page of pages) {
      count++;
      console.log(`Processing page ${count}/${pages.length}`);
      if (argv.commit) {
        await migrateObjects(
          page.orgID,
          page.contextHash, // Source contextHash
          page.contextData, // Destination contextData
          transaction,
        );
      }
    }

    maybePrintDryRunWarning(argv);
  });
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
