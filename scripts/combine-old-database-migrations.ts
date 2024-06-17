#!/usr/bin/env -S node --enable-source-maps

/**
 * Combine a number of old database migration into a single one
 *
 * At the time of writing this script, we have 318 migrations in the
 * database/migrations directory. That's a lot. It slows down the
 * check-database-schema script down, and it is just a lot of noise.
 *
 * This script simply combines many migrations into one. Call it with the name
 * of the migration up to which you want to combine them into one. The given
 * migration, and all the ones before leading to it, will disappear and be
 * replaced with one migration that contains the whole database content (schema
 * and data) created by the individual migrations replaced.
 *
 * To run this script, first choose up to which migration you want to combine
 * them all in one. Then you call this script:
 *
 * dist/scripts/combine-old-database-migrations.js
 * --to=TIMESTAMP-MIGRATION-NAME.js
 *
 * The script will delete old migration files and create one new migration. You
 * should be able to commit those changes without manual changes.
 *
 * This is a suitable test plan:
 *
 * Before running the script:
 * * `dist/scripts/check-database-schema.js --check` to check that your
 *   `cord.sql` file is equivalent to the sum of all migrations
 * * `dist/scripts/check-database-schema.js --checkDatabase` to check that your
 *   local database conforms with the `cord.sql` file
 *
 * After running the script:
 * * `dist/scripts/check-database-schema.js --check` to check that your
 *   `cord.sql` file is equivalent to the sum of all migrations, which now
 *   includes the single new migration instead of the many old ones
 * * `npm run migrate` to run the new migration against your local database
 * * `dist/scripts/check-database-schema.js --checkDatabase` to check that your
 *   local database conforms with the `cord.sql` file
 * * repeat the last two steps (`npm run migrate` should exit without applying
 *   any migrations)
 * * run the following queries against your local database - this wipes the all
 *   your local data:
 *   * `DROP SCHEMA IF EXISTS cord CASCADE;`
 *   * `DROP TABLE public."SequelizeMeta";`
 * * `npm run migrate` to run *all* migrations against your now empty database
 * * `dist/scripts/check-database-schema.js --checkDatabase` to check that your
 *   local database conforms with the `cord.sql` file
 * * repeat the last two steps (`npm run migrate` should exit without applying
 *   any migrations)
 */

import * as child_process from 'child_process';
import { promises as fs } from 'fs';

import 'dotenv/config.js';
import pg from 'pg';
import prettier from 'prettier';
import yargs from 'yargs';

import { runSequelizeMigrate } from 'database/tooling/migra.ts';
import { withTemporaryDatabase } from 'database/tooling/utils.ts';

async function main() {
  const { to: toMigration } = yargs(process.argv.slice(2))
    .option('to', {
      type: 'string',
      demandOption: true,
      description:
        'name of the migration up to which you want combine migrations ' +
        'together. This is a migration file name without the ' +
        'database/migrations/ prefix but with the .js extension.',
    })
    .help().argv;

  await fs.access(`database/migrations/${toMigration}`);

  await withTemporaryDatabase(async (database, clientConfig, env) => {
    await runSequelizeMigrate(database, '--to', toMigration);

    const client = new pg.Client(clientConfig);
    await client.connect();

    let migrationNames: string[];
    try {
      // Let's get the names of all the migrations that Sequelize has applied
      migrationNames = (
        await client.query<{ name: string }>(
          'SELECT name FROM public."SequelizeMeta" ORDER BY name;',
        )
      ).rows.map(({ name }) => name);
    } finally {
      await client.end();
    }

    if (!migrationNames.length) {
      throw new Error('No migrations!');
    }

    const match = /^\d+/.exec(toMigration);
    if (!match) {
      throw new Error(`Migration name must begin with a number`);
    }
    const newMigrationPath = `database/migrations/${
      BigInt(match[0]) + BigInt(1)
    }-cord-schema.cjs`;

    const dump = await spawn(
      'pg_dump',
      [
        '--no-owner',
        '--no-acl',
        '--schema=cord',
        '--inserts',
        '--rows-per-insert=100',
      ],
      env,
    );

    const migration = `'use strict';
    
    module.exports = {
        up: ({ sequelize }) => sequelize.transaction(
            { isolationLevel: 'SERIALIZABLE' },
            async (transaction) => {
                const names = new Set((await sequelize.query(
                    'SELECT name FROM public."SequelizeMeta";',
                    { type: 'SELECT', transaction },
                )).map(({ name }) => name));

                if (originalMigrationNames.every(n => !names.has(n))) {
                    // No original migrations have been applied
                    await sequelize.query(dump + setup, { transaction });
                } else if (originalMigrationNames.every(n => names.has(n))) {
                    // All original migrations have been applied before
                    await sequelize.query(
                        'DELETE FROM public."SequelizeMeta" WHERE name=ANY($1);',
                        { bind: [originalMigrationNames], transaction }
                    );
                } else {
                    throw new Error('Some but not all original migrations have been applied');
                }
            },
        ),
        down: ({ sequelize }) =>
            sequelize.query(\`
                DROP SCHEMA IF EXISTS "cord" CASCADE;
                DROP FUNCTION IF EXISTS public.gen_random_uuid();
            \`),
    };

    const originalMigrationNames = ${JSON.stringify(migrationNames)};

    const dump = ${multiLineStringLiteral(removeCommentsAndBlankLines(dump))};
    const setup = ${multiLineStringLiteral(setup)};
    `;

    const formattedMigration = await prettier.format(migration, {
      filepath: newMigrationPath,
      ...(await prettier.resolveConfig(newMigrationPath)),
    });

    for (const name of migrationNames) {
      await fs.unlink(`database/migrations/${name}`);
    }
    await fs.writeFile(newMigrationPath, formattedMigration);
  });
}

const setup = `
CREATE OR REPLACE FUNCTION public.gen_random_uuid()
RETURNS uuid AS 'SELECT uuid_generate_v4();' LANGUAGE SQL;

SET search_path = cord, public;`;

function spawn(
  command: string,
  args: string[],
  env: typeof process.env,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const proc = child_process.spawn(command, args, {
      stdio: ['ignore', 'pipe', 'inherit'],
      env,
    });
    let stdout = '';

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Child process exited with status ${code}`));
      }
    });
    proc.stdout.on('data', (data) => {
      stdout += data;
    });
  });
}

function multiLineStringLiteral(s: string) {
  return `\`${s
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')}\``;
}

function removeCommentsAndBlankLines(sql: string) {
  sql = sql.replace(
    /("(""|[^"])*")|('(''|[^'])*')|(--[^\n]*\n*)|(\n\n+)/gm,
    (match) => {
      if (
        (match[0] === '"' && match[match.length - 1] === '"') ||
        (match[0] === "'" && match[match.length - 1] === "'")
      ) {
        return match;
      } else if (match[0] === '\n') {
        return '\n';
      } else if (match.startsWith('--')) {
        return '';
      } else {
        throw new Error('Logic error');
      }
    },
  );

  return sql;
}

main().then(
  () => {
    process.exit(0);
  },
  (err) => {
    console.error('\n');
    console.error(err);
    process.exit(1);
  },
);
