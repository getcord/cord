// This file defines a slight modification to the Apollo types used in
// use(LazyQuery|Query|Mutation|Subscritpion). The modifications are trying to
// achieve two things:
// 1) if TVariables is nonempty (ie. graphql operation expects from variables),
//    then the variables field is not optional
// 2) We use ExactMatch type alias, so that typechecker yells at us if we try
//    to pass as variables something that has not only too few fields but also if
//    the variables have extraneous fields
import type {
  FetchResult,
  LazyQueryHookOptions as ApolloLazyQueryHookOptions,
  MutationHookOptions as ApolloMutationHookOptions,
  OperationVariables,
  QueryHookOptions as ApolloQueryHookOptions,
  QueryLazyOptions as ApolloQueryLazyOptions,
  SubscriptionHookOptions as ApolloSubscriptionHookOptions,
  MutationResult as ApolloMutationResult,
  MutationFunctionOptions as ApolloMutationFunctionOptions,
  LazyQueryResult as ApolloLazyQueryResult,
} from '@apollo/client';

// will be "never" if types TGot and TWant are not exactly matching
type ExactMatch<TGot, TWant> = TGot extends TWant
  ? Exclude<keyof TGot, keyof TWant> extends never
    ? TGot
    : never
  : never;

export type QueryHookOptions<
  TData,
  TVariables extends OperationVariables,
  T,
> = Omit<ApolloQueryHookOptions<TData, TVariables>, 'variables'> &
  (Record<string, never> extends TVariables // if variables are empty, make them optional
    ? { variables?: ExactMatch<T, TVariables> }
    : { variables: ExactMatch<T, TVariables> });

export type MutationReturnType<TData, TVariables> = readonly [
  Record<string, never> extends TVariables // if TVariables === {}
    ? <T>(
        options?: MutationFunctionOptions<TData, TVariables, T>,
      ) => Promise<FetchResult<TData>>
    : <T>(
        options: MutationFunctionOptions<TData, TVariables, T>,
      ) => Promise<FetchResult<TData>>,
  ApolloMutationResult<TData>,
];

export type MutationHookOptions<
  TData,
  TVariables extends OperationVariables,
  T,
> = Omit<ApolloMutationHookOptions<TData, TVariables>, 'variables'> &
  (Record<string, never> extends TVariables
    ? { variables?: ExactMatch<T, TVariables> }
    : { variables: ExactMatch<T, TVariables> });

// the options you can pass to the function returned by the useMutation hook
type MutationFunctionOptions<TData, TVariables, T> = Omit<
  ApolloMutationFunctionOptions<TData, TVariables>,
  'variables'
> &
  (Record<string, never> extends TVariables
    ? { variables?: ExactMatch<T, TVariables> }
    : { variables: ExactMatch<T, TVariables> });

// options we pass to useSubscription() hook. See also QueryOptions above
export type SubscriptionHookOptions<
  TData,
  TVariables extends OperationVariables,
  T,
> = Omit<ApolloSubscriptionHookOptions<TData, TVariables>, 'variables'> &
  (Record<string, never> extends TVariables
    ? { variables?: ExactMatch<T, TVariables> }
    : { variables: ExactMatch<T, TVariables> });

export type LazyQueryReturnType<
  TData,
  TVariables extends OperationVariables,
> = [
  <T>(
    options?: QueryLazyOptions<TVariables, T>,
  ) => Promise<ApolloLazyQueryResult<TData, TVariables>>,
  ApolloLazyQueryResult<TData, TVariables>,
];

// the options you can pass to the funtion returned by the useLazyQuery hook
type QueryLazyOptions<TVariables, T> = Omit<
  ApolloQueryLazyOptions<TVariables>,
  'variables'
> &
  (Record<string, never> extends TVariables
    ? { variables?: ExactMatch<T, TVariables> }
    : { variables: ExactMatch<T, TVariables> });

// the options you can pass when calling the useLazyQuery hook
export type LazyQueryHookOptions<
  TData,
  TVariables extends OperationVariables,
  T,
> = Omit<ApolloLazyQueryHookOptions<TData, TVariables>, 'variables'> & {
  variables?: ExactMatch<T, TVariables>;
};
