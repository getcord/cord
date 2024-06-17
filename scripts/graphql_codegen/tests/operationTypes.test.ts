import { parse } from 'graphql';
import { prettify } from 'scripts/graphql_codegen/common.ts';
import {
  exportOperationTypes,
  exportQueryDefinitionTypes,
} from 'scripts/graphql_codegen/operationTypes.ts';
import { trimAndExpect } from 'scripts/graphql_codegen/tests/util.ts';

const schema = parse(`
  type Query {
    me: User!
    user(id: UUID!): User
    bestFriend: Animal
  }

  type Mutation {
    changeName(name: String!): Boolean
  }

  type Subscription {
    newFollowers: User!
  }

  union Animal = Cat | Dog | User

  type User {
    id: UUID!
    name: String
    followers: [User]!
  }

  type Cat {
    milkLevel: Int!
    kittens: Int!
  }

  type Dog {
    boneLocation: String,
    puppies: Int!,
  }

  `);

test('generate type for fragment', () => {
  const fragment = parse(`
  fragment UserFragment on User {
    id
    name
  }`);

  const got = exportOperationTypes(schema, [fragment]);
  trimAndExpect(
    got,
    `
  export type UserFragment = {
    id: UUID;
    name: Nullable<string>;
  };`,
  );
});

test('generate query without fragment', () => {
  const query = parse(`
  query NamesOfFollowers {
    me {
      id
      followers {
        name
      }
    }
  }`);
  const got = exportOperationTypes(schema, [query]);
  trimAndExpect(
    got,
    `export type NamesOfFollowersQueryResult = {
      me: {
        id: UUID;
        followers: Array<Nullable<{
          name: Nullable<string>;
          }>>;
        };
      };`,
  );
});

test('query with fragment', () => {
  const fragment = parse(`
  fragment UserFragment on User {
    name
  }`);

  const query = parse(`
  query UserName {
    me {
      ...UserFragment
    }
  }`);

  const got = exportOperationTypes(schema, [fragment, query]);
  trimAndExpect(
    got,
    `
  export type UserFragment = {
    name: Nullable<string>;
  };

  export type UserNameQueryResult = {
    me: UserFragment;
  };`,
  );
});

test('mutation operation', () => {
  const mutation = parse(`
  mutation SetMyName($newName: String!) {
    changeName(name: $newName)
  }`);

  const got = exportOperationTypes(schema, [mutation]);
  trimAndExpect(
    got,
    `
  export type SetMyNameMutationResult = {
      changeName: Nullable<boolean>;
  };

  export type SetMyNameMutationVariables = {
      newName: string;
  };`,
  );
});

test('subscription operation', () => {
  const subscription = parse(`
  subscription NewFollowers {
    newFollowers {
      __typename
      name
    }
  }`);

  const got = exportOperationTypes(schema, [subscription]);
  trimAndExpect(
    got,
    `
    export type NewFollowersSubscriptionResult = {
        newFollowers: {
          __typename: 'User';
          name: Nullable<string>;
        };
    };`,
  );
});

test('union types', () => {
  const fragment = parse(`
  fragment DogFragment on Dog {
    boneLocation
  }`);

  const query = parse(`
  query BestFriend {
    bestFriend {
      __typename
      ... on User {
        name
      }
      ... on Dog {
        ...DogFragment
        puppies
      }
    }
  }
  `);

  const got = exportOperationTypes(schema, [fragment, query]);
  trimAndExpect(
    got,
    `
    export type DogFragment = {
      boneLocation: Nullable<string>;
    };

    export type BestFriendQueryResult = {
      bestFriend: Nullable<{ __typename: 'Cat'; } | DogFragment & {
          __typename: 'Dog';
          puppies: Int;
        } | {
          __typename: 'User';
          name: Nullable<string>;
        }>;
    };
  `,
  );
});

test('exportQueryDefinitionTypes', async () => {
  const operations = [
    `query NamesOfFollowers {
      me {
        id
        followers {
          name
        }
      }
    }
  `,

    `mutation SetPreference($key: String!, $value: JSON!) {
      setPreference(key: $key, value: $value)
    }
  `,

    `subscription NewFollowers {
      newFollowers {
        __typename
        name
      }
    }
  `,
  ].map((x, idx) => ({ filename: `${idx}.graphql`, contents: parse(x) }));
  const outputRaw = exportQueryDefinitionTypes(operations);

  const expectedRaw = `
  export type QueryTypes = {
    NamesOfFollowersQuery: {
      variables: Record<string, never>;
      result: NamesOfFollowersQueryResult;
    };
  };
  export const queries: Record<keyof QueryTypes, DocumentNode> = {
    NamesOfFollowersQuery: NamesOfFollowersQuery,
  };

  export type MutationTypes = {
    SetPreferenceMutation: {
      variables: SetPreferenceMutationVariables;
      result: SetPreferenceMutationResult;
    };
  };
  export const mutations: Record<keyof MutationTypes, DocumentNode> = {
    SetPreferenceMutation: SetPreferenceMutation,
  };

  export type SubscriptionTypes = {
    NewFollowersSubscription: {
      variables: Record<string, never>;
      result: NewFollowersSubscriptionResult;
    };
  };
  export const subscriptions: Record<keyof SubscriptionTypes, DocumentNode> = {
    NewFollowersSubscription: NewFollowersSubscription,
  };
  `;

  const output = await prettify(outputRaw.replace(/\n\n+/g, '\n'));
  const expected = await prettify(expectedRaw.replace(/\n\n+/g, '\n'));

  expect(output).toBe(expected);
});
