import type { UUID } from 'common/types/index.ts';

interface EntityWithID {
  id: UUID;
}

function indexedMap<T>(entities: T[], f: (e: T) => string): Map<string, T> {
  const m = new Map<string, T>();
  entities.forEach((e) => m.set(f(e), e));
  return m;
}

function indexedMapGrouped<T>(
  entities: T[],
  f: (e: T) => string,
): Map<string, T[]> {
  const m = new Map<string, T[]>();
  entities.forEach((e) => {
    const k = f(e);
    let values = m.get(k);
    if (values === undefined) {
      values = [];
      m.set(k, values);
    }
    values.push(e);
  });
  return m;
}

export function inKeyOrder<T extends EntityWithID>(
  entities: T[],
  keys: readonly UUID[],
): (T | null)[] {
  return inKeyOrderCustom(entities, keys, (e) => e.id);
}

function inKeyOrderCustom<T>(
  entities: T[],
  keys: readonly UUID[],
  f: (e: T) => string,
): (T | null)[] {
  const m = indexedMap(entities, f);
  return keys.map((k) => m.get(k) ?? null);
}

export function inKeyOrderOrNull<T extends EntityWithID>(
  entities: T[],
  keys: readonly UUID[],
): (T | null)[] {
  return inKeyOrderOrNullCustom(entities, keys, (e) => e.id);
}

export function inKeyOrderOrNullCustom<T>(
  entities: T[],
  keys: readonly UUID[],
  f: (e: T) => string,
): (T | null)[] {
  const m = indexedMap(entities, f);
  return keys.map((k) => m.get(k) ?? null);
}

export function inKeyOrderGrouped<T extends EntityWithID>(
  entities: T[],
  keys: readonly UUID[],
): T[][] {
  return inKeyOrderGroupedCustom(entities, keys, (e) => e.id);
}

export function inKeyOrderGroupedCustom<T>(
  entities: T[],
  keys: readonly UUID[],
  f: (e: T) => string,
): T[][] {
  const m = indexedMapGrouped(entities, f);
  return keys.map((k) => m.get(k) ?? []);
}
