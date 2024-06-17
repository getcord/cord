import type { ASTKindToNode, DefinitionNode, DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import {
  exportEnumType,
  exportInputObjectType,
  exportObjectType,
  exportUnionType,
} from 'scripts/graphql_codegen/baseTypes.ts';

// the extra typescript typing makes it so that e.g. when I do:
// findFirst(schema, 'EnumTypeDefinition') the return value is typed as:
// EnumTypeDefinitionNode
function findFirst<T extends DefinitionNode['kind']>(
  schema: DocumentNode,
  kind: T,
) {
  const definition = schema.definitions.find(
    (node): node is ASTKindToNode[T] => node.kind === kind,
  );
  expect(definition).not.toBeUndefined();
  return definition!;
}

test('export enum type', () => {
  const schema = gql.default(`
enum OrganizationState {
  inactive
  active
}`);
  const got = exportEnumType(findFirst(schema, 'EnumTypeDefinition'));
  expect(got).toBe(`export type OrganizationState = "inactive" | "active";`);
});

test('export input object', () => {
  const schema = gql.default(`
input TaskInput {
  id: UUID!
  done: Boolean!
  assigneeIDs: [UUID!]!
  todos: [TaskTodoInput!]!
  doneStatusUpdate: String
  type: String!
}`);
  const got = exportInputObjectType(
    findFirst(schema, 'InputObjectTypeDefinition'),
  );
  expect(got).toBe(`export type TaskInput = {
id: UUID;
done: boolean;
assigneeIDs: Array<UUID>;
todos: Array<TaskTodoInput>;
doneStatusUpdate: Maybe<string>;
type: string;
};`);
});

test('export union type', () => {
  const schema = gql.default(`
  union UserOrMessage =
   | User
   | Message
  `);

  const got = exportUnionType(findFirst(schema, 'UnionTypeDefinition'), 'M');

  expect(got).toBe(`export type UserOrMessage = M['User'] | M['Message'];`);
});

test('export object type with no args', () => {
  const schema = gql.default(`
  type User {
   id: UUID!
   name: String
   age: Int
   friends: [User!]!
  }`);
  const got = exportObjectType(findFirst(schema, 'ObjectTypeDefinition'), 'M');

  expect(got).toBe(`export type User = {
id: M['UUID'];
name: Maybe<M['String']>;
age: Maybe<M['Int']>;
friends: Array<M['User']>;
};`);
});

test('export object with args', () => {
  const schema = gql.default(`
  type User {
   id: UUID!
   friends(cityId: UUID, likes: [Int]!): [User!]!
  }`);
  const got = exportObjectType(findFirst(schema, 'ObjectTypeDefinition'), 'M');

  expect(got).toBe(`export type UserFriendsArgs = {
cityId: Maybe<UUID>;
likes: Array<Maybe<Int>>;
};

export type User = {
id: M['UUID'];
friends: Array<M['User']>;
};`);
});
