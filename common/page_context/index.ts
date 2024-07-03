import type { UrlWithParsedQuery } from 'url';

import type { PageDetails } from 'common/types/index.ts';
import { getDocumentTitle } from 'common/page_context/util.ts';

export interface CleanUrl extends UrlWithParsedQuery {
  // this is a dummy field whose only purpose is to make CleanUrl
  // type different from UrlWithParsedQuery type. This way if you want to
  // construct a page context, the typechecker will warn you if you forget to
  // call cleanupURL.
  cleanedUp: true;
}

export const URL_MATCHING_OPTIONS = {
  segmentValueCharset: 'a-zA-Z0-9-_~ %.!@():',
};

export function getDetailsForProviderlessPage(pageUrl: string): PageDetails {
  return {
    pageContext: {
      providerID: null,
      data: { location: pageUrl },
    },
    pageName: getDocumentTitle(document) ?? null,
  };
}
