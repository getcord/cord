// Adapted from https://github.com/apollographql/graphql-subscriptions/blob/master/src/with-filter.ts

import { $$asyncIterator } from 'iterall';
import type {
  ResolverFn,
  TransformFn,
} from 'server/src/public/subscriptions/util/common.ts';

interface IterallAsyncIterator<T> extends AsyncIterator<T> {
  [$$asyncIterator](): IterallAsyncIterator<T>;
}

/**
 * Given a function that returns an async iterator, produces a function that
 * returns an async iterator where the results of the original iterator are
 * transformed according to the transformation function.
 */
export function withTransformation<T, U>(
  asyncIteratorFn: ResolverFn<T>,
  transformFn: TransformFn<T, U>,
): ResolverFn<U> {
  return (
    rootValue: T,
    args: any,
    context: any,
    info: any,
  ): IterallAsyncIterator<any> => {
    const asyncIterator = asyncIteratorFn(rootValue, args, context, info);

    return {
      next() {
        return new Promise<IteratorResult<U>>((resolve, reject) => {
          asyncIterator
            .next()
            .then((payload) => {
              if (payload.done === true) {
                resolve(payload);
                return;
              }
              Promise.resolve(transformFn(payload.value, args, context, info))
                .then((newResult) => resolve({ done: false, value: newResult }))
                .catch((err) => reject(err));
            })
            .catch((err) => {
              reject(err);
              return;
            });
        });
      },
      return() {
        return asyncIterator.return!();
      },
      throw(error) {
        return asyncIterator.throw!(error);
      },
      [$$asyncIterator]() {
        return this;
      },
    };
  };
}
