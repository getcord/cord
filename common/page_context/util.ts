import type { UrlWithParsedQuery } from 'url';
import { parse } from 'url';

import type { Location } from 'common/types/index.ts';
import type { CleanUrl } from 'common/page_context/index.ts';
import { CORD_ARGS_TO_REMOVE } from 'common/util/index.ts';

export type PageContextNameFunction = (
  data: Location,
  document?: Document,
) => string;

const inboxCountPrefixRegex = /^(\([0-9]+\)) (.+)$/;

export function stripInboxCountPrefix(title: string) {
  const trimmedTitle = title.trim();
  const match = trimmedTitle.match(inboxCountPrefixRegex);
  if (!match) {
    return trimmedTitle;
  }

  if (match[2]) {
    return match[2].trim();
  }

  return trimmedTitle;
}

function parsedURL(url: string) {
  return parse(url, true);
}

export function cleanupURL(url: string): CleanUrl {
  const parsed = parsedURL(url);
  return removeCordArgs(parsed);
}

function removeCordArgs(url: UrlWithParsedQuery): CleanUrl {
  for (const arg of CORD_ARGS_TO_REMOVE) {
    delete url.query[arg];
  }
  if (url.search) {
    const params = new URLSearchParams(url.search);
    for (const arg of CORD_ARGS_TO_REMOVE) {
      params.delete(arg);
    }
    const newSearch = params.toString();
    if (newSearch) {
      url.search = '?' + newSearch;
    } else {
      url.search = '';
    }
  }
  return { ...url, cleanedUp: true };
}

export const contextDataToString = (data: any) =>
  typeof data === 'object'
    ? Object.entries(data)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';

export const DefaultPageContextNameFunction: PageContextNameFunction = (
  data,
  document,
) => getDocumentTitle(document) || contextDataToString(data);

export function getDocumentTitle(document: Document | undefined) {
  const metaElement =
    document?.head?.querySelector("meta[property='cord:title']") ||
    document?.head?.querySelector("meta[name='cord:title']");

  return metaElement?.getAttribute('content') ?? document?.title;
}
