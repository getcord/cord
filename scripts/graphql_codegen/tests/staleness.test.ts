import 'dotenv/config.js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'graphql';
import type { DocumentNode } from 'graphql';

import {
  ADMIN_OPERATIONS,
  ADMIN_RESOLVERS,
  CONSOLE_OPERATIONS,
  CONSOLE_RESOLVERS,
  DIRS_WITH_ADMIN_GQL_OPS,
  DIRS_WITH_CONSOLE_GQL_OPS,
  DIRS_WITH_GQL_OPS,
  PUBLIC_OPERATIONS,
  PUBLIC_SERVER_OPERATIONS,
  PUBLIC_RESOLVERS,
  readGraphqlFiles,
  PUBLIC_COMMON_DEFINITIONS,
  ADMIN_COMMON_DEFINITIONS,
  CONSOLE_COMMON_DEFINITIONS,
} from 'scripts/graphql_codegen/common.ts';
import {
  generateClientOperationsTypeFile,
  generateCommonOperationsTypeFile,
  generateServerOperationsTypeFile,
} from 'scripts/graphql_codegen/operationTypes.ts';
import { generateResolversTypeFile } from 'scripts/graphql_codegen/resolverTypes.ts';

const fsPromises = fs.promises;

let PublicSchema: DocumentNode;
let AdminSchema: DocumentNode;
let ConsoleSchema: DocumentNode;
let ResolversWithSchema: [string, DocumentNode][];
let OperationsWithSchema: [string, string, string[], DocumentNode][];
let ServerOperationsWithSchema: [string, string, string[], DocumentNode][];
// tests don't currently support importing .graphql files
// initialize PublicSchema and AdminSchema by reading the files ourselves
describe('GraphQL codegen is not stale', () => {
  const commonPath = path.resolve(
    process.cwd(),
    'server/src/public/common.graphql',
  );
  const schemaPath = path.resolve(
    process.cwd(),
    'server/src/public/schema.graphql',
  );
  const adminSchemaPath = path.resolve(
    process.cwd(),
    'server/src/admin/schema.graphql',
  );
  const consoleSchemaPath = path.resolve(
    process.cwd(),
    'server/src/console/schema.graphql',
  );

  const commonContents = fs.readFileSync(commonPath, 'utf8');
  const schemaContents = fs.readFileSync(schemaPath, 'utf8');
  const adminSchemaContents = fs.readFileSync(adminSchemaPath, 'utf8');
  const consoleSchemaContents = fs.readFileSync(consoleSchemaPath, 'utf8');
  PublicSchema = parse([commonContents, schemaContents].join('\n'));
  AdminSchema = parse([commonContents, adminSchemaContents].join('\n'));
  ConsoleSchema = parse([commonContents, consoleSchemaContents].join('\n'));
  ResolversWithSchema = [
    [PUBLIC_RESOLVERS, PublicSchema],
    [ADMIN_RESOLVERS, AdminSchema],
    [CONSOLE_RESOLVERS, ConsoleSchema],
  ];
  OperationsWithSchema = [
    [
      PUBLIC_OPERATIONS,
      PUBLIC_COMMON_DEFINITIONS,
      DIRS_WITH_GQL_OPS,
      PublicSchema,
    ],
    [
      ADMIN_OPERATIONS,
      ADMIN_COMMON_DEFINITIONS,
      DIRS_WITH_ADMIN_GQL_OPS,
      AdminSchema,
    ],
    [
      CONSOLE_OPERATIONS,
      CONSOLE_COMMON_DEFINITIONS,
      DIRS_WITH_CONSOLE_GQL_OPS,
      ConsoleSchema,
    ],
  ];
  ServerOperationsWithSchema = [
    [
      PUBLIC_SERVER_OPERATIONS,
      PUBLIC_COMMON_DEFINITIONS,
      DIRS_WITH_GQL_OPS,
      PublicSchema,
    ],
  ];

  test.each(ResolversWithSchema)(
    'Resolvers type file is up-to-date: %s',
    async (resolversPath, schema) => {
      const current = await fsPromises.readFile(resolversPath, 'utf8');
      const expected = await generateResolversTypeFile(schema);
      expect(current).toBe(expected);
    },
    20000,
  ); // increase time-out of this test to 20 seconds

  test.each(OperationsWithSchema)(
    'operations type files are up-to-date: %s and %s',
    async (operationsPath, definitionsPath, dirWithGqlOps, schema) => {
      const [currentOperations, currentDefinitions] = await Promise.all([
        fsPromises.readFile(operationsPath, 'utf8'),
        fsPromises.readFile(definitionsPath, 'utf8'),
      ]);
      const operationsFiles = await readGraphqlFiles(dirWithGqlOps);
      const [expectedOperations, expectedDefinitions] = await Promise.all([
        generateClientOperationsTypeFile(
          schema,
          operationsFiles,
          definitionsPath,
        ),
        generateCommonOperationsTypeFile(schema, operationsFiles),
      ]);
      expect(currentOperations).toBe(expectedOperations);
      expect(currentDefinitions).toBe(expectedDefinitions);
    },
    20000,
  ); // increase time-out of this test to 20 seconds

  test.each(ServerOperationsWithSchema)(
    'server operations type file is up-to-date: %s',
    async (operationsPath, definitionsPath, dirWithGqlOps, schema) => {
      const current = await fsPromises.readFile(operationsPath, 'utf8');
      const operationsFiles = await readGraphqlFiles(dirWithGqlOps);
      const expected = await generateServerOperationsTypeFile(
        schema,
        operationsFiles,
        definitionsPath,
      );
      expect(current).toBe(expected);
    },
  );
});
