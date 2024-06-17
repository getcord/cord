#!/usr/bin/env -S node --enable-source-maps

/**
 * Create dumps of minimal data to get a usable server
 *
 * This script connects to the database configure in the .env file and creates a
 * dump of the full schema, as well as some minimal amount of data. Just enough
 * to have a usable server. This is used for the pr-server (the pull request
 * server, i.e. the server for deploying pull requests to prXXX.dev.cord.com).
 */

import 'dotenv/config.js';
import type * as Pg from 'pg';

import env from 'server/src/config/Env.ts';
import { beginDump } from 'server/src/admin/databaseDump/index.ts';
import { getReadReplicaDbConfigFromEnv } from 'server/src/util/readReplicaDatabase.ts';
import {
  CORD_APPLICATION_ID,
  CORD_CUSTOMER_ID,
  CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
  CORD_SAMPLE_TOKEN_CUSTOMER_ID,
  CORD_SDK_TEST_APPLICATION_ID,
  RADICAL_ORG_ID,
} from 'common/const/Ids.ts';

async function main() {
  const output = process.stdout;
  await beginDump(getReadReplicaDbConfigFromEnv(env), output, async (pg) => {
    await copyRows(
      pg,
      output,
      'orgs',
      `SELECT *
         FROM orgs
         WHERE id=$1;`,
      [RADICAL_ORG_ID],
    );
    await copyRows(
      pg,
      output,
      'users',
      `SELECT u.*
         FROM users u
         INNER JOIN org_members om ON om."userID"=u.id AND om."orgID"=$1
         WHERE u.admin AND u.state='active';`,
      [RADICAL_ORG_ID],
    );
    await copyRows(
      pg,
      output,
      'org_members',
      `SELECT om.*
         FROM users u
         INNER JOIN org_members om ON om."userID"=u.id AND om."orgID"=$1
         WHERE u.admin AND u.state='active';`,
      [RADICAL_ORG_ID],
    );
    await copyRows(
      pg,
      output,
      'customers',
      `SELECT c.*
         FROM customers c
         WHERE c.id=ANY($1);`,
      [[CORD_CUSTOMER_ID, CORD_SAMPLE_TOKEN_CUSTOMER_ID]],
    );
    await copyRows(
      pg,
      output,
      'applications',
      `SELECT a.*
         FROM applications a
         WHERE a.id=ANY($1);`,
      [
        [
          CORD_APPLICATION_ID,
          CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
          CORD_SDK_TEST_APPLICATION_ID,
        ],
      ],
    );

    for (const tableName of [
      'providers',
      'provider_rules',
      'provider_document_mutators',
      'provider_rule_tests',
    ]) {
      await copyRows(
        pg,
        output,
        tableName,
        `SELECT * FROM ${pg.escapeIdentifier(tableName)};`,
        [],
      );
    }

    output.write('UPDATE providers SET "claimingApplication"=NULL;\n');
    output.write(
      'UPDATE applications SET "supportBotID"=NULL, "supportOrgID"=NULL;\n',
    );
  });
}

const returnAllTypesAsStrings: Pg.CustomTypesConfig = {
  getTypeParser: () => (x: string | Buffer) => x,
};

async function copyRows(
  pg: Pg.Client,
  output: NodeJS.WritableStream,
  tableName: string,
  query: string,
  values: any[],
) {
  const result = await pg.query({
    text: query,
    values,
    rowMode: 'array',
    types: returnAllTypesAsStrings,
  });

  if (result.rows.length > 0) {
    output.write(
      `INSERT INTO ${tableName} (${result.fields
        .map((field) => pg.escapeIdentifier(field.name))
        .join(', ')}) VALUES\n${result.rows
        .map(
          (row) =>
            `(${row
              .map((value) =>
                value === null ? 'NULL' : pg.escapeLiteral(value),
              )
              .join(', ')})`,
        )
        .join(',\n')};\n`,
    );
  }
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
