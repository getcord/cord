// This function connects to the radical database (the same as Sequelize
// connects to) and streams a partial dump of it to the given WritableStream.
// The stream contains all the SQL commands to create the Cord tables, indexes,
// types, functions etc., and then loads data into those tables. The data is
// partial in the sense that the `orgs` table will only contain one entry: our
// own org (as defined by `RADICAL_ORG_ID`). All the other tables will contain
// only those rows that do not reference an org other than ours in any way.
//
// Typical use:
// ```
// # curl --header "Authorization: TOKEN" \
//       https://admin.cord.com/partial-database-dump >dump.sql
// # psql -f dump.sql radical_db_local
// ```
// (`TOKEN` needs to be replaced with the authorization token of a logged-in
// admin user. You can copy and paste it from the sidebar: go to the Hacks
// panel and copy all contents of the 'Authorization Header' field, beginning
// with and including "Bearer".)
//
// The above assumes that:
// * you have a local database server, which has a database called
//   `radical_db_local` on it
// * you are ready to wipe all the data that is currently stored in
//   `radical_db_local`
//
// What it does:
// * the first command contacts admin.api.cord which runs this function, and
//   the output is saved locally into a file called `dump.sql`
// * the second command starts the PostgreSQL command line client, asks it to
//   connect to your database `radical_db_local` and execute all the statements
//   in `dump.sql` in it. This will wipe all the contents of `radical_db_local`
//   (well, of the `cord` schema), and then recreates all the tables, types,
//   functions etc., loads data into the tables, and then finalises the database
//   schema (creates indexes, sets up constraints etc.)
//
// What you have afterwards:
// The `radical_db_local` database will have a `cord` schema that will have
// exactly the same structure as the production database. In terms of database
// migration, it is in an identical state to the production database. It also
// has a subset of data, namely all data that does not reference in any way
// an org other than our own (as defined as RADICAL_ORG_ID in common/const/Ids).
//
// BE CAREFUL!!!
// Make sure you never execute `dump.sql` in the production database, as it
// would also wipe all data and then only recreate the data belonging to our
// org.
//
// When you run this script, it connects to the database  and immediately
// begins a read-only transaction, thus making sure that it does not make any
// changes whatsoever to the database it is connected to. The transaction is
// configured such that it operates on a snapshot of the database, and it does
// not interfere at all with the production traffic (i.e. it will never block
// any other database connection). As a result, the dump created contains a
// consistent set of data.
//
// The output of this function is a SQL text file, i.e. a file containing a
// series of (very many) SQL statements. Feel free to inspect the file. Again:
// executing this file in a database means first wiping all Cord tables, before
// recreating them and loading some data into them.
//
// While you should never execute the created dump on the prod db, it is very
// safe to execute it on your local database: the whole file is also
// encapsulated in a transaction. Meaning that, if any of the statements fails,
// all changes to your local database (including the wipe at the beginning) are
// rolled back. So, if replaying the dump fails, you keep your existing
// database.
//
// Q & A
//
// Q: do I need to modify this file if I make changes to our database schema
// (like a database migration)?
// A: you shouldn't need to. This code in this file is very smart at inspecting
// the database it connects to, so if you create a new table, it will also
// include that in future runs. If, however, you want to exclude your table
// from being included in the dumps this file creates, you will have to add the
// name of the table in the `additionalConstraints` object defined below in the
// code.  If you give it a value of `false`, no data will be loaded for the
// given table. Alternatively, you can load _some_ data by specifying a
// constraint (like in a WHERE clause). For example, we don't copy all the data
// from the very big `events` table, but only the last 3 days of data (as per
// the `serverTimestamp` column). If you want similar treatment of your new
// table, add a constraint there.
//
// Q: is there anything at all I need to keep in mind when I write database
// migrations, with regards to these partial database dumps?
// A: always declare your foreign key relationships! There are many reasons to
// do this, and this file adds one more. The code in here inspects declared
// foreign key relationships to figure out what data belongs to orgs other than
// our own org. If you don't declare foreign keys, this script might include
// data it shouldn't.
//
// Q: I'm working on something that includes a database migration. During
// development, I applied my new migration, but I have changed it since. I
// forgot to run `npm run migrate-down` before I made changes, so I'm not even
// quite sure what exact state my database is in. Anyway, I'd quite like to
// get back to a known state, from which I can apply my migration again. Can
// a partial database dump from this code help me?
// A: yeah sure, just run the procedure described at the top. Bootstrapping your
// local database from prod means that you have the exact same database schema
// that prod has right now. That won't have your migration in it at all. So
// you can just run `npm run migrate` afterwards to have your work-in-progress
// migratation applied.
//
// Q: when bootstrapping my local database from prod, will my local database
// look like the one in prod, or like the `migrations` folder of my local
// checkout.
// A: strictly the former. This code gets all information from the database it
// connects to, and no information from checked-in database migrations or your
// local checkout.

import * as child_process from 'child_process';
import Pg from 'pg';
import { to as copyTo } from 'pg-copy-streams';

import {
  CORD_CUSTOMER_ID,
  CORD_PLATFORM_ORG_ID,
  CORD_SDK_TEST_ORG_ID,
  RADICAL_ORG_ID,
  RADICAL_TEST_ORG_ID,
} from 'common/const/Ids.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import type { DatabaseConfig } from 'server/src/util/readReplicaDatabase.ts';

const { escapeLiteral, escapeIdentifier } = Pg.Client.prototype;

// Add ids of orgs here that you want to have included in the partial dumps.
const includedOrgIDs = [
  RADICAL_ORG_ID,
  RADICAL_TEST_ORG_ID,
  CORD_PLATFORM_ORG_ID,
  CORD_SDK_TEST_ORG_ID,
  '084f65aa-5de9-48af-a297-32a17c7fd6f4', // clack_all (public channels),
  '644c0620-4799-4469-a202-eb092f76181b', // clack_utility_users (users needed for Clack to work)
];
const orgIDsLiteral = `(${includedOrgIDs.map(escapeLiteral).join(',')})`;

// Additional constraints.
// Some tables are very big and the data in them not very important. Let's
// get _some_ data, but not all.
// If a table is set to `false`, no data is copied at all.
const additionalConstraints: Record<
  string,
  ((alias: string) => string) | false | undefined
> = {
  // This script was written pre-SDK and so uses the org as the basis of what
  // information to include, "down" from there. Since the application is "above"
  // that in the heirarchy, we should quickly limit ourselves to just our own
  // customer ID. Someday we should rewrite this script to go "down" from
  // certain app IDs, but this is good enough for now.
  applications: (alias) => `${alias}."customerID" = '${CORD_CUSTOMER_ID}'`,
  console_users: (alias) => `${alias}."customerID" = '${CORD_CUSTOMER_ID}'`,

  // The `users` table does not contain a foreign key. What we want is include
  // only those users that are referenced by a profile in the org_members table
  // in our org.
  users: (alias) =>
    `${alias}.id IN (
      SELECT DISTINCT "userID" FROM "org_members"
      WHERE "orgID" IN ${orgIDsLiteral}
    )`,

  // Contains customer secrets for their s3_buckets, don't include
  s3_buckets: false,

  // Big tables that we don't need.
  events: false,
  application_usage_metrics: false,
  sessions: false,
};

export function streamPartialDump(
  output: NodeJS.WritableStream,
  dbconfig: DatabaseConfig,
) {
  return beginDump(dbconfig, output, (pg) => streamPartialDumpImpl(output, pg));
}

export async function beginDump<T>(
  dbconfig: DatabaseConfig,
  output: NodeJS.WritableStream,
  func: (pg: Pg.Client) => Promise<T>,
) {
  // Connect to the database
  const pg = new Pg.Client(dbconfig);
  await pg.connect();

  try {
    // This is the process environment we pass to the `pg_dump` command line tool.
    const psqlClientEnv = {
      ...process.env,
      PGDATABASE: dbconfig.database,
      PGHOST: dbconfig.host,
      PGPORT: dbconfig.port?.toString(),
      PGUSER: dbconfig.user,
      PGPASSWORD: dbconfig.password,
    };

    // Make sure all commands see the contents of both the `cord` and the `public`
    // schema
    await pg.query('SET search_path=cord,public;');

    // Start a read-only transaction. The specific type of transaction is one
    // suited for long-running backup operations, like this one.
    // From `https://www.postgresql.org/docs/12/sql-set-transaction.html`:
    // > The DEFERRABLE transaction property has no effect unless the transaction
    // > is also SERIALIZABLE and READ ONLY. When all three of these properties
    // > are selected for a transaction, the transaction may block when first
    // > acquiring its snapshot, after which it is able to run without the normal
    // > overhead of a SERIALIZABLE transaction and without any risk of
    // > contributing to or being canceled by a serialization failure. This mode
    // > is well suited for long-running reports or backups.
    //
    // If we are configured to hit a read-only Aurora replica, it will not let us
    // use SERIALIZABLE transactions. Being connected to a read-only endpoint, we
    // don't need to worry about serialization failures, so a REPEATABLE READ
    // transaction is fine.
    await pg
      .query(
        'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE;',
      )
      .catch((error) => {
        if (
          error.toString() ===
          'error: cannot use serializable mode in a hot standby'
        ) {
          return pg.query(
            'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;',
          );
        } else {
          return Promise.reject(error);
        }
      });

    // Get the id of the snapshot we're working on, so we can pass it to pg_dump
    // below. This means that pg_dump will work like if it was executed within
    // this transaction. So its output will be guaranteed to be perfectly
    // consistent with all the data we extract from the database.
    const snapshotId = (await pg.query('SELECT pg_export_snapshot() AS id;'))
      .rows[0].id;

    // First start a transaction.
    let preData = 'BEGIN;\n\n';
    // Remove the whole `cord` schema, if it exists. This will wipe all Cord
    // tables, types, functions etc. and all Cord data from the database in which
    // this file will be executed.
    preData += 'DROP SCHEMA IF EXISTS cord CASCADE;\n';

    // This gets us all the Postgresql statements to create tables, functions,
    // data types etc. Everything we need to have before we can insert data.
    preData += await spawn(
      'pg_dump',
      [
        `--snapshot=${snapshotId}`,
        '--section=pre-data',
        '--no-owner',
        '--no-acl',
        '--schema=cord',
      ],
      psqlClientEnv,
    );

    // This gets us all the Postgresql statements to create indexes, add
    // constraints on tables etc. Everything we need to do to have the complete
    // database schema. Inserting data is easier before this has happened, so
    // that's why we have separate preData and postData parts of the database
    // schema.
    let postData = await spawn(
      'pg_dump',
      [
        `--snapshot=${snapshotId}`,
        '--section=post-data',
        '--no-owner',
        '--no-acl',
        '--schema=cord',
      ],
      psqlClientEnv,
    );

    // Make sure, the rest of the SQL file will look for tables in both `cord`
    // and `public` schemas.
    preData += '\nSET search_path = cord, public;\n';

    // SequelizeMeta table
    // * create the table if it doesn't exist
    // * remove all rows from it
    // * copy over all rows from the source database
    preData += `
      CREATE TABLE IF NOT EXISTS public."SequelizeMeta" (
          name character varying(255) NOT NULL
      );
      TRUNCATE public."SequelizeMeta";`;

    const migrationNames = (
      await pg.query('SELECT name FROM public."SequelizeMeta" ORDER BY name;')
    ).rows.map((row) => row.name);
    if (migrationNames.length) {
      preData += `
      INSERT INTO public."SequelizeMeta" (name) VALUES ${migrationNames
        .map((name) => `(${pg.escapeLiteral(name)})`)
        .join(', ')};\n\n`;
    }

    // Just one more thing: in `migrations/20201019134849-pg-boss.js` we created
    // one function in the "public" schema (`gen_random_uuid`). It is used by
    // pgboss, and normally it would come from the `pgcrypto` extension. By
    // providing this shim function, we got rid of the dependence on
    // `pgcrypto`.  Our database schema dump only included the `cord` schema,
    // so we still have to add that one function.
    preData += `CREATE OR REPLACE FUNCTION public.gen_random_uuid()
                RETURNS uuid AS 'SELECT uuid_generate_v4();' LANGUAGE SQL;\n\n`;

    // If all of the above executed without an error, commit everything to the
    // database!
    postData += '\n\nCOMMIT;\n';

    output.write(preData);
    const result = await func(pg);
    output.write(postData);

    return result;
  } finally {
    pg.end().catch(
      anonymousLogger().exceptionLogger('pg.end() threw exception'),
    );
  }
}

async function streamPartialDumpImpl(
  output: NodeJS.WritableStream,
  pg: Pg.Client,
) {
  // Get a list of tables in the cord schema. The `tables` map will contain
  // values with fields `oid` (numerical identifier of the table), `name`,
  // `columns` (list of column name strings). We also put an empty list of
  // foreign keys in those objects (`fkeys`), which we will populate in the next
  // step. And we copy over the `additionalConstraint` if there is one defined
  // for this table at the top of this file.
  const tables = new Map<number, Table>();
  for (const row of (
    await pg.query(`
      WITH "attributes" AS (
          SELECT
              attrelid,
              jsonb_agg(attname::text ORDER BY attnum) AS attributes
          FROM pg_catalog.pg_attribute
          WHERE attnum >= 1
          AND NOT attisdropped
          AND attgenerated != 's'
          GROUP BY attrelid
      )
      SELECT
          cls.oid::int4 AS oid,
          cls.relname AS name,
          COALESCE(attributes.attributes, '[]'::jsonb) AS columns
      FROM pg_catalog.pg_class cls
      LEFT OUTER JOIN attributes ON cls.oid = attributes.attrelid
      WHERE relnamespace='cord'::regnamespace AND relkind='r';`)
  ).rows) {
    tables.set(row.oid, {
      ...row,
      fkeys: [],
      additionalConstraint: additionalConstraints[row.name] ?? null,
    });
  }

  // Get all foreign keys. For each declared foreign key relationship, we add
  // one `ForeignKey` object to the `Table.fkeys` array, which contains the
  // referenced table, the names of the columns containing the foreign key
  // fields in this table, the corresponding column names in the referenced
  // table, and also the comparison
  // operator (typically `=`).
  for (const row of (
    await pg.query(`
      SELECT
          conrelid AS "tableOid",
          confrelid AS "referencedTableOid",
          array_to_json(ARRAY(
              SELECT jsonb_build_object(
                  'column', att.attname::text,
                  'nullable', NOT att.attnotnull
                )
              FROM unnest(conkey) k
              LEFT OUTER JOIN pg_catalog.pg_attribute att
              ON att.attnum=k AND att.attrelid=conrelid
          )) AS fkey,
          ARRAY(
              SELECT att.attname::text
              FROM unnest(confkey) k
              LEFT OUTER JOIN pg_catalog.pg_attribute att
              ON att.attnum=k AND att.attrelid=confrelid
          ) AS rkey,
          ARRAY(
              SELECT opr.oprname::text
              FROM unnest(conpfeqop) k
              LEFT OUTER JOIN pg_catalog.pg_operator opr ON opr.oid=k
          ) AS ops
          FROM pg_catalog.pg_constraint WHERE contype='f';`)
  ).rows) {
    const table = tables.get(row.tableOid);
    const referencedTable = tables.get(row.referencedTableOid);
    if (table && referencedTable) {
      const keys = (
        row.fkey as Array<{
          column: string;
          nullable: boolean;
        }>
      ).map(({ column, nullable }, idx) => ({
        column,
        nullable,
        referencedColumn: row.rkey[idx] as string,
        operator: row.ops[idx] as string,
      }));
      if (keys.length) {
        const nullable =
          keys.some(({ nullable: keyIsNullable }) => keyIsNullable) &&
          // HACK: the notifications table has complex checks that this script
          // doesn't understand to know what rows to pull. However, those checks
          // more-or-less have the property that if an fkey column is non-null,
          // it needs to remain non-null, so we can just treat all of the notif
          // table's fkeys as non-nullable.
          table.name !== 'notifications';

        table.fkeys.push({
          referencedTable,
          nullable,
          keys,
        });
      }
    }
  }

  // Now copy the table data!
  for (const table of tables.values()) {
    await dumpTable(output, pg, table);
  }

  // We don't need the database anymore. Close the transaction.
  await pg.query('ROLLBACK');

  // When foreign key columns are nullable, we don't restrict the rows of a
  // table to those that reference rows that are also copied. Instead we now set
  // those columns to NULL for rows that reference foreign rows we did not copy.
  for (const table of tables.values()) {
    for (const fkey of table.fkeys) {
      if (fkey.nullable) {
        output.write(
          `\\echo Fixing dangling foreign keys in ${table.name} (${fkey.keys
            .map(({ column }) => column)
            .join(', ')})\n`,
        );
        output.write(`UPDATE ${escapeIdentifier(table.name)} AS _t SET `);
        output.write(
          fkey.keys
            .filter(({ nullable }) => nullable)
            .map(({ column }) => `${escapeIdentifier(column)}=NULL`)
            .join(', '),
        );
        output.write(` WHERE NOT (${foreignKeyNullCheck('_t', fkey.keys)})`);
        output.write(
          ` AND (${fkey.keys
            .map(({ column }) => `_t.${escapeIdentifier(column)}`)
            .join(', ')}) NOT IN (SELECT ${fkey.keys
            .map(({ referencedColumn }) => escapeIdentifier(referencedColumn))
            .join(', ')} FROM ${escapeIdentifier(
            fkey.referencedTable.name,
          )});\n`,
        );
      }
    }
  }

  // Our work is done.
}

type Table = {
  oid: number;
  name: string;
  columns: string[];
  fkeys: ForeignKey[];
  additionalConstraint: ((alias: string) => string) | false | null;
};
type ForeignKey = {
  referencedTable: Table;
  keys: ForeignKeyColumn[];
  nullable: boolean;
};
type ForeignKeyColumn = {
  column: string;
  nullable: boolean;
  referencedColumn: string;
  operator: string;
};

let serial = 0;
async function dumpTable(
  output: NodeJS.WritableStream,
  pg: Pg.Client,
  table: Table,
) {
  const alias = `t_${serial++}`;
  const { joins, where } = resolveForeignKeys(table, alias, []);

  const query = `SELECT
     ${table.columns.map((n) => `${alias}.${escapeIdentifier(n)}`).join(', ')}
     FROM ${escapeIdentifier(table.name)} ${alias}
     ${joins.join('\n')}
     ${where ? 'WHERE ' : ''}${where}`;

  output.write(
    `\\echo Loading data into table ${table.name}...
-- ${query.replace(/\n/g, '\n-- ')};
     \n\nCOPY ${escapeIdentifier(table.name)} (${table.columns
       .map(escapeIdentifier)
       .join(', ')}) FROM stdin;\n`,
  );

  await dumpData(pg, query, output);

  output.write('\\.\n\n\n');
}

function resolveForeignKeys(
  table: Table,
  alias: string,
  visitedTables: Table[],
): { joins: string[]; where: string } {
  if (table.additionalConstraint === false) {
    return { joins: [], where: 'FALSE' };
  }

  if (table.name === 'orgs') {
    const where = `${alias}.id IN ${orgIDsLiteral}`;
    return { joins: [], where };
  }

  if (visitedTables.includes(table)) {
    console.warn(
      `Foreign keys self-join: ${visitedTables
        .map((t) => t.name)
        .join(', ')} => ${table.name}`,
    );
    return { where: '', joins: [] };
  }
  visitedTables = [...visitedTables, table];

  const where: string[] = [];
  const joins: string[] = [];

  if (table.additionalConstraint) {
    // The user activity table is very big. As an additional condition, only
    // copy over rows from the last 14 days.
    where.push(`(${table.additionalConstraint(alias)})`);
  }

  for (const { referencedTable, keys } of table.fkeys.filter(
    ({ nullable }) => !nullable,
  )) {
    if (
      referencedTable.name === 'orgs' &&
      keys.length === 1 &&
      keys[0].referencedColumn === 'id'
    ) {
      // If the foreign key references `orgs.id`, we don't have to do the join
      // at all, we can check the foreign key itself.
      where.push(
        `(
          ${alias}.${escapeIdentifier(keys[0].column)} IS NULL OR
          ${alias}.${escapeIdentifier(keys[0].column)} IN ${orgIDsLiteral})`,
      );
    } else if (referencedTable.additionalConstraint !== false) {
      const referencedAlias = `j_${serial++}`;
      const { where: fwhere, joins: fjoins } = resolveForeignKeys(
        referencedTable,
        referencedAlias,
        visitedTables,
      );
      if (fwhere) {
        joins.push(`LEFT OUTER JOIN ${escapeIdentifier(
          referencedTable.name,
        )} ${referencedAlias}
    ON (${keys
      .map(
        ({ column, referencedColumn, operator }) =>
          `${alias}.${escapeIdentifier(
            column,
          )} ${operator} ${referencedAlias}.${escapeIdentifier(
            referencedColumn,
          )}`,
      )
      .join(' AND ')})`);
        joins.push(...fjoins);

        where.push(`(${foreignKeyNullCheck(alias, keys)} OR (${fwhere}))`);
      }
    } else {
      where.push(foreignKeyNullCheck(alias, keys));
    }
  }

  return { where: where.join(' AND '), joins };
}

function foreignKeyNullCheck(alias: string, keys: ForeignKeyColumn[]) {
  return keys.length === 0
    ? 'FALSE'
    : keys.length === 1
    ? `${alias}.${escapeIdentifier(keys[0].column)} IS NULL`
    : 'num_nulls(' +
      keys
        .map(({ column }) => `${alias}.${escapeIdentifier(column)}`)
        .join(', ') +
      ') > 0';
}

function dumpData(pg: Pg.Client, query: string, output: NodeJS.WritableStream) {
  return new Promise<void>((resolve, reject) => {
    const stream = pg.query(copyTo(`COPY (${query}) TO STDOUT;`));
    //stream.pipe(output);
    stream.on('end', resolve);
    stream.on('error', reject);
    stream.on('data', (chunk) => output.write(chunk));
  });
}

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
