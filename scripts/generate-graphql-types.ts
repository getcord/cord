#!/usr/bin/env -S node --enable-source-maps

// Usage:
//
// To generate types for apollo resolvers:
// ./build/index.mjs --mode=development --clean --target=scripts/generate-graphql-types.ts && \
// ./dist/scripts/generate-graphql-types.js --types resolvers > output_file.ts
//
// To generate types for graphql operations:
// ./build/index.mjs --mode=development --clean --target=scripts/generate-graphql-types.ts && \
// ./dist/scripts/generate-graphql-types.js --types operations > output_file.ts
//
// TODO: Some types (enums and input types) are shared between operations and
// resolvers file. Not sure if it is worth the effort to generate them out into a
// separate file and import them instead.
import 'dotenv/config.js';
import * as fs from 'fs';

const fsPromises = fs.promises;

import type { DocumentNode } from 'graphql';

import {
  generateClientOperationsTypeFile,
  generateCommonOperationsTypeFile,
  generateServerOperationsTypeFile,
} from 'scripts/graphql_codegen/operationTypes.ts';
import { generateResolversTypeFile } from 'scripts/graphql_codegen/resolverTypes.ts';
import {
  ADMIN_OPERATIONS,
  ADMIN_RESOLVERS,
  CONSOLE_RESOLVERS,
  CONSOLE_OPERATIONS,
  DIRS_WITH_CONSOLE_GQL_OPS,
  DIRS_WITH_ADMIN_GQL_OPS,
  DIRS_WITH_GQL_OPS,
  PUBLIC_OPERATIONS,
  PUBLIC_RESOLVERS,
  readGraphqlFiles,
  PUBLIC_SERVER_OPERATIONS,
  PUBLIC_COMMON_DEFINITIONS,
  ADMIN_COMMON_DEFINITIONS,
  CONSOLE_COMMON_DEFINITIONS,
} from 'scripts/graphql_codegen/common.ts';
import AdminSchema from 'server/src/admin/schema.graphql';
import ConsoleSchema from 'server/src/console/schema.graphql';
import PublicSchema from 'server/src/public/schema.graphql';

async function main() {
  return await Promise.all([
    // If you add new resolvers/operations here, dont forget to update:
    //  scripts/graphql_codegen/tests/staleness.test.ts

    // Public / main schema
    writeResolversFile(PublicSchema, PUBLIC_RESOLVERS),
    writeCommonOperationsFile(
      PublicSchema,
      PUBLIC_COMMON_DEFINITIONS,
      DIRS_WITH_GQL_OPS,
    ),
    writeOperationsFile(
      PublicSchema,
      PUBLIC_OPERATIONS,
      DIRS_WITH_GQL_OPS,
      PUBLIC_COMMON_DEFINITIONS,
    ),
    writeServerOperationsFile(
      PublicSchema,
      PUBLIC_SERVER_OPERATIONS,
      DIRS_WITH_GQL_OPS,
      PUBLIC_COMMON_DEFINITIONS,
    ),

    // Admin tool
    writeResolversFile(AdminSchema, ADMIN_RESOLVERS),
    writeCommonOperationsFile(
      AdminSchema,
      ADMIN_COMMON_DEFINITIONS,
      DIRS_WITH_ADMIN_GQL_OPS,
    ),
    writeOperationsFile(
      AdminSchema,
      ADMIN_OPERATIONS,
      DIRS_WITH_ADMIN_GQL_OPS,
      ADMIN_COMMON_DEFINITIONS,
    ),

    // Console
    writeResolversFile(ConsoleSchema, CONSOLE_RESOLVERS),
    writeCommonOperationsFile(
      ConsoleSchema,
      CONSOLE_COMMON_DEFINITIONS,
      DIRS_WITH_CONSOLE_GQL_OPS,
    ),
    writeOperationsFile(
      ConsoleSchema,
      CONSOLE_OPERATIONS,
      DIRS_WITH_CONSOLE_GQL_OPS,
      CONSOLE_COMMON_DEFINITIONS,
    ),
  ]);
}

async function writeResolversFile(schema: DocumentNode, outputPath: string) {
  const output = await generateResolversTypeFile(schema);
  return await writeAtomically(output, outputPath);
}

async function writeCommonOperationsFile(
  schema: DocumentNode,
  outputPath: string,
  dirsWithOperations: string[],
) {
  const operationFiles = await readGraphqlFiles(dirsWithOperations);
  const output = await generateCommonOperationsTypeFile(schema, operationFiles);
  return await writeAtomically(output, outputPath);
}

async function writeOperationsFile(
  schema: DocumentNode,
  outputPath: string,
  dirsWithOperations: string[],
  definitionsFile: string,
) {
  const operationFiles = await readGraphqlFiles(dirsWithOperations);
  const output = await generateClientOperationsTypeFile(
    schema,
    operationFiles,
    definitionsFile,
  );
  return await writeAtomically(output, outputPath);
}

async function writeServerOperationsFile(
  schema: DocumentNode,
  outputPath: string,
  dirsWithOperations: string[],
  definitionsFile: string,
) {
  const operationFiles = await readGraphqlFiles(dirsWithOperations);
  const output = await generateServerOperationsTypeFile(
    schema,
    operationFiles,
    definitionsFile,
  );
  return await writeAtomically(output, outputPath);
}

async function writeAtomically(text: string, outputPath: string) {
  // Read current contents of output file. Any error reading it (e.g. file does
  // not exist) will set this to `null`.
  const currentFileContents: string | null = await fsPromises
    .readFile(outputPath, {
      encoding: 'utf-8',
    })
    .catch(() => null);
  if (text === currentFileContents) {
    console.log(`No changes to ${outputPath}`);
    // Skip the rest
    return;
  }

  const tempPath = outputPath + '.temp';
  await fsPromises.writeFile(tempPath, text);
  return await fsPromises
    .rename(tempPath, outputPath)
    .then(() => console.log(`Wrote ${outputPath}`));
}

main()
  .then(() => {
    console.log('DONE');
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERROR!', e);
    process.exit(1);
  });
