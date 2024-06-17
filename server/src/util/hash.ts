import { v5 as uuidv5 } from 'uuid';
import jsonStableStringify from 'fast-json-stable-stringify';
import type { Location, JsonValue, PageContext } from 'common/types/index.ts';

const RADICAL_UUID_NAMESPACE = uuidv5('getradical.co', uuidv5.DNS);

// hash a scalar or an object using uuid v5: https://stackoverflow.com/a/28776880
// if the input is an object, the keys will be presorted to ensure consistency.
// example: {a: 1, b: 2} will hash the same as {b: 2, a: 1}
export const uuidHash = (object: JsonValue) =>
  uuidv5(jsonStableStringify(object), RADICAL_UUID_NAMESPACE);

function isLocationOnly(data: Location) {
  return 'location' in data && Object.keys(data).length === 1;
}

// this is the function that decides what the contextHash and contextData of a
// PageEntity will be
export function getPageContextHash(
  pageContext: PageContext,
): readonly [string, Location] {
  let hashInput = null;
  if (isLocationOnly(pageContext.data)) {
    // Backwards compatibility for previous scheme
    hashInput = {
      location: pageContext.data.location,
      data: null,
    };
  } else {
    hashInput = {
      providerID: null,
      data: pageContext.data,
    };
  }
  return [uuidHash(hashInput), pageContext.data] as const;
}
