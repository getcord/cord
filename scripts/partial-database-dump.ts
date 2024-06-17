#!/usr/bin/env -S node --enable-source-maps

// This script connects to the radical database and
// creates a partial dump of it.
//
// Please look at `server/src/admin/databaseDump/index.ts` for more information.
//
// This script can be run without running a server instance. Instead of
// downloading the database dump using `curl`, run this script like this
//
// Typical use:
// # build/index.mjs --target=scripts
// # dist/scripts/partial-database-dump.js --envFile .env >dump.sql
// # psql -f dump.sql new_radical_db_local
//
// The above assumes that:
// * there is a file called ".env" which has the POSTGRES_* variables in it,
//   pointing to the PostgreSQL database from which you want to create the
//   partial dump.
// * you have a local database server, which has a database called
//   `new_radical_db_local` on it
// * if there is any data in `new_radical_db_local`, you are ready to wipe all
//   of it.
//
// Please look at `server/src/admin/databaseDump/index.ts` for more information.

import { promises as fs } from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import * as dotenv from 'dotenv';

import { streamPartialDump } from 'server/src/admin/databaseDump/index.ts';
import { getReadReplicaDbConfigFromEnv } from 'server/src/util/readReplicaDatabase.ts';

async function main() {
  const argv = yargs(process.argv.slice(2))
    .option({
      envFile: {
        description: 'path to the .env file with database configuration',
        default: '.env',
        type: 'string',
      },
    })
    .help().argv;

  const env = dotenv.parse(
    await fs.readFile(path.resolve(process.cwd(), argv.envFile), {
      encoding: 'utf8',
    }),
  );

  await streamPartialDump(process.stdout, getReadReplicaDbConfigFromEnv(env));
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
