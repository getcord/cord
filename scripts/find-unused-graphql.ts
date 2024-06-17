#!/usr/bin/env -S node --enable-source-maps

// Usage:
//
// Run the script and it will spit out a list of pieces of the schema that are
// unused across all our different operations files.  Those should be safe to
// deprecate, if not delete outright.
import 'dotenv/config.js';

import type { DefinitionNode, DocumentNode, SelectionNode } from 'graphql';

import {
  DIRS_WITH_ADMIN_GQL_OPS,
  DIRS_WITH_CONSOLE_GQL_OPS,
  DIRS_WITH_GQL_OPS,
  capitalize,
  readGraphqlFiles,
  unwrapType,
} from 'scripts/graphql_codegen/common.ts';
import type {
  Lookup,
  SelectableObjectType,
} from 'scripts/graphql_codegen/operationTypes.ts';
import { buildLookup } from 'scripts/graphql_codegen/operationTypes.ts';
import AdminSchema from 'server/src/admin/schema.graphql';
import ConsoleSchema from 'server/src/console/schema.graphql';
import PublicSchema from 'server/src/public/schema.graphql';

async function main() {
  const [mainItems, mainUsed] = await findUnused(
    PublicSchema,
    DIRS_WITH_GQL_OPS,
  );
  const [adminItems, adminUsed] = await findUnused(
    AdminSchema,
    DIRS_WITH_ADMIN_GQL_OPS,
  );
  const [consoleItems, consoleUsed] = await findUnused(
    ConsoleSchema,
    DIRS_WITH_CONSOLE_GQL_OPS,
  );
  const allItems = new Set([...mainItems, ...adminItems, ...consoleItems]);
  const allUsed = new Set([...mainUsed, ...adminUsed, ...consoleUsed]);
  console.log(
    [...allItems]
      .filter((n) => !allUsed.has(n))
      .sort()
      .join('\n'),
  );
}

async function findUnused(schema: DocumentNode, dirs: string[]) {
  const ops = (await readGraphqlFiles(dirs)).map(({ contents }) => contents);
  const lookup = buildLookup(schema, ops);
  const allNodes = findSchemaNodes(schema, lookup);
  const opNodes = findOpNodes(ops, lookup);
  return [allNodes, opNodes];
}

function findSchemaNodes(schema: DocumentNode, lookup: Lookup) {
  const fields = new Set<string>();
  for (const def of schema.definitions) {
    findNodes(def, fields, lookup);
  }
  return fields;
}

function findOpNodes(ops: DocumentNode[], lookup: Lookup) {
  const fields = new Set<string>();
  for (const op of ops) {
    for (const def of op.definitions) {
      findNodes(def, fields, lookup);
    }
  }
  return fields;
}

function findNodes(node: DefinitionNode, fields: Set<string>, lookup: Lookup) {
  switch (node.kind) {
    case 'UnionTypeDefinition':
    case 'ScalarTypeDefinition':
      fields.add(node.name.value);
      break;
    case 'ObjectTypeDefinition':
      fields.add(node.name.value);
      for (const field of node.fields ?? []) {
        fields.add(`${node.name.value}.${field.name.value}`);
      }
      break;
    case 'FragmentDefinition': {
      const parentNode = lookup.baseTypes.get(node.typeCondition.name.value);
      if (!parentNode) {
        throw new Error(
          `Fragment ${node.name.value} is on unknown type: ${node.typeCondition.name.value}`,
        );
      }
      fields.add(parentNode.name.value);
      for (const selection of node.selectionSet.selections) {
        findSelectedNodes(selection, fields, lookup, parentNode);
      }
      break;
    }
    case 'OperationDefinition': {
      const opType = capitalize(node.operation);
      const parentNode = lookup.baseTypes.get(opType);
      if (!parentNode) {
        throw new Error(`Unknown type: ${opType}`);
      }
      fields.add(parentNode.name.value);
      for (const selection of node.selectionSet.selections) {
        findSelectedNodes(selection, fields, lookup, parentNode);
      }
      break;
    }
    default:
      // Ignore other kinds
      break;
  }
}

function findSelectedNodes(
  node: SelectionNode,
  fields: Set<string>,
  lookup: Lookup,
  parentNode: SelectableObjectType,
) {
  if (parentNode.kind === 'UnionTypeDefinition') {
    if (node.kind === 'Field' && node.name.value === '__typename') {
      return;
    }
    // All of the selections are InlineFragments
    if (node.kind !== 'InlineFragment' || !node.typeCondition) {
      throw new Error(`Unsupported GraphQL: ${node.kind}`);
    }
    const newParent = lookup.baseTypes.get(node.typeCondition.name.value);
    if (!newParent) {
      throw new Error(`Unknown type: ${node.typeCondition.name.value}`);
    }
    fields.add(newParent.name.value);
    for (const selection of node.selectionSet.selections) {
      findSelectedNodes(selection, fields, lookup, newParent);
    }
    return;
  }
  if (node.kind === 'Field') {
    if (node.name.value === '__typename') {
      return;
    }
    const matchingField = (parentNode.fields ?? []).find(
      (field) => field.name.value === node.name.value,
    );
    if (!matchingField) {
      throw new Error(`Unknown field: ${node.name.value}`);
    }
    fields.add(`${parentNode.name.value}.${matchingField.name.value}`);
    if (node.selectionSet) {
      const newParent = lookup.baseTypes.get(unwrapType(matchingField.type));
      if (!newParent) {
        throw new Error(`Unknown type: ${unwrapType(matchingField.type)}`);
      }
      fields.add(newParent.name.value);
      for (const selection of node.selectionSet.selections) {
        findSelectedNodes(selection, fields, lookup, newParent);
      }
    } else {
      fields.add(unwrapType(matchingField.type));
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERROR!', e);
    process.exit(1);
  });
