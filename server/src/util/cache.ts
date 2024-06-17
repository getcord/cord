import NodeCache from 'node-cache';
import jsonStableStringify from 'fast-json-stable-stringify';

// This will probably eventually be moved to redis or something.
// For now it's basically memcached.

export const cache = new NodeCache();

export async function cachedResult<T>(
  valueGenerator: () => Promise<T>,
  key: string,
  timeToLiveSeconds = 0,
): Promise<T> {
  let value = cache.get<T>(key);
  if (value === undefined) {
    // TODO: concurrent cache misses will cause multiple generator awaits
    // debounce them somehow
    value = await valueGenerator();
    cache.set(key, value, timeToLiveSeconds);
  }

  return value;
}

export function cacheKey(
  data: Record<string, string | number | boolean>,
): string {
  return jsonStableStringify(data);
}
