#!/usr/bin/env -S node --enable-source-maps

/*
 * Build this script:
 * # build/index.mjs --mode=development --target=scripts
 *
 * Run like this:
 * # dist/scripts/migrate-locations.js --applicationID "xxx" --matcher '{"..."}' --transform '{"..."}'
 *
 * This script will:
 * - find all pages that match the given matcher
 * - apply the transformation to produce new context data
 * - update all entities that reference the old page to reference the new one
 *
 * Matchers are location matchers as used in our public APIs.  See
 * https://docs.cord.com/concepts/#location.  As an example,
 *
 * --matcher '{"page": "foo", "subsection": "bar"}'
 *
 * will match any location that includes those specific field values, regardless
 * of the value of any other field.
 *
 * Transformations are JSON objects that associate fields with the action to
 * take on them.  See the type definition for FieldTransformation below for the
 * details on what's supported.  As an example,
 *
 * --transform '{"page": {"literal": "baz"}, "subsection": { drop: true }}'
 *
 * would transform {"page": "foo", "subsection": "bar", "paragraph": 3} into
 * {"page": "baz", "paragraph": 3}
 */

import 'dotenv/config.js';
import { QueryTypes } from 'sequelize';
import yargs from 'yargs';
import { initSequelize, getSequelize } from 'server/src/entity/sequelize.ts';
import type { Location, UUID } from 'common/types/index.ts';
import { locationJson, locationEqual } from 'common/types/index.ts';
import { migrateObjects } from 'scripts/lib/migrate_objects.ts';
import { COMMIT_ARG, maybePrintDryRunWarning } from 'scripts/lib/util.ts';

type FieldTransformation =
  | {
      drop: true;
    }
  | {
      literal: string | number | boolean;
    };

type LocationTransformation = {
  [k: string]: FieldTransformation;
};

const argv = yargs(process.argv.slice(2))
  .option('applicationID', {
    type: 'string',
    description: 'ID of the application whose data should be migrated',
    demandOption: true,
  })
  .option('matcher', {
    type: 'string',
    description: 'Matcher to select pages to migrate',
    demandOption: true,
  })
  .option('transform', {
    type: 'string',
    description: 'Transformation to apply to page location data',
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
    // that match the matcher
    const pages = await getSequelize().query<{
      orgID: UUID;
      contextHash: UUID;
      contextData: Location;
    }>(
      `SELECT
          p."orgID", p."contextHash", p."contextData"
       FROM pages p
       INNER JOIN orgs o
          ON p."orgID" = o."id"
       WHERE o."platformApplicationID" = $1
         AND p."providerID" IS NULL
         AND p."contextData" @> $2::jsonb`,
      {
        type: QueryTypes.SELECT,
        bind: [argv.applicationID, argv.matcher],
        transaction,
      },
    );

    console.log(
      `Found ${pages.length} matching pages belonging to application ${argv.applicationID}`,
    );

    maybePrintDryRunWarning(argv);

    const transformation = JSON.parse(argv.transform) as LocationTransformation;

    let count = 0;
    for (const page of pages) {
      count++;
      console.log(`Processing page ${count}/${pages.length}`);
      const newContextData = applyTransformation(
        page.contextData,
        transformation,
      );
      // No need to migrate objects if the contextData didn't change
      if (!locationEqual(page.contextData, newContextData)) {
        console.log(
          `Moving ${locationJson(page.contextData)}\n    => ${locationJson(
            newContextData,
          )}`,
        );
        if (argv.commit) {
          await migrateObjects(
            page.orgID,
            page.contextHash, // Source contextHash
            newContextData, // Destination contextData
            transaction,
          );
        }
      }
    }

    maybePrintDryRunWarning(argv);
  });
}

function applyTransformation(
  context: Location,
  transformation: LocationTransformation,
): Location {
  const newContext = { ...context };
  for (const k of Object.keys(transformation)) {
    const kTransform = transformation[k];
    if ('drop' in kTransform) {
      delete newContext[k];
    } else if ('literal' in kTransform) {
      newContext[k] = kTransform.literal;
    }
  }
  return newContext;
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
