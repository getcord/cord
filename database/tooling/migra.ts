import * as child_process from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

import { makePgEnv, run } from 'database/tooling/utils.ts';

const venvPath = path.resolve(process.cwd(), 'tmp', 'migra.python-venv');
const venvBinPath = path.resolve(venvPath, 'bin');
const migraPath = path.resolve(venvBinPath, 'migra');

// `env`: this contains the PG* environment variables with the connection
// details for Postgres command line tools. This does *not* include the
// database name, because we do not ever want to connect to the configured
// database in this script. Rather, we will create temporary databases to
// connect to.
const env = makePgEnv();
const venvEnv = makePgEnv({ PATH: `${venvBinPath}:${process.env.PATH}` });

export async function installMigra() {
  if (!(await file_exists(venvPath))) {
    console.log('Creating Python virtualenv for installing migra...');
    await run('python3', ['-m', 'venv', venvPath]);
    await run(
      'pip',
      ['install', '--upgrade', 'pip', 'setuptools', 'wheel', 'packaging'],
      { env: venvEnv },
    );
  }

  if (!(await file_exists(migraPath))) {
    console.log('Installing migra in Python virtualenv...');
    await run('pip', ['install', 'psycopg2-binary', 'migra'], { env: venvEnv });
  }
}

/** Run the migra tool to find schema differences between two PostgreSQL
 *  databases
 *
 * Pass two connection strings (like "postgresql://dbname") to this function!
 * It will return `null` if the two databases have identical structure, or if
 * they don't, it will return a string containing the database statements that
 * can be applied to database A to transform its structure into that of database
 * B.
 *
 * Optional, the name of a PostgreSQL schema can be provided, and then the diff
 * will be produced for that schema only.
 *
 * @param dbA connection string for database A
 * @param dbB connection string for database B
 * @param schema name of database schema for which to produce the diff
 */
export async function migra(
  dbA: string,
  dbB: string,
  ...schemas: string[]
): Promise<string | null> {
  if (schemas.length === 0) {
    return await migraImpl(dbA, dbB);
  }

  const results = (
    await Promise.all(schemas.map((schema) => migraImpl(dbA, dbB, schema)))
  ).filter(Boolean);

  if (results.length === 0) {
    return null;
  } else {
    return results.join('\n\n');
  }
}

function migraImpl(
  dbA: string,
  dbB: string,
  schema?: string | null,
): Promise<string | null> {
  return new Promise<string | null>((resolve, reject) =>
    child_process.execFile(
      migraPath,
      ['--unsafe', ...(schema == null ? [] : ['--schema', schema]), dbA, dbB],
      {
        env: venvEnv,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.code === 2) {
            // migra exits with code 2 if the two schemas differ
            resolve(stdout);
          } else {
            console.error(stderr);
            reject(error);
          }
        } else {
          // migra exits with code 0 if the two schemas are identical
          resolve(null);
        }
      },
    ),
  );
}

export function runSequelizeMigrate(database: string, ...extraArgs: string[]) {
  return run(
    'npx',
    ['sequelize-cli', 'db:migrate', '--env', 'pgenv', ...(extraArgs || [])],
    {
      env: { ...env, PGDATABASE: database },
    },
  );
}

// eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
function file_exists(path: string) {
  return fs.access(path).then(
    () => true,
    () => false,
  );
}
