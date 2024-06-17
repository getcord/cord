import { parse } from 'graphql';
import { exportResolverTypes } from 'scripts/graphql_codegen/resolverTypes.ts';
import { trimAndExpect } from 'scripts/graphql_codegen/tests/util.ts';

test('generate simple resolver', () => {
  const schema = parse(`
  type User {
    id: UUID!
    name: String
    friends(count: Int!): [User!]!
  }`);

  const got = exportResolverTypes(schema);
  trimAndExpect(
    got,
    `
type UserResolver = {
  id: (parent: M['User'], args: Record<string, never>, context: RequestContext) => M['UUID'] | Promise<M['UUID']>;
  name: (parent: M['User'], args: Record<string, never>, context: RequestContext) => Maybe<M['String']> | Promise<Maybe<M['String']>>;
  friends: (parent: M['User'], args: UserFriendsArgs, context: RequestContext) => Array<M['User']> | Promise<Array<M['User']>>;
}

export type Resolvers = {
  User: MakeExistingFieldsOptional<UserResolver, User, M['User']>;
};`,
  );
});

test('generate subscription resolver', () => {
  const schema = parse(`
  type Subscription {
    presenceStolen: Boolean!
  }
  `);

  const got = exportResolverTypes(schema);

  trimAndExpect(
    got,
    `
type SubscriptionResolver = {
  presenceStolen: {
      subscribe: (parent: Record<string, never>, args: Record<string, never>, context: RequestContext) => any | Promise<any>
      resolve: (parent: any, args: Record<string, never>, context: RequestContext) => M['Boolean'] | Promise<M['Boolean']>
    };
}

export type Resolvers = {
  Subscription: MakeExistingFieldsOptional<SubscriptionResolver, Subscription, M['Subscription']>;
}; `,
  );
});

test('generate type resolver', () => {
  const schema = parse(`
  union ChannelEvent = ChannelMessageAdded | ChannelMessageUpdated | ChannelMessageRemoved
  `);
  const got = exportResolverTypes(schema);
  trimAndExpect(
    got,
    `
type ChannelEventResolver = {
  __resolveType: (parent: M['ChannelEvent'], context: RequestContext) => 'ChannelMessageAdded' | 'ChannelMessageUpdated' | 'ChannelMessageRemoved';
}

export type Resolvers = {
  ChannelEvent: ChannelEventResolver;
};
`,
  );
});
