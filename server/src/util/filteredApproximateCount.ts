import type { GroupedCountResultItem } from 'sequelize';
import { asyncFilter } from 'common/util/asyncFilter.ts';

const CUTOFF = 50;
export const NUM_SAMPLE_ITEMS = CUTOFF;

/**
 * Compute a count of items in the case where some of the items will be filtered
 * out (and so shouldn't be counted), but that filtering is expensive, and so we
 * want to make an approximate count. An example is counting the number of
 * messages in a thread: with the new permission model, you might not be able to
 * see all of them, but we don't want to load every single message in the thread
 * in order to check that.
 *
 * @param unfilteredCount The unfiltered count.
 * @param sampleItems An arbitrary sampling of the items which we are counting.
 *   Must be at least `NUM_SAMPLE_ITEMS` long, or all the items if there are
 *   fewer than that.
 * @param filterItem Filtering function.
 * @returns The approximated filtered count.
 */
export async function filteredApproximateCount<T>(
  unfilteredCount: number,
  sampleItems: T[],
  filterItem: (item: T) => Promise<boolean>,
): Promise<number> {
  if (
    unfilteredCount >= NUM_SAMPLE_ITEMS &&
    sampleItems.length < NUM_SAMPLE_ITEMS
  ) {
    throw new Error('Not enough items provided');
  }

  if (unfilteredCount < CUTOFF) {
    const rest = await asyncFilter(sampleItems, filterItem);
    return rest.length;
  }

  // TODO: be smarter.
  return unfilteredCount;
}

/**
 * A wrapper around `filteredApproximateCount` for the common case where we are
 * using it on the result of a Sequelize count query (or manual SQL equivalent).
 * Each item in `counts` should have both the `count` field required by the TS
 * types, but also an `items` field containing `NUM_SAMPLE_ITEMS` items in it.
 * (Sequelize's TS types are lacking here so there's no good way to statically
 * enforce that.)
 */
export async function adjustCounts<T extends GroupedCountResultItem, U>(
  unfilteredCounts: T[],
  filterItem: (item: U) => Promise<boolean>,
): Promise<T[]> {
  return await Promise.all(
    unfilteredCounts.map(async (item) => {
      const count = await filteredApproximateCount(
        item.count,
        item.items as U[],
        filterItem,
      );
      return { ...item, count };
    }),
  );
}

/**
 * Returns a bit of SQL which can be used with a count query to get a sample of
 * the IDs of the elements which were actually counted. This is useful to pass
 * to the functions above, which want both the complete (unfiltered) count and a
 * sampling of items to filter and adjust that count. See its various callsites
 * for examples of how to use with both sequelize and with raw SQL -- it's not
 * hard but much easier to explain by looking at examples than in a docblock.
 *
 * It works using the `array_agg` postgres function. Consider the following SQL
 * for counting messages in a set of threads:
 *     SELECT "threadID", COUNT(1) FROM messages
 *       WHERE "threadID" IN (...) GROUP BY "threadID"
 * But we want the IDs of the messages that were counted. We can't just add "id"
 * to the list of selected columns since we aren't aggregating on that column.
 * What we do instead is this:
 *     SELECT "threadID", COUNT(1), array_agg("id") FROM messages
 *       WHERE "threadID" IN (...) GROUP BY "threadID"
 * Which tells postgres to collect up the aggregated ids into a list and return
 * them to us. This function generates that SQL for you, alongside an array
 * slice so you only get as many IDs as the functions above actually care about,
 * instead of a potentially very long list of everything.
 *
 * Implemented as a function instead of a constant string so that we can add
 * `columnName` as a param later if need be (though I've not done so yet since
 * it's always "id" right now and it means I don't have to worry about SQL
 * escapting/injection issues).
 */
export function countedItems() {
  return `(array_agg("id"))[1:${NUM_SAMPLE_ITEMS}]`;
}
