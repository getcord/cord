import path from 'path';
import fs from 'fs';
import * as TJS from 'typescript-json-schema';
import ts from 'typescript';
import prettier from 'prettier';

const TYPE_DEFINITION_FILES = [
  'application',
  'batch',
  'file',
  'message',
  'notifications',
  'org',
  'group',
  'preferences',
  'presence',
  'project',
  'thread',
  'typeDefinitions',
  'user',
  'webhook',
];

/**
 * Used to generate schema.json and types.ts from typeDefinitions.ts.
 * To re-generate run "node  generate.mjs" in sdk-js/packages/api-types
 */
async function main() {
  const schemaTsFile = path.resolve('generate/schema.ts');
  const schemaJsonFile = path.resolve('generate/schema.json');
  const typesFile = path.resolve('generate/types.ts');
  const typeDefinitionsFiles = TYPE_DEFINITION_FILES.map((f) =>
    path.resolve(`src/${f}.ts`),
  );

  const tsCompilerHost = {
    ...ts.createCompilerHost({}),

    // make sure we don't write files
    writeFile: () => {},

    // don't give it access to any directories
    getDirectories: () => [],
  };

  // settings for the typescript-json-schema generator,
  // see docs here -> https://www.npmjs.com/package/typescript-json-schema
  /** @type {Partial<TJS.Args>} */
  const settings = {
    noExtraProps: true, // Disable additional properties in objects by default
    required: true, // Create required array for non-optional properties in schema
    propOrder: true,
  };

  const tsProgram = ts.createProgram(
    typeDefinitionsFiles,
    {
      target: ts.ScriptTarget.ES2019,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      strictNullChecks: true,
      noEmit: true,
      allowImportingTsExtensions: true,
    },
    tsCompilerHost,
  );

  const tjsGenerator = TJS.buildGenerator(
    tsProgram,
    settings,
    typeDefinitionsFiles,
  );

  const jsonSchema = Object.fromEntries(
    tjsGenerator
      .getUserSymbols()
      .map((s) => [s, tjsGenerator.getSchemaForSymbol(s)]),
  );

  if (Object.keys(jsonSchema).length === 0) {
    throw new Error(
      'JSON schema is empty. This is very unlikely to be correct.\nDid you run `npm install` in the "api-types" directory?',
    );
  }

  Object.values(jsonSchema).forEach(makeAbsoluteURLsRelative);

  // write schema to schema.ts
  await fs.promises.writeFile(
    schemaTsFile,
    await prettier.format(
      `// @generated\nexport default ${JSON.stringify(jsonSchema)} as const;`,
      {
        filepath: schemaTsFile,
        ...(await prettier.resolveConfig(schemaTsFile)),
      },
    ),
  );

  // write schema to schema.json
  await fs.promises.writeFile(
    schemaJsonFile,
    await prettier.format(JSON.stringify(jsonSchema), {
      filepath: schemaJsonFile,
      ...(await prettier.resolveConfig(schemaJsonFile)),
    }),
  );

  // write types to types.js
  const typeNames = tjsGenerator.getUserSymbols();
  const typesFileCode = await prettier.format(printTypesFile(typeNames), {
    filepath: typesFile,
    ...(await prettier.resolveConfig(typesFile)),
  });
  await fs.promises.writeFile(typesFile, typesFileCode);
}

function makeAbsoluteURLsRelative(item) {
  if (item.description && typeof item.description === 'string') {
    item.description = item.description.replaceAll(
      '(https://docs.cord.com/',
      '(/',
    );
  }
  if (item.properties && typeof item.properties === 'object') {
    Object.values(item.properties).forEach(makeAbsoluteURLsRelative);
  }
  if (item.definitions && typeof item.definitions === 'object') {
    Object.values(item.definitions).forEach(makeAbsoluteURLsRelative);
  }
  if (item.items && typeof item.items === 'object') {
    makeAbsoluteURLsRelative(item.items);
  }
  if (item.anyOf && typeof Array.isArray(item.anyOf)) {
    item.anyOf.forEach(makeAbsoluteURLsRelative);
  }
}

function printTypesFile(typeNames) {
  const types = typeNames.map((t) => `${t}: ${t};`).join('\n');
  return `// @generated
// update typeDefinitions.ts and to re-generate run "node  generate.mjs" in sdk-js/packages/api-types

import type {${typeNames.join(', ')}} from '../src/typeDefinitions.js';
  
export type Types = {${types}};
`;
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
