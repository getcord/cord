import type {
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  DocumentNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import {
  exportEnumType,
  exportInputObjectType,
  exportObjectType,
  exportUnionType,
} from 'scripts/graphql_codegen/baseTypes.ts';
import {
  buildNameForFieldArgs,
  BUILTIN_SCALAR_TYPES,
  getFieldOverride,
  getWrapFn,
  HEADER,
  objectType,
  prettify,
  unwrapType,
} from 'scripts/graphql_codegen/common.ts';

const TYPE_ALIASES = `
// MatchingKeys<Type, EntityType> returns the keys (names of fields) of
// EntityType that also exist in Type and the type of those keys in EntityType
// are assignable to types of those keys on Type. (ie. "key" is returned if
// EntityType.key is assignable to Type.key).
//
// An example:
// MatchingKeys<
//  {name: string; age: number | null;  nicknames: string[];}, // Type
//  {name: string; age: number; fullName?: string;} // EntityType
// > =
// {
//    name: "name";
//    age: "age";
//    fullName: never;  // because "fullName" extends keyof Type is false
// }["name" | "age" | "fullName"]
//
// which returns "name" | "age" because only EntityType.{name, age} can be
// assigned to Type.{name, age}
type MatchingKeys<Type, EntityType> = {
  [Key in keyof EntityType]-?: Key extends keyof Type
    ? EntityType[Key] extends Type[Key]
      ? Key
      : never
    : never;
}[keyof EntityType];

// MakeExistingFieldsOptional takes a Resolver type and makes some of its
// fields ?optional. The fields that are made optional are those that are
// shared between the GqlType and the MappedType (e.g. between Thread and
// ThreadEntity).
type MakeExistingFieldsOptional<Resolver, GqlType, MappedType> = {
  [K in MatchingKeys<GqlType, MappedType>]?: K extends keyof Resolver
    ? Resolver[K]
    : never;
} &
  {
    [K in Exclude<
      keyof Resolver,
      MatchingKeys<GqlType, MappedType>
    >]: Resolver[K];
  };

// M is used for remapping some types to other types (mostly to entities)
// M['ObjectName'] maps ObjectName type to:
// a) either to a new type (e.g. M['User'] is UserEntity defined in Mapping)
// b) or if 'ObjectName' does not appear in Mapping then it is mapped to the
//    graphql type (e.g. M['DocumentLocation'] is DocumentLocation)
type M = Mapping & Omit<NameToType, keyof Mapping>;
`;

const REQUEST_CONTEXT = 'RequestContext';
const IMPORTS = `
import type { GraphQLScalarType } from 'graphql';
import type { Mapping } from 'server/src/schema/mapping.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { Maybe, Nullable } from 'common/types/index.ts';
`;

export function generateResolversTypeFile(
  schema: DocumentNode,
): Promise<string> {
  const output: string[] = [
    HEADER,
    IMPORTS,
    TYPE_ALIASES,
    BUILTIN_SCALAR_TYPES,
    exportBaseTypes(schema),
    exportResolverTypes(schema),
  ];
  return prettify(output.join('\n\n'));
}

export function exportBaseTypes(schema: DocumentNode) {
  const exportedTypes: string[] = [];
  const namesOfExportedTypes: string[] = [];
  for (const definition of schema.definitions) {
    switch (definition.kind) {
      case 'EnumTypeDefinition':
        exportedTypes.push(exportEnumType(definition));
        namesOfExportedTypes.push(definition.name.value);
        break;
      case 'UnionTypeDefinition':
        exportedTypes.push(exportUnionType(definition, 'M'));
        namesOfExportedTypes.push(definition.name.value);
        break;
      case 'InputObjectTypeDefinition':
        exportedTypes.push(exportInputObjectType(definition));
        namesOfExportedTypes.push(definition.name.value);
        break;
      case 'ObjectTypeDefinition':
        exportedTypes.push(exportObjectType(definition, 'M'));
        namesOfExportedTypes.push(definition.name.value);
        break;
      case 'ScalarTypeDefinition':
        exportedTypes.push(
          `type ${definition.name.value} = Mapping['${definition.name.value}'];`,
        );
        break;
      default:
        // interfaces, type/schema extensions, directives
        // we don't use these right now
        throw `Unexpected definition kind: ${definition.kind}`;
    }
  }

  // NameToType is a simple type object that just maps the name of the
  // generated type to the type. It provides the type to use for a graphql
  // object unless a remapping to an entity type is defined (see definition of
  // "type M" above)
  // export type NameToType = {
  //   Channel: Channel;
  //   User: User;
  //   ...
  // }
  const nameToTypeMap = [
    `export type NameToType = {`,
    ...namesOfExportedTypes.map((name) => `${name}: ${name};`),
    '}',
  ].join('\n');

  exportedTypes.push(nameToTypeMap);

  return exportedTypes.join('\n\n');
}

// wraps an object's name to "M['objectName']" so that we can use the type
// object M to remap a type. For example, M['User'] is UserEntity.
function maybeRemap(objectName: string) {
  return `M['${objectName}']`;
}

export function exportResolverTypes(schema: DocumentNode): string {
  const typeDefinitions: string[] = [];
  const objectNames: string[] = [];
  const unionNames: string[] = [];
  const customScalarNames: string[] = [];
  for (const definition of schema.definitions) {
    switch (definition.kind) {
      case 'ScalarTypeDefinition': {
        customScalarNames.push(definition.name.value);
        break;
      }
      case 'ObjectTypeDefinition': {
        const objectName = definition.name.value;
        const resolverType = buildResolverTypeForObject(definition);
        // don't export XXXXResolver, people should use
        // Resolvers['XXXXResolver'] type instead
        typeDefinitions.push(`type ${objectName}Resolver = ${resolverType}`);
        objectNames.push(objectName);
        break;
      }
      case 'UnionTypeDefinition': {
        const unionName = definition.name.value;
        const resolverType = buildResolverTypeForUnion(definition);
        typeDefinitions.push(`type ${unionName}Resolver = ${resolverType}`);
        unionNames.push(unionName);
        break;
      }
    }
  }

  const allResolversType = [
    'export type Resolvers = {',
    ...customScalarNames.map(
      (scalarName) => `${scalarName}: GraphQLScalarType;`,
    ),
    ...objectNames.map(
      (objectName) =>
        `${objectName}: MakeExistingFieldsOptional<${objectName}Resolver, ${objectName}, ${maybeRemap(
          objectName,
        )}>;`,
    ),
    ...unionNames.map((unionName) => `${unionName}: ${unionName}Resolver;`),
    '};',
  ].join('\n');
  return [...typeDefinitions, allResolversType].join('\n\n');
}

function buildResolverTypeForObject(objectNode: ObjectTypeDefinitionNode) {
  const fieldsWithTypes: string[] = [];
  for (const field of objectNode.fields ?? []) {
    const fieldType = buildResolverTypeForField(field, objectNode);
    fieldsWithTypes.push(`${field.name.value}: ${fieldType};`);
  }

  return objectType(fieldsWithTypes);
}

// For most fields, this returns a function type:
// (parent: ParentType, args: ArgType, context: RequestContext) => FieldType | Promise<FieldType>
// For fields on Subscription object, this returns an object type:
// {
//    subscribe: (parent: ParentType, args: ArgType, context: RequestContext) => any | Promise<any>;
//    resolve: (parent: any, args: ArgType, context: RequestContext) => FieldType | Promise<FieldType>;
// }
function buildResolverTypeForField(
  field: FieldDefinitionNode,
  parentNode: ObjectTypeDefinitionNode,
): string {
  let argType = objectType([]);
  if (field.arguments && field.arguments.length > 0) {
    argType = buildNameForFieldArgs(parentNode.name.value, field.name.value);
  }

  const typeName =
    getFieldOverride(parentNode.name.value, field.name.value) ||
    maybeRemap(unwrapType(field.type));

  const parentType = maybeRemap(parentNode.name.value);
  const outputType = getWrapFn(field.type)(typeName);

  if (parentNode.name.value !== 'Subscription') {
    return `(parent: ${parentType}, args: ${argType}, context: ${REQUEST_CONTEXT}) => ${outputType} | Promise<${outputType}>`;
  }

  // subscription resolvers have additional "subscribe" function
  // TODO - Idea: Use type generics to enforce that subscribe() return type
  // matches resolve()'s parent argument type.
  // The usage then would be something like:
  // const x: SubscriptionResolver<PayloadType>['channelEvents'] = { ... }
  return [
    '{',
    `subscribe: (parent: ${objectType(
      [],
    )}, args: ${argType}, context: ${REQUEST_CONTEXT}) => any | Promise<any>`,
    `resolve: (parent: any, args: ${argType}, context: ${REQUEST_CONTEXT}) => ${outputType} | Promise<${outputType}>`,
    '}',
  ].join('\n');
}

// Union fields need to declare a special function called __resolveType() which
// decides the subtype of the union object.
function buildResolverTypeForUnion(unionNode: UnionTypeDefinitionNode) {
  const parentName = maybeRemap(unionNode.name.value);
  if (!unionNode.types?.length) {
    throw (
      `Cannot generate resolver for union ${unionNode.name.value} ` +
      `because it has no types`
    );
  }

  // no remapping (maybeRemap is not called) for output type. The __resolveType
  // function needs to return name of a graphQL object, not name of one of our
  // Entities.
  const outputType = unionNode.types
    .map((subType) => `'${subType.name.value}'`)
    .join(' | ');
  const resolveTypeField = `__resolveType: (parent: ${parentName}, context: ${REQUEST_CONTEXT}) => ${outputType};`;
  return ['{', resolveTypeField, '}'].join('\n');
}
