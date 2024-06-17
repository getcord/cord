import type { RequestInit, Response } from 'node-fetch';
import nodeFetch from 'node-fetch';
import { manageConnection } from 'server/src/util/third_party/ssrf-req-filter.mjs';

/**
 * Equivalent of fetch(), but safe to use on URLs provided by external users. If
 * you are fetching a URL provided by an end user, you MUST use this function.
 */
export async function safeFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return await nodeFetch(url, { ...init, agent: manageConnection(url) });
}
