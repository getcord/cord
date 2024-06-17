import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import prettier from 'prettier';
import type { DocumentNode, TypeNode } from 'graphql';
import { parse } from 'graphql';

const fsPromises = fs.promises;

export const PUBLIC_RESOLVERS = 'server/src/schema/resolverTypes.ts';
export const PUBLIC_COMMON_DEFINITIONS = 'common/graphql/types.ts';
export const PUBLIC_OPERATIONS = 'external/src/graphql/operations.ts';
export const PUBLIC_SERVER_OPERATIONS = 'server/src/schema/operations.ts';

export const ADMIN_RESOLVERS = 'server/src/admin/resolverTypes.ts';
export const ADMIN_COMMON_DEFINITIONS = 'common/graphql/admin/types.ts';
export const ADMIN_OPERATIONS =
  'external/src/entrypoints/admin/graphql/operations.ts';

export const CONSOLE_RESOLVERS = 'server/src/console/resolverTypes.ts';
export const CONSOLE_COMMON_DEFINITIONS = 'common/graphql/console/types.ts';
export const CONSOLE_OPERATIONS =
  'external/src/entrypoints/console/graphql/operations.ts';

export const DIRS_WITH_GQL_OPS = [
  'external/src/graphql/fragments/',
  'external/src/graphql/',
];

export const DIRS_WITH_ADMIN_GQL_OPS = [
  'external/src/entrypoints/admin/graphql/fragments/',
  'external/src/entrypoints/admin/graphql/',
];

export const DIRS_WITH_CONSOLE_GQL_OPS = [
  'external/src/entrypoints/console/graphql/fragments/',
  'external/src/entrypoints/console/graphql/mutations/',
  'external/src/entrypoints/console/graphql/queries/',
  'external/src/entrypoints/console/graphql/subscriptions/',
  'external/src/entrypoints/console/graphql/',
];

export const HEADER =
  '// @' +
  `generated
// to regenerate, run "npm run codegen"
/* eslint-disable @typescript-eslint/no-unused-vars */
`;

// Typescript typedefs for GraphQL builtins where we want to keep knowledge of
// the GraphQL type
export const BUILTIN_SCALAR_TYPES = `
type Int = number;
type Float = number;
`;

// Typescript types to output that are totally equivalent to GraphQL builtins
const BUILTIN_TYPESCRIPT_TYPES: Record<string, string> = {
  String: 'string',
  Boolean: 'boolean',
};

export async function prettify(text: string): Promise<string> {
  const config = await prettier.resolveConfig(
    path.posix.dirname(url.fileURLToPath(import.meta.url)),
  );
  if (config === null) {
    throw `Failed to find config file for prettier`;
  }
  config.parser = 'typescript';
  return await prettier.format(text, config);
}

// Read all *.graphql files inside directories (non-recursively)
export async function readGraphqlFiles(
  directories: string[],
): Promise<{ filename: string; contents: DocumentNode }[]> {
  const contentsPerDir = await Promise.all(
    directories.map(async (dir) => {
      const files = await fsPromises.readdir(dir);
      return await Promise.all(
        files
          .filter((filename) => filename.endsWith('.graphql'))
          .map(async (filename) => {
            const fullPath = path.posix.join(dir, filename);
            const contents = await fsPromises.readFile(fullPath, 'utf8');
            return { filename: fullPath, contents: parse(contents) };
          }),
      );
    }),
  );
  return contentsPerDir.flat();
}

export function buildNameForFieldArgs(objectName: string, fieldName: string) {
  if (['Query', 'Mutation', 'Subscription'].includes(objectName)) {
    // for these 3 objects we like the fieldName first
    return `${capitalize(fieldName)}${objectName}Args`;
  }
  return `${objectName}${capitalize(fieldName)}Args`;
}
export function capitalize(text: string) {
  if (text === '') {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function withSuffix(name: string, suffix: string) {
  return name.endsWith(suffix) ? name : name + suffix;
}

// converts a graphql AST TypeNode to typescript type
//
// Example:
// {ListType { NonNullType { NamedType { name: Thread } } } } returns:
// Maybe<Array<Thread>>
//
// You can pass "Nullable" as maybeOrNullable if you want
// Nullable<Array<Thread>> instead
//
// You can pass Map{"Thread": "ThreadEntity"} as nameRemaping if you want
// Maybe<Array<ThreadEntity>> instead
export function asTypescriptType(
  typeNode: TypeNode,
  maybeOrNullable: 'Maybe' | 'Nullable' = 'Maybe',
  nameRemapping?: string,
  overrideType?: string,
): string {
  let nullable = true;
  if (typeNode.kind === 'NonNullType') {
    nullable = false;
    typeNode = typeNode.type;
  }

  switch (typeNode.kind) {
    case 'NamedType': {
      let name =
        overrideType ||
        (nameRemapping
          ? `${nameRemapping}['${typeNode.name.value}']`
          : typeNode.name.value);
      if (name in BUILTIN_TYPESCRIPT_TYPES) {
        name = BUILTIN_TYPESCRIPT_TYPES[name];
      }
      return nullable ? `${maybeOrNullable}<${name}>` : name;
    }
    case 'ListType': {
      const typeValue = asTypescriptType(
        typeNode.type,
        maybeOrNullable,
        nameRemapping,
      );
      return nullable
        ? `${maybeOrNullable}<Array<${typeValue}>>`
        : `Array<${typeValue}>`;
    }
  }
}

// unwrapType gets you the name of the underlying type
//
// Example:
// {ListType { NonNullType { NamedType { name: Channel } } } } returns Channel
export function unwrapType(typeNode: TypeNode): string {
  for (let i = 0; i < 10; i++) {
    if (typeNode.kind === 'NamedType') {
      return typeNode.name.value;
    }
    // typeNode is ListType or NonNullType, let's unwrap it
    typeNode = typeNode.type;
  }
  throw `Error: Too many layers of wrapping!`;
}

// getWrapFn returns a function that will wrap strings with typescript Maybe<>
// and Array<> types matching the structure of given typeNode
//
// Example:
// {ListType { NonNullType { NamedType { name: Channel } } } } returns:
// (x: string) => `Maybe<Array<${x}>>`
export function getWrapFn(
  typeNode: TypeNode,
  maybeOrNullable: 'Maybe' | 'Nullable' = 'Maybe',
): (s: string) => string {
  let prefix = '';
  let suffix = '';
  for (let i = 0; i < 10; i++) {
    if (typeNode.kind === 'NonNullType') {
      typeNode = typeNode.type;
    } else {
      prefix = prefix + `${maybeOrNullable}<`;
      suffix = '>' + suffix;
    }

    switch (typeNode.kind) {
      case 'NamedType':
        return (x) => prefix + x + suffix;
      case 'ListType':
        prefix = prefix + 'Array<';
        suffix = '>' + suffix;
        break;
    }
    typeNode = typeNode.type;
  }
  throw `Error: Too many layers of wrapping!`;
}

/*
  This is dangerous!
  Redefining a field type here will completely ignore the type defined in GraphQL.
  Only do this if you're absolutely sure the two types are compatible.
*/
const REDEFINE_FIELD_TYPES: {
  [typeName: string]: {
    [fieldName: string]: string;
  };
} = {
  /* Before using this, consider creating a custom scalar type */
};

export function getFieldOverride(
  parentName: string,
  fieldName: string,
): string | undefined {
  return REDEFINE_FIELD_TYPES[parentName]
    ? REDEFINE_FIELD_TYPES[parentName][fieldName]
    : undefined;
}

export function objectType(fields: string[]) {
  return fields.length > 0
    ? `{\n${fields.join('\n')}\n}`
    : 'Record<string, never>';
}
