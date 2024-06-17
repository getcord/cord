// TODO(flooey): Tighten up the typing here

export type ResolverFn<T> = (
  rootValue?: any,
  args?: any,
  context?: any,
  info?: any,
) => AsyncIterator<T>;

export type TransformFn<T, U> = (
  rootValue: T,
  args?: any,
  context?: any,
  info?: any,
) => U | Promise<U>;

export type FilterFn<T> = (
  rootValue: T,
  args?: any,
  context?: any,
  info?: any,
) => boolean | Promise<boolean>;
