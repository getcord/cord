import * as child_process from 'child_process';

import type { ClientConfig } from 'pg';
import { v4 as uuid } from 'uuid';

export function makePgEnv(override: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const { PGDATABASE: _, ...env } = process.env;

  return {
    ...env,
    PGHOST: process.env.POSTGRES_HOST,
    PGPORT: process.env.POSTGRES_PORT,
    PGUSER: process.env.POSTGRES_USER,
    PGPASSWORD: process.env.POSTGRES_PASSWORD,
    ...override,
  };
}

export async function executeSqlFile(sqlFilename: string, database: string) {
  await run(
    'psql',
    [
      '--echo-errors',
      '--set=ON_ERROR_STOP=t',
      '--single-transaction',
      '--file',
      sqlFilename,
      database,
    ],
    { env: makePgEnv() },
  );
}

export async function withTemporaryDatabase<T>(
  callback: (
    database: string,
    clientConfig: ClientConfig,
    env: NodeJS.ProcessEnv,
  ) => Promise<T>,
): Promise<T> {
  const env = makePgEnv();
  const dbname = `temp-${uuid()}`;
  console.log(`Creating temporary database: ${dbname}`);

  await run('createdb', ['--template=template_radical_db', dbname], { env });
  const clientConfig: ClientConfig = {
    user: env.PGUSER,
    password: env.PGPASSWORD,
    host: env.PGHOST,
    port: Number(env.PGPORT) || undefined,
    database: dbname,
  };

  try {
    return await callback(dbname, clientConfig, { ...env, PGDATABASE: dbname });
  } finally {
    console.log(`Destroying temporary database: ${dbname}`);
    await run('dropdb', ['--if-exists', dbname], { env });
  }
}

export function run(
  cmd: string,
  args: string[],
  env?: child_process.ExecFileOptions,
) {
  return new Promise<string>((resolve, reject) => {
    child_process.execFile(cmd, args, env ?? {}, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
