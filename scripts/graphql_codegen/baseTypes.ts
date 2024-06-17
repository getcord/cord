import type {
  EnumTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import {
  buildNameForFieldArgs,
  asTypescriptType,
  getFieldOverride,
  objectType,
} from 'scripts/graphql_codegen/common.ts';

export function exportEnumType(enumNode: EnumTypeDefinitionNode) {
  const options = (enumNode.values ?? [])
    .map((value) => `"${value.name.value}"`)
    .join(' | ');
  return `export type ${enumNode.name.value} = ${options};`;
}

export function exportUnionType(
  union: UnionTypeDefinitionNode,
  nameRemapping: string,
) {
  if (!union.types?.length) {
    throw `The union type ${union.name.value} has no subtypes. It should have at least one`;
  }
  const unionOptions = union.types
    .map((subType) => `${nameRemapping}['${subType.name.value}']`)
    .join(' | ');
  return `export type ${union.name.value} = ${unionOptions};`;
}

export function exportInputObjectType(
  objectNode: InputObjectTypeDefinitionNode,
) {
  const fields: string[] = [];
  for (const field of objectNode.fields ?? []) {
    const fieldName = field.name.value;
    const fieldType = asTypescriptType(field.type);
    fields.push(`${fieldName}: ${fieldType};`);
  }
  return `export type ${objectNode.name.value} = ${objectType(fields)};`;
}

export function exportObjectType(
  objectNode: ObjectTypeDefinitionNode,
  nameRemapping: string,
) {
  // NOTE: Interfaces are not supported
  const fields: string[] = [];
  const argTypes: string[] = [];
  for (const field of objectNode.fields ?? []) {
    const fieldName = field.name.value;
    const fieldType = asTypescriptType(
      field.type,
      'Maybe',
      nameRemapping,
      getFieldOverride(objectNode.name.value, fieldName),
    );
    fields.push(`${fieldName}: ${fieldType};`);

    if (!field.arguments?.length) {
      // no args for this field
      continue;
    }

    const argTypeName = buildNameForFieldArgs(
      objectNode.name.value,
      field.name.value,
    );
    argTypes.push(
      `export type ${argTypeName} = ${buildFieldArgsType(field.arguments)};`,
    );
  }

  return [
    ...argTypes,
    `export type ${objectNode.name.value} = ${objectType(fields)};`,
  ].join('\n\n');
}

function buildFieldArgsType(args: readonly InputValueDefinitionNode[]): string {
  const fields: string[] = [];
  for (const arg of args) {
    const fieldName = arg.name.value;
    const fieldType = asTypescriptType(arg.type);
    fields.push(`${fieldName}: ${fieldType};`);
  }
  return objectType(fields);
}
