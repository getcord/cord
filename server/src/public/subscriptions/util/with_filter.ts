import { withFilter as originalWithFilter } from 'graphql-subscriptions';
import type {
  ResolverFn,
  FilterFn,
} from 'server/src/public/subscriptions/util/common.ts';

export function withFilter<T>(
  asyncIteratorFn: ResolverFn<T>,
  filterFn: FilterFn<T>,
) {
  return originalWithFilter(asyncIteratorFn, filterFn);
}
