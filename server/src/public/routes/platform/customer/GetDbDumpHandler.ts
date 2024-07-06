import type { Request, Response } from 'express';
import Pg from 'pg';
import { to as copyTo } from 'pg-copy-streams';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import type { DatabaseConfig } from 'server/src/util/readReplicaDatabase.ts';
import env from 'server/src/config/Env.ts';
import { getReadReplicaDbConfigFromEnv } from 'server/src/util/readReplicaDatabase.ts';

async function GetDbDumpHandler(req: Request, res: Response) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_access_token');
  }

  res.statusCode = 200;
  res.setHeader('Content-type', 'text/plain');

  try {
    await streamPartialDump(
      res,
      getReadReplicaDbConfigFromEnv(env),
      customerID,
    );
  } catch (err) {
    res.send(`\n\n-- ${err}\n`);
  }
  res.end();
}

// *****************************************************************************
// The code below here is copied from server/src/admin/databaseDump/index.ts and
// then unceremoniously hacked up to produce a version that dumps data we care
// about by customer.  If you want a principled and maintainable database dump,
// go look over there.
// *****************************************************************************

const { escapeIdentifier } = Pg.Client.prototype;

const tableHandling: Record<
  string,
  ((alias: string) => string) | 'ignore' | undefined
> = {
  console_users: (alias) =>
    `${alias}."customerID" IS NOT NULL OR ${alias}."pendingCustomerID" IS NOT NULL`,
  users: (alias) => `${alias}."platformApplicationID" IS NOT NULL`,
  orgs: (alias) => `${alias}."platformApplicationID" IS NOT NULL`,

  // Contains customer secrets for their s3_buckets, don't include
  s3_buckets: 'ignore',

  // Big tables that we don't need.
  events: 'ignore',
  application_usage_metrics: 'ignore',
  sessions: 'ignore',

  // Tables that are irrelevant for customers
  deploys: 'ignore',
  org_org_members: 'ignore',
  permission_rules: 'ignore',
  admin_go_redirects: 'ignore',
  admin_crt_customer_issues: 'ignore',
  admin_crt_customer_issue_changes: 'ignore',
  admin_crt_customer_issue_subscriptions: 'ignore',
  warm_demo_users: 'ignore',
  external_assets: 'ignore',
  image_variants: 'ignore',
  slack_channels: 'ignore',

  // TODO(flooey): Tables that still need to be handled, because we don't yet
  // export Slack users
  linked_users: 'ignore',
  linked_orgs: 'ignore',
};

const ignoredColumns = ['supportBotID', 'supportOrgID'];

async function streamPartialDump(
  output: NodeJS.WritableStream,
  dbconfig: DatabaseConfig,
  customerID: string,
) {
  // Connect to the database
  const pg = new Pg.Client(dbconfig);
  await pg.connect();

  try {
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

    output.write('BEGIN;\n\n');
    await streamPartialDumpImpl(output, pg, customerID);
    output.write('\n\nCOMMIT;\n');
  } finally {
    pg.end().catch(
      anonymousLogger().exceptionLogger('pg.end() threw exception'),
    );
  }
}

async function streamPartialDumpImpl(
  output: NodeJS.WritableStream,
  pg: Pg.Client,
  customerID: string,
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
      handling: tableHandling[row.name] ?? null,
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
      )
        .map(({ column, nullable }, idx) => ({
          column,
          nullable,
          referencedColumn: row.rkey[idx] as string,
          operator: row.ops[idx] as string,
        }))
        .filter(({ column }) => !ignoredColumns.includes(column));
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
    await dumpTable(output, pg, table, customerID);
  }

  // We don't need the database anymore. Close the transaction.
  await pg.query('ROLLBACK');

  // When foreign key columns are nullable, we don't restrict the rows of a
  // table to those that reference rows that are also copied. Instead we now set
  // those columns to NULL for rows that reference foreign rows we did not copy.
  for (const table of tables.values()) {
    if (table.handling === 'ignore') {
      continue;
    }
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
  handling: ((alias: string) => string) | 'ignore' | null;
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

let serial = 1337;
async function dumpTable(
  output: NodeJS.WritableStream,
  pg: Pg.Client,
  table: Table,
  customerID: string,
) {
  const alias = `t_${serial++}`;
  const foreignKeys = resolveForeignKeys(table, customerID, alias, []);
  if (!foreignKeys) {
    return;
  }
  const { joins, where } = foreignKeys;

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
  customerID: string,
  alias: string,
  visitedTables: Table[],
): { joins: string[]; where: string } | undefined {
  if (table.handling === 'ignore') {
    return undefined;
  }

  if (table.name === 'customers') {
    const where = `${alias}.id = '${customerID}'`;
    return { joins: [], where };
  }

  if (visitedTables.includes(table)) {
    anonymousLogger().warn(
      `Foreign keys self-join: ${visitedTables
        .map((t) => t.name)
        .join(', ')} => ${table.name}`,
    );
    return { where: '', joins: [] };
  }
  visitedTables = [...visitedTables, table];

  const where: string[] = [];
  const joins: string[] = [];

  if (table.handling) {
    where.push(`(${table.handling(alias)})`);
  }

  for (const { referencedTable, keys } of table.fkeys) {
    if (
      referencedTable.name === 'customers' &&
      keys.length === 1 &&
      keys[0].referencedColumn === 'id'
    ) {
      // If the foreign key references `customers.id`, we don't have to do the
      // join at all, we can check the foreign key itself.
      if (keys[0].nullable) {
        where.push(
          `(
            ${alias}.${escapeIdentifier(keys[0].column)} IS NULL OR
            ${alias}.${escapeIdentifier(keys[0].column)} = '${customerID}')`,
        );
      } else {
        where.push(
          `${alias}.${escapeIdentifier(keys[0].column)} = '${customerID}'`,
        );
      }
    } else if (referencedTable.handling !== 'ignore') {
      const referencedAlias = `j_${serial++}`;
      const foreignKeys = resolveForeignKeys(
        referencedTable,
        customerID,
        referencedAlias,
        visitedTables,
      );
      if (!foreignKeys) {
        return undefined;
      }
      const { where: fwhere, joins: fjoins } = foreignKeys;
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

        if (keys.some((k) => k.nullable)) {
          where.push(`(${foreignKeyNullCheck(alias, keys)} OR (${fwhere}))`);
        } else {
          where.push(fwhere);
        }
      }
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

export default forwardHandlerExceptionsToNext(GetDbDumpHandler);
