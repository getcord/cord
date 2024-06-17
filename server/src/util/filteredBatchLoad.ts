import type { Attributes, FindOptions, Model, ModelStatic } from 'sequelize';
import { isDefined } from 'common/util/index.ts';
import { asyncFilter } from 'common/util/asyncFilter.ts';

type Result<T, U> = {
  items: T[];
  token: U;
  hasMore: boolean;
};

/**
 * Load items one batch/page at a time, filtering as we go, attempting to end up
 * with a fixed number of items in the end.
 *
 * @param loadBatch Load a single batch/page of items. Takes a pagination token
 * and a target number of items to load. Returns a batch of items along with
 * pagination information.
 *
 * @param filterItem Determine if a particular item is valid. Return `true` if
 * the item is valid, `false` to remove it (same as List.filter).
 *
 * @param initialToken The initial pagination token to start the first batch at.
 *
 * @param limit How many items we ultimately would like.
 *
 * @returns The final batch of items along with pagination information.
 */
export async function filteredBatchLoad<T, U>(
  loadBatch: (token: U, limit: number | undefined) => Promise<Result<T, U>>,
  filterItem: (item: T) => Promise<boolean>,
  initialToken: U,
  limit: number | null | undefined,
): Promise<Result<T, U>> {
  const result: Result<T, U> = {
    items: [],
    hasMore: true,
    token: initialToken,
  };

  while (result.hasMore && (!isDefined(limit) || result.items.length < limit)) {
    const next = await loadBatch(result.token, limit ?? undefined);
    const filteredItems = await asyncFilter(next.items, filterItem);
    result.items.push(...filteredItems);
    result.hasMore = next.hasMore;
    result.token = next.token;
  }

  if (isDefined(limit) && result.items.length > limit) {
    result.items = result.items.slice(0, limit);
    result.hasMore = true;
  }

  return result;
}

export async function findFirstEntity<M extends Model>(
  model: ModelStatic<M>,
  options: FindOptions<Attributes<M>>,
  filterItem: (item: M) => Promise<boolean>,
): Promise<M | undefined> {
  const batch = await filteredBatchLoad(
    async (offset, limit) => {
      const items = await model.findAll({ ...options, offset, limit });
      return {
        items,
        token: offset + (limit ?? 0),
        hasMore: items.length === limit,
      };
    },
    filterItem,
    0,
    1,
  );

  return batch.items[0];
}
