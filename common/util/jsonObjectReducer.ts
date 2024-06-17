import type { JsonObject } from 'common/types/index.ts';

const hasOwnProperty = (obj: JsonObject, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

export type JsonObjectReducerData =
  | { data: JsonObject }
  | { data?: undefined; update?: JsonObject; delete?: string[] };

export function jsonObjectReduce(
  x: JsonObject = {},
  y: JsonObjectReducerData | undefined,
): JsonObject {
  if (!y) {
    return x;
  }
  if (y.data) {
    return y.data;
  }

  const data = { ...x, ...y.update };

  // If a state update lists a key in both `update` and `delete`, it will be
  // deleted.
  if (y.delete) {
    for (const key of y.delete) {
      delete data[key];
    }
  }

  return data;
}

export function mergeJsonObjectReducerData(
  x: JsonObjectReducerData | undefined,
  y: JsonObjectReducerData | undefined,
): JsonObjectReducerData {
  if (y && y.data) {
    // second argument contains full data - that's what we return
    return { data: y.data };
  } else if (x && x.data) {
    // first argument contains full data - apply updates from second argument

    return { data: jsonObjectReduce(x.data, y) };
  } else {
    // neither argument contains full data - combine updates.

    const { update: xu, delete: xd } = x || {};
    const { update: yu, delete: yd } = y || {};

    const del = new Set([
      // delete all keys in x.delete, except if they are in y.update
      ...(xd && yu ? xd.filter((key) => !hasOwnProperty(yu, key)) : xd || []),
      // ...and also all keys in y.delete
      ...(yd || []),
    ]);

    // The update will be the combination of x.update and y.update (with fields
    // in y.update overwriting those in x.update)
    const update = { ...xu, ...yu };
    // ...with all keys removed that are listed in the new `delete` field
    for (const key of del) {
      delete update[key];
    }

    const result: JsonObjectReducerData = { update };
    if (del.size) {
      result.delete = [...del];
    }

    return result;
  }
}
