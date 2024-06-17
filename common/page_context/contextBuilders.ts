import type { UrlWithParsedQuery } from 'url';
import { decode } from 'js-base64';

import type { Location, JsonObject } from 'common/types/index.ts';
import {
  trimAndCollapseWhitespace,
  compile,
} from 'common/page_context/templating/index.ts';

export type PageContextDataFunction = (
  matches: Record<string, string>,
  url: UrlWithParsedQuery,
  element: HTMLElement | undefined,
) => Location;

export const contextBuilders: Record<
  string,
  ((data: JsonObject | null) => PageContextDataFunction) | undefined
> = {
  default: () => (matches) => matches,
  replace: (data) => (matches, url, element) =>
    data === null
      ? {}
      : processContext(data, { url: { ...url }, element, ...matches }),
  extend: (data) => (matches, url, element) =>
    data === null
      ? matches
      : {
          ...matches,
          ...processContext(data, { url: { ...url }, element, ...matches }),
        },
  metabase: () => (_matches, url) => {
    const base64context = url.hash!.substring(1);
    return dotify(normalizeValuesToStrings(JSON.parse(decode(base64context))));
  },
};

function processContext(obj: JsonObject, env: any): Location {
  const result: Location = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = trimAndCollapseWhitespace(compile(value)(env));
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      result[key] = value;
    }
  }

  return result;
}

// Helper function for the 'metabase' context builder:
// this is necessary because sometimes the serialized query contains ids as
// strings and other times as numbers, which would lead to different contexts.
// i wonder if this should be in the stable UUID hash code instead?
function normalizeValuesToStrings(object: any): any {
  if (object === null || object === undefined) {
    return object;
  }
  if (typeof object === 'string') {
    return object;
  }
  if (typeof object === 'number') {
    return object.toString();
  }
  if (typeof object === 'boolean') {
    return object.toString();
  }
  if (Array.isArray(object)) {
    return object.map(normalizeValuesToStrings);
  }

  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      normalizeValuesToStrings(value),
    ]),
  );
}

function dotify(object: any): Location {
  const result: Location = {};
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  function dotify_internal(object: any, prefix?: string) {
    for (const key in object) {
      const value = object[key];
      const nextPrefix = prefix ? prefix + '.' + key : key;
      if (typeof value === 'object') {
        dotify_internal(value, nextPrefix);
      } else {
        result[nextPrefix] = value;
      }
    }
  }
  dotify_internal(object);
  return result;
}
