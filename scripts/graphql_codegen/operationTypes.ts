import type {
  DocumentNode,
  FragmentDefinitionNode,
  ObjectTypeDefinitionNode,
  OperationDefinitionNode,
  SelectionNode,
  UnionTypeDefinitionNode,
  VariableDefinitionNode,
  OperationTypeNode,
} from 'graphql';
import {
  exportEnumType,
  exportInputObjectType,
} from 'scripts/graphql_codegen/baseTypes.ts';
import {
  asTypescriptType,
  BUILTIN_SCALAR_TYPES,
  capitalize,
  getFieldOverride,
  getWrapFn,
  HEADER,
  objectType,
  prettify,
  unwrapType,
  withSuffix,
} from 'scripts/graphql_codegen/common.ts';

const COMMON_IMPORTS = `
import type { Maybe, Nullable } from 'common/types/index.ts';
import type { FrontendScalars } from 'common/types/scalars.ts';
`;

const CLIENT_IMPORTS = `
import {
  useQuery,
  useLazyQuery,
  useMutation,
  // admin does not have any subscriptions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useSubscription,
} from '@apollo/client';
import type { DocumentNode } from 'graphql';
import type {
  QueryHookOptions,
  LazyQueryHookOptions,
  LazyQueryReturnType,
  MutationHookOptions,
  MutationReturnType,
  // admin does not have any subscriptions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SubscriptionHookOptions,
} from 'external/src/graphql/options.ts';
`;

const SERVER_IMPORTS = `
import type { DocumentNode, ExecutionResult } from 'graphql';
import { execute, subscribe } from 'graphql';
import type { Maybe } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { graphQLSchema } from 'server/src/schema/resolvers.ts';
`;

const SERVER_FUNCTIONS = `
async function executeGraphQL<
  TResult,
  TVariables extends Maybe<{ [key: string]: any }>,
>(
  document: DocumentNode,
  context: RequestContext,
  variables?: TVariables,
): Promise<TResult> {
  return extractResult(
    (await execute({
      schema: graphQLSchema,
      document,
      contextValue: context,
      variableValues: variables,
    })) as ExecutionResult<TResult>,
  );
}

async function subscribeGraphQL<
  TResult,
  TVariables extends Maybe<{ [key: string]: any }>,
>(
  document: DocumentNode,
  context: RequestContext,
  variables?: TVariables,
): Promise<AsyncIterableIterator<ExecutionResult<TResult>>> {
  const result = (await subscribe({
    schema: graphQLSchema,
    document,
    contextValue: context,
    variableValues: variables,
  })) as
    | ExecutionResult<TResult>
    | AsyncIterableIterator<ExecutionResult<TResult>>;
  if (!(Symbol.asyncIterator in result)) {
    // subscribe only returns an ExecutionResult on an error, so extractResult()
    // will never return, but TS doesn't know that.
    extractResult(result);
    throw new Error('Unknown GraphQL error');
  }
  return result;
}

export function extractResult<TResult>(
  result: ExecutionResult<TResult>,
): TResult {
  if (!result.data) {
    if (result.errors?.[0]?.originalError) {
      throw result.errors[0].originalError;
    }
    throw new Error(result.errors?.[0]?.message ?? 'Unknown GraphQL error');
  }
  return result.data;
}`;

export function generateCommonOperationsTypeFile(
  schema: DocumentNode,
  operations: { filename: string; contents: DocumentNode }[],
): Promise<string> {
  const output: string[] = [
    HEADER,
    COMMON_IMPORTS,
    BUILTIN_SCALAR_TYPES,
    exportBaseTypes(schema),
    exportOperationTypes(
      schema,
      operations.map(({ contents }) => contents),
    ),
  ];
  return prettify(output.join('\n\n'));
}

export function generateClientOperationsTypeFile(
  schema: DocumentNode,
  operations: { filename: string; contents: DocumentNode }[],
  definitionsFile: string,
): Promise<string> {
  const output: string[] = [
    HEADER,
    CLIENT_IMPORTS,
    importTypesFromDefinitionsFile(
      schema,
      operations.map(({ contents }) => contents),
      definitionsFile,
    ),
    generateClientOperationHooks(operations),
    exportQueryDefinitionTypes(operations),
  ];
  return prettify(output.join('\n\n'));
}

export function generateServerOperationsTypeFile(
  schema: DocumentNode,
  operations: { filename: string; contents: DocumentNode }[],
  definitionsFile: string,
): Promise<string> {
  const output: string[] = [
    HEADER,
    SERVER_IMPORTS,
    SERVER_FUNCTIONS,
    importTypesFromDefinitionsFile(
      schema,
      operations.map(({ contents }) => contents),
      definitionsFile,
    ),
    generateServerExecutes(operations),
  ];
  return prettify(output.join('\n\n'));
}

// generates apollo hooks and a re-export of the .graphql file.
function generateClientOperationHooks(
  operations: { filename: string; contents: DocumentNode }[],
): string {
  const exportOps = [];
  const hooks: string[] = [];
  for (const operation of operations) {
    const result = processOperationForImport(operation);
    if (!result) {
      continue;
    }
    const [operationNode, importName] = result;
    exportOps.push(
      `import { default as ${importName} } from '${operation.filename}';`,
      `export { ${importName} };`,
    );

    hooks.push(generateHook(operationNode));
  }
  return [exportOps.join('\n'), hooks.join('\n')].join('\n');
}

function generateServerExecutes(
  operations: { filename: string; contents: DocumentNode }[],
): string {
  const exportOps = [];
  const executes: string[] = [];
  for (const operation of operations) {
    const result = processOperationForImport(operation);
    if (!result) {
      continue;
    }
    const [operationNode, importName] = result;
    if (
      operationNode.operation !== 'query' &&
      operationNode.operation !== 'subscription'
    ) {
      // Server-side execution doesn't do mutations right now
      continue;
    }
    exportOps.push(
      '// eslint-disable-next-line import/no-restricted-paths',
      `import { default as ${importName} } from '${operation.filename}';`,
    );

    executes.push(generateExecute(operationNode));
  }
  return [
    exportOps.join('\n'),
    executes.filter((e) => e.length > 0).join('\n'),
  ].join('\n');
}

function processOperationForImport(operation: {
  filename: string;
  contents: DocumentNode;
}): [OperationDefinitionNodeWithName, string] | undefined {
  const operationNodes = operation.contents.definitions.filter(
    (def): def is OperationDefinitionNode => def.kind === 'OperationDefinition',
  );
  if (operationNodes.length > 1) {
    throw `File ${operation.filename} defines more than 1 operation (${operationNodes.length})`;
  }
  if (operationNodes.length === 0) {
    return;
  }
  const operationNode = operationNodes[0];
  if (!operationHasName(operationNode)) {
    throw `File ${operation.filename} defines an operation without a name. Name must be provided.`;
  }
  return [operationNode, operationImportName(operationNode)];
}

type OperationDefinitionNodeWithName = Omit<OperationDefinitionNode, 'name'> & {
  name: NonNullable<OperationDefinitionNode['name']>;
};
function operationHasName(
  operation: OperationDefinitionNode,
): operation is OperationDefinitionNodeWithName {
  return !!operation.name;
}

// the that we will use to import the operation
// e.g. 'ArchiveQuery' for:
// import { default as ArchiveQuery } from 'external/src/graphql/ArchiveQuery.graphql'
function operationImportName(
  operationNode: OperationDefinitionNodeWithName,
): string {
  return withSuffix(
    operationNode.name.value,
    capitalize(operationNode.operation),
  );
}

function generateHook(operationNode: OperationDefinitionNodeWithName): string {
  const operationType = operationNode.operation;
  const documentName = operationImportName(operationNode);
  const hasVariables = !!operationNode.variableDefinitions?.length;
  const variablesType = hasVariables
    ? operationVariablesName(operationNode)
    : objectType([]);
  const resultType = operationResultName(operationNode);
  const maybeQuestionMark = hasVariables ? '' : '?';

  switch (operationType) {
    case 'query': {
      return `
export function use${documentName}<T>(
  options${maybeQuestionMark}: QueryHookOptions<${resultType}, ${variablesType}, T>,
) {
  return useQuery<${resultType}, ${variablesType}>(${documentName}, options);
}

export function useLazy${documentName}<T>(
  options?: LazyQueryHookOptions<${resultType}, ${variablesType}, T>,
): LazyQueryReturnType<${resultType}, ${variablesType}> {
  return useLazyQuery<${resultType}, ${variablesType}>(${documentName}, options);
}`;
    }
    case 'mutation': {
      return `
export function use${documentName}<T>(
  options?: MutationHookOptions<${resultType}, ${variablesType}, T>,
): MutationReturnType<${resultType}, ${variablesType}> {
  return useMutation<${resultType}, ${variablesType}>(${documentName}, options);
}`;
    }
    case 'subscription': {
      return `
export function use${documentName}<T>(
  options${maybeQuestionMark}: SubscriptionHookOptions<${resultType}, ${variablesType}, T>,
) {
  return useSubscription<${resultType}, ${variablesType}>(${documentName}, { fetchPolicy: 'no-cache', ...options });
};`;
    }
  }
}

function generateExecute(
  operationNode: OperationDefinitionNodeWithName,
): string {
  const operationType = operationNode.operation;
  const documentName = operationImportName(operationNode);
  const hasVariables = !!operationNode.variableDefinitions?.length;
  const variablesType = hasVariables
    ? operationVariablesName(operationNode)
    : objectType([]);
  const resultType = operationResultName(operationNode);
  const maybeQuestionMark = hasVariables ? '' : '?';

  switch (operationType) {
    case 'query': {
      return `
export async function execute${documentName}(
  options: {
    context: RequestContext;
    variables${maybeQuestionMark}: ${variablesType};
  }
) {
  return await executeGraphQL<${resultType}, ${variablesType}>(
    ${documentName},
    options.context,
    options.variables,
  );
}`;
    }
    case 'subscription': {
      return `
export async function subscribe${documentName}(
  options: {
    context: RequestContext;
    variables${maybeQuestionMark}: ${variablesType};
  }
) {
  return await subscribeGraphQL<${resultType}, ${variablesType}>(
    ${documentName},
    options.context,
    options.variables,
  );
}`;
    }
    default:
      // Server-side execution doesn't do mutations right now
      return '';
  }
}

function exportBaseTypes(schema: DocumentNode): string {
  const exportedTypes: string[] = [];
  for (const definition of schema.definitions) {
    switch (definition.kind) {
      case 'EnumTypeDefinition':
        exportedTypes.push(exportEnumType(definition));
        break;
      case 'InputObjectTypeDefinition':
        exportedTypes.push(exportInputObjectType(definition));
        break;
      case 'UnionTypeDefinition':
      case 'ObjectTypeDefinition':
        break;
      case 'ScalarTypeDefinition':
        exportedTypes.push(
          `export type ${definition.name.value} = FrontendScalars['${definition.name.value}'];`,
        );
        break;
      default:
        // interfaces, type/schema extensions, directives
        // we don't use these right now
        throw `Unexpected definition kind: ${definition.kind}`;
    }
  }
  return exportedTypes.join('\n\n');
}

function importTypesFromDefinitionsFile(
  schema: DocumentNode,
  operations: DocumentNode[],
  definitionsFile: string,
): string {
  const types: string[] = [];
  for (const definition of schema.definitions) {
    switch (definition.kind) {
      case 'EnumTypeDefinition':
      case 'InputObjectTypeDefinition':
      case 'ScalarTypeDefinition':
        types.push(definition.name.value);
        break;
      case 'UnionTypeDefinition':
      case 'ObjectTypeDefinition':
        break;
      default:
        // interfaces, type/schema extensions, directives
        // we don't use these right now
        throw `Unexpected definition kind: ${definition.kind}`;
    }
  }
  for (const operation of operations) {
    for (const definition of operation.definitions) {
      switch (definition.kind) {
        case 'FragmentDefinition':
          types.push(withSuffix(definition.name.value, 'Fragment'));
          break;
        case 'OperationDefinition':
          if (!operationHasName(definition)) {
            throw `Operation is missing a name`;
          }
          types.push(operationResultName(definition));
          if (definition.variableDefinitions?.length) {
            types.push(operationVariablesName(definition));
          }
          break;
        default:
          throw `Unexpected operation kind:', ${definition.kind}`;
      }
    }
  }
  return `import type { ${types.join(
    ', ',
  )} } from '${definitionsFile}';\nexport type { ${types.join(', ')}};`;
}

export function exportOperationTypes(
  schema: DocumentNode,
  operations: DocumentNode[],
): string {
  const lookup = buildLookup(schema, operations);
  const operationTypes: string[] = [];
  const errorMessages = [];

  for (const operation of operations) {
    for (const definition of operation.definitions) {
      try {
        switch (definition.kind) {
          case 'FragmentDefinition':
            operationTypes.push(exportFragmentType(definition, lookup));
            break;
          case 'OperationDefinition':
            // TODO - Idea: check whether whether variables match args? hmm
            operationTypes.push(exportOperationType(definition, lookup));
            if (definition.variableDefinitions?.length) {
              const variableType = buildOperationVariableType(
                definition.variableDefinitions,
              );

              if (!operationHasName(definition)) {
                throw `All operations must have a name, e.g. "query Foo {...}"`;
              }
              const variableName = operationVariablesName(definition);
              operationTypes.push(
                `export type ${variableName} = ${variableType};`,
              );
            }
            break;
          default:
            throw `Unexpected operation kind:', ${definition.kind}`;
        }
      } catch (e) {
        errorMessages.push(
          `Failed to generate type for operation ${(definition as any)?.name
            ?.value}: ${e}`,
        );
      }
    }
  }

  if (errorMessages.length > 0) {
    throw errorMessages.join('\n');
  }

  return operationTypes.join('\n\n');
}

function operationVariablesName(operation: OperationDefinitionNodeWithName) {
  return withSuffix(
    withSuffix(operation.name.value, capitalize(operation.operation)),
    'Variables',
  );
}

function exportFragmentType(fragment: FragmentDefinitionNode, lookup: Lookup) {
  const fragmentOn = fragment.typeCondition.name.value; // e.g. Message for "MessageFragment on Message"
  const parentNode = lookup.baseTypes.get(fragmentOn);
  if (!parentNode) {
    throw `Fragment ${fragment.name.value} is on unknown type: ${fragmentOn}`;
  }
  // NOTE: Fragments can have variables, but we probably don't care about that
  const selectionType = buildSelectionType(
    fragment.selectionSet.selections,
    parentNode,
    lookup,
  );
  return `export type ${withSuffix(
    fragment.name.value,
    'Fragment',
  )} = ${selectionType};`;
}

function exportOperationType(
  operation: OperationDefinitionNode,
  lookup: Lookup,
) {
  if (!operationHasName(operation)) {
    throw `Operation is missing a name`;
  }
  const operationName = capitalize(operation.operation);
  // lookup the definition of Query/Mutation/Subscription so that we know what
  // fields of what type they have
  const parentNode = lookup.baseTypes.get(operationName);
  if (!parentNode) {
    throw `Operation ${operation.name.value} has unknown type ${operationName}`;
  }
  const selectionType = buildSelectionType(
    operation.selectionSet.selections,
    parentNode,
    lookup,
  );
  return `export type ${operationResultName(operation)} = ${selectionType};`;
}

function operationResultName(operation: OperationDefinitionNodeWithName) {
  const operationName = capitalize(operation.operation); // one of Query/Mutation/Subscription
  return `${withSuffix(operation.name.value, operationName)}Result`;
}

function buildOperationVariableType(
  variableNodes: readonly VariableDefinitionNode[],
): string {
  const variableTypes: string[] = [];

  for (const variableNode of variableNodes) {
    // TODO: throw error if variableType does not match an existing GraphQL type
    const variableName = variableNode.variable.name.value;
    const variableType = asTypescriptType(variableNode.type);
    variableTypes.push(`${variableName}: ${variableType};`);
  }
  return ['{', ...variableTypes, '}'].join('\n');
}

export type SelectableObjectType =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode;
// Lookup is just an object with hashmaps that make it easy to lookup any
// object/fragment/union definition
export type Lookup = {
  fragments: Map<string, FragmentDefinitionNode>;
  baseTypes: Map<string, SelectableObjectType>;
};

export function buildLookup(
  schema: DocumentNode,
  operations: DocumentNode[],
): Lookup {
  const fragments = new Map<string, FragmentDefinitionNode>();
  const baseTypes = new Map<string, SelectableObjectType>();
  for (const doc of [schema, ...operations]) {
    for (const definition of doc.definitions) {
      switch (definition.kind) {
        case 'FragmentDefinition':
          fragments.set(definition.name.value, definition);
          break;
        case 'ObjectTypeDefinition':
        case 'UnionTypeDefinition':
          // you can select fields on objects and unions
          baseTypes.set(definition.name.value, definition);
          break;
        case 'ScalarTypeDefinition':
        case 'OperationDefinition':
        case 'EnumTypeDefinition':
        case 'InputObjectTypeDefinition':
          break;
        default:
          throw `Unexpected kind: ${definition.kind}`;
      }
    }
  }
  return {
    fragments,
    baseTypes,
  };
}

// buildSelectionType takes a selection, the type that we are selecting on and
// returns a typescript type
//
// Example:
// - selecting on Message (parentNode)
// {
//   id
//   source
//   reactions {
//     id
//   }
// }
// returns:
// {
//   id: Nullable<UUID>;
//   source: Nullable<UserFragment>;
//   reactions: Array<{id: Nullable<UUID>}>;
// }
function buildSelectionType(
  selections: readonly SelectionNode[],
  parentNode: SelectableObjectType,
  lookup: Lookup,
  forceIncludeTypename = false,
): string {
  const fields: string[] = [];
  if (forceIncludeTypename) {
    fields.push(`__typename: '${parentNode.name.value}';`);
  }
  const fragments: string[] = [];
  if (parentNode.kind === 'UnionTypeDefinition') {
    return buildSelectionTypeOnUnion(selections, parentNode, lookup);
  }

  for (const selection of selections) {
    switch (selection.kind) {
      case 'Field': {
        if (selection.name.value === '__typename' && !forceIncludeTypename) {
          fields.push(`__typename: '${parentNode.name.value}';`);
          break;
        }
        const matchingField = (parentNode.fields ?? []).find(
          (field) => field.name.value === selection.name.value,
        );
        if (matchingField === undefined) {
          throw `Field ${selection.name.value} does not exist on type ${parentNode.name.value}`;
        }

        let fieldType = '';
        const newParent = lookup.baseTypes.get(unwrapType(matchingField.type));
        if (selection.selectionSet) {
          if (newParent === undefined) {
            throw `Could not find type definition for ${matchingField.name.value}`;
          }
          const unwrappedFieldType = buildSelectionType(
            selection.selectionSet.selections,
            newParent,
            lookup,
          );
          fieldType = getWrapFn(
            matchingField.type,
            'Nullable',
          )(unwrappedFieldType);
        } else {
          if (newParent !== undefined) {
            throw `You need to select at least 1 field on ${selection.name.value}`;
          }

          fieldType = asTypescriptType(
            matchingField.type,
            'Nullable',
            undefined,
            getFieldOverride(parentNode.name.value, selection.name.value),
          );
        }
        const fieldName = selection.alias
          ? selection.alias.value
          : selection.name.value;
        fields.push(`${fieldName}: ${fieldType};`);
        break;
      }
      case 'FragmentSpread': {
        const fragmentName = selection.name.value; //e.g. UserFragment for "...UserFragment"
        const spreadFragment = lookup.fragments.get(fragmentName);
        if (!spreadFragment) {
          throw `Unknown fragment ...${fragmentName}`;
        }
        if (spreadFragment.typeCondition.name.value !== parentNode.name.value) {
          throw (
            `Cannot expand fragment ${spreadFragment.name.value} on type ${parentNode.name.value}. ` +
            `Fragment ${spreadFragment.name.value} is defined on type ${spreadFragment.typeCondition.name.value}`
          );
        }
        fragments.push(withSuffix(spreadFragment.name.value, 'Fragment'));
        break;
      }
      case 'InlineFragment': {
        throw (
          `Cannot select "... on ${selection.typeCondition?.name.value}" on node ${parentNode.name.value}.` +
          `Inline fragments are only allowed on union types.`
        );
      }
    }
  }

  const types: string[] = [...fragments];
  if (fields.length > 0) {
    types.push(objectType(fields));
  }
  return types.join(' & ');
}

// buildSelectionTypeOnUnion is converts a selection on unions into a type.
// Union types are special because on those you can select only:
// __typename field and inline spreads (e.g. "... on MessageFileAttachment")
//
// Example:
// - selecting on MessageAttachment (parentNode)
// {
//   __typename
//   ... on MessageFileAttachment {
//     id
//   }
//
//   ... on MessageAnnotationAttachment {
//     screenshot {
//       ...FileFragment
//     }
//   }
// }
//
// returns:
//   {
//     __typename: 'MessageFileAttachment';
//     id: Nullable<UUID>;
//   }
// | {
//     __typename: 'MessageAnnotationAttachment';
//     screenshot: Nullable<FileFragment>;
//   }
function buildSelectionTypeOnUnion(
  selections: readonly SelectionNode[],
  parentNode: UnionTypeDefinitionNode,
  lookup: Lookup,
): string {
  const includeTypename = selections.some(
    (selection) =>
      selection.kind === 'Field' && selection.name.value === '__typename',
  );
  if (!parentNode.types?.length) {
    throw `Union type ${parentNode.types} has no subTypes`;
  }
  // initially all subtypes are just {} or {__typename: "xxx"}
  const typePerUnionSubtype = new Map<string, string>(
    parentNode.types.map((subType) => [
      subType.name.value,
      includeTypename
        ? `{ __typename: '${subType.name.value}'; }`
        : objectType([]),
    ]),
  );
  for (const selection of selections) {
    switch (selection.kind) {
      case 'FragmentSpread': {
        throw (
          `Encountered fragment spread ${selection.name.value} on union type ${parentNode.name.value}.` +
          ` Only __typename and inline fragments "... on Type" are allowed on union types.`
        );
      }
      case 'Field': {
        if (selection.name.value !== '__typename') {
          throw (
            `Selecting field ${selection.name.value} is not allowed.` +
            `Only __typename and inline fragments are allowed.`
          );
        }
        break;
      }
      case 'InlineFragment': {
        if (!selection.typeCondition) {
          throw `Inline fragments without type are not supported`;
        }
        if (!typePerUnionSubtype.has(selection.typeCondition.name.value)) {
          throw (
            `Inline fragment type ${selection.typeCondition.name.value} does not exist on ` +
            `type ${parentNode.name.value}. Options are: ${[
              ...typePerUnionSubtype.keys(),
            ]}`
          );
        }
        const newParent = lookup.baseTypes.get(
          selection.typeCondition.name.value,
        );
        if (newParent === undefined) {
          throw `Unknown type encountered: ${selection.typeCondition.name.value}`;
        }
        typePerUnionSubtype.set(
          selection.typeCondition.name.value,
          buildSelectionType(
            selection.selectionSet.selections,
            newParent,
            lookup,
            includeTypename,
          ),
        );
        break;
      }
    }
  }

  // deduplicate types (in case some are empty to avoid "{} | {}")
  return [...new Set(typePerUnionSubtype.values())].join(' | ');
}

export function exportQueryDefinitionTypes(
  operations: { filename: string; contents: DocumentNode }[],
): string {
  const operationTypes: readonly OperationTypeNode[] = [
    'query',
    'mutation',
    'subscription',
  ];
  const operationNames: Record<OperationTypeNode, string[]> = {
    query: [],
    mutation: [],
    subscription: [],
  };
  const typeDefs: Record<OperationTypeNode, string[]> = {
    query: [],
    mutation: [],
    subscription: [],
  };

  for (const operation of operations) {
    const operationNodes = operation.contents.definitions.filter(
      (def): def is OperationDefinitionNode =>
        def.kind === 'OperationDefinition',
    );
    const operationNode = operationNodes[0];
    if (!operationNode || !operationHasName(operationNode)) {
      // `generateOperationHooks` earlier would have thrown exceptions for
      // ill-defined operations, so here we just skip them. This also tells
      // TypeScript we are dealing with the desired types.
      continue;
    }

    const name = operationImportName(operationNode);
    const operationType = operationNode.operation;
    const hasVariables = !!operationNode.variableDefinitions?.length;
    const variablesType = hasVariables
      ? operationVariablesName(operationNode)
      : objectType([]);
    const resultType = operationResultName(operationNode);

    operationNames[operationType].push(name);
    typeDefs[operationType].push(
      `${JSON.stringify(
        name,
      )}:{variables:${variablesType};result:${resultType}};`,
    );
  }

  const output: string[] = [];

  for (const operationType of operationTypes) {
    const [valueName, typeName] = {
      query: ['queries', 'QueryTypes'],
      mutation: ['mutations', 'MutationTypes'],
      subscription: ['subscriptions', 'SubscriptionTypes'],
    }[operationType];

    if (typeDefs[operationType].length > 0) {
      output.push(
        `export type ${typeName} = {${typeDefs[operationType].join(
          '\n',
        )}};\n\n`,
      );
      output.push(
        `export const ${valueName}: Record<keyof ${typeName}, DocumentNode> = {${operationNames[
          operationType
        ]
          .map((name) => `${JSON.stringify(name)}:${name},`)
          .join('\n')}};\n\n`,
      );
    }
  }

  return output.join('');
}
