import type { UrlWithParsedQuery } from 'url';
import { parse, format } from 'url';
import UrlPattern from 'url-pattern';

import type {
  Location,
  MatchResult,
  PageContextTransformation,
  PageDetails,
  RuleProvider,
  ProviderRule,
} from 'common/types/index.ts';
import {
  DefaultPageContextNameFunction,
  getDocumentTitle,
} from 'common/page_context/util.ts';
import { templateToNameFunction } from 'common/page_context/templating/index.ts';
import type { PageContextDataFunction } from 'common/page_context/contextBuilders.ts';
import { contextBuilders } from 'common/page_context/contextBuilders.ts';
import { trim, trimStart, trimEnd } from '@cord-sdk/react/common/lib/trim.ts';

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

const QUERY_PARAM_MATCHING_OPTIONS = {
  segmentValueCharset: 'a-zA-Z0-9-_~ %.!/:}{"@)(,\\]\\[',
};

// we set this as default pattern instead of * so that the domain matching doesn't
// extend past the / and into the path.
const DOMAIN_DEFAULT_SEGMENT_NAME = '0';

export function matchURLAgainstRule(
  rule: ProviderRule,
  url: CleanUrl,
  document?: Document,
): Location | undefined {
  const { matchPatterns } = rule;

  const ruleProtocol = matchPatterns.protocol || 'http(s)';
  const ruleDomain = matchPatterns.domain || `:${DOMAIN_DEFAULT_SEGMENT_NAME}`;
  const rulePath = matchPatterns.path || '*';
  const ruleHash = matchPatterns.hash || '*';
  const ruleQueryParams = matchPatterns.queryParams || {};
  const ruleContext = rule.contextTransformation;

  // first try to match the protocol + domain + path

  // ':' is escaped so that it's not assumed to be the start of a named segment
  const patternString = `${ruleProtocol}\\://${ruleDomain}/${trim(
    rulePath,
    '/',
  )}`;

  const urlString = `${url.protocol}//${url.hostname}/${trim(
    url.pathname || '',
    '/',
  )}`;

  let urlMatches: Record<string, string> | null = null;

  try {
    urlMatches = new UrlPattern(patternString, URL_MATCHING_OPTIONS).match(
      urlString,
    );
  } catch (err) {
    // Parsing or matching the pattern threw an exception. Output on console
    // and treat like not matching (`urlMatches` remains null).
    console.error(err);
  }

  if (!urlMatches) {
    // pattern did not match
    return undefined;
  }

  // if there's also some expectation from the hash, check it
  let hashMatches: Record<string, string> = {};
  if (ruleHash !== '*') {
    if (url.hash === null) {
      // some hash value was expected but nothing is there
      return undefined;
    }

    try {
      const hashPattern = new UrlPattern(ruleHash, URL_MATCHING_OPTIONS);
      hashMatches = hashPattern.match(trimStart(url.hash, '#'));
      if (!hashMatches) {
        // hash did not match
        return undefined;
      }
    } catch (err) {
      // Parsing or matching the pattern threw an exception. Output on console
      // and treat like not matching.
      console.error(err);
      return undefined;
    }
  }

  // if there are some expected query params, check those too
  let queryParamsMatches: Record<string, string> = {};
  const ruleQueryParamsKeys = Object.keys(ruleQueryParams);
  if (ruleQueryParamsKeys.length > 0) {
    for (const ruleQueryParamKey of ruleQueryParamsKeys) {
      // the actual value of the query param present in the URL
      // TODO: the query param value could also be string[], how do we support that?
      const queryParamValue = url.query[ruleQueryParamKey] as
        | string
        | undefined;

      if (queryParamValue === undefined) {
        // the expected query param name isn't present in the URL, fail match
        return undefined;
      }

      // match the query param value against its expected pattern
      let matches: Record<string, string> | null = null;
      try {
        const pattern = new UrlPattern(
          ruleQueryParams[ruleQueryParamKey],
          QUERY_PARAM_MATCHING_OPTIONS,
        );
        matches = pattern.match(queryParamValue);
      } catch (err) {
        // Parsing or matching the pattern threw an exception. Output on console
        // and treat like not matching (`matches` remains null).
        console.error(err);
      }
      if (!matches) {
        // this specific query param value did not match its expected pattern
        return undefined;
      }

      // append any extracted values into the resulting object
      queryParamsMatches = { ...queryParamsMatches, ...matches };
    }
  }

  // if the rule defines some DOM selectors, it should match at least one element
  let element: HTMLElement | undefined;
  if (matchPatterns.selector) {
    if (!document) {
      // if we somehow don't have a document then we shouldn't pretend we can match this rule
      return undefined;
    }

    const selectedElements = document.querySelectorAll<HTMLElement>(
      matchPatterns.selector,
    );
    if (selectedElements.length === 0) {
      // this rule defined a selector that doesn't match anything
      return undefined;
    }

    if (matchPatterns.contains) {
      // this rule also expects the element to include some text
      const textToFind = matchPatterns.contains;
      for (const selectedElement of selectedElements) {
        // find the first selected element that includes said text
        if (selectedElement.textContent?.includes(textToFind)) {
          element = selectedElement;
          break;
        }
      }

      if (!element) {
        // if none were found then the rule fails to match
        return undefined;
      }
    } else {
      element = selectedElements[0];
    }
  }

  const matches = {
    ...urlMatches,
    ...queryParamsMatches,
    ...hashMatches,
  };

  delete matches['_']; // remove the values extracted from wildcards (*, etc)
  delete matches[DOMAIN_DEFAULT_SEGMENT_NAME]; // remove the values extracted from default segments

  return buildContextFunction(ruleContext)(matches, url, element);
}

function buildContextFunction(
  ruleContext: PageContextTransformation | undefined,
): PageContextDataFunction {
  if (ruleContext === undefined) {
    return (matches) => matches;
  }

  const { type, data = {} } = ruleContext;

  const contextBuilder = contextBuilders[type];

  if (contextBuilder === undefined) {
    throw new Error(`Undefined context type '${type}'`);
  } else {
    return contextBuilder(data);
  }
}

function findRuleProviderForDomain(
  domain: string,
  ruleProviders: RuleProvider[],
) {
  for (const ruleProvider of ruleProviders) {
    for (const domainPattern of ruleProvider.domains) {
      const matches = new UrlPattern(domainPattern).match(domain);
      if (matches) {
        return ruleProvider;
      }
    }
  }

  return undefined;
}

export function findRuleProviderForURL(
  url: CleanUrl,
  ruleProviders: RuleProvider[],
) {
  if (!url.hostname) {
    return undefined;
  }

  return findRuleProviderForDomain(url.hostname, ruleProviders);
}

export function getDetailsForURLWithProvider(
  url: CleanUrl,
  ruleProvider: RuleProvider,
  document?: Document,
): MatchResult {
  const pageContext = {
    providerID: ruleProvider.id,
    data: { location: format(url) },
  };

  const domainRules = ruleProvider.rules;
  if (!domainRules) {
    return {
      match: 'none',
      pageContext,
      pageName: getDocumentTitle(document) ?? null,
    };
  }

  if (ruleProvider.mergeHashWithLocation && url.hash) {
    const hashURL =
      'http://localhost/' + trimStart(trimStart(url.hash, '#'), '/');
    const parsedHashURL = parse(hashURL, true); // the true is so it also parses the query params

    url.path = trimEnd(url.path || '', '/') + parsedHashURL.path;
    url.pathname = trimEnd(url.pathname || '', '/') + parsedHashURL.pathname;
    url.query = { ...url.query, ...parsedHashURL.query };
    url.hash = null;
  }

  try {
    for (const rule of domainRules) {
      const context = matchURLAgainstRule(rule, url, document);

      if (context) {
        if (rule.type === 'allow') {
          const nameFunction =
            rule.nameTemplate === null
              ? DefaultPageContextNameFunction
              : templateToNameFunction(rule.nameTemplate);

          return {
            match: 'allow',
            ruleID: rule.id,
            pageContext: {
              ...pageContext,
              data: context,
            },
            pageName: nameFunction(context, document),
          };
        } else {
          return {
            match: 'deny',
            ruleID: rule.id,
            pageContext,
            pageName: getDocumentTitle(document) ?? null,
          };
        }
      }
    }
  } catch (error) {
    console.warn('Could not use Cord context rules, likely due to CSP.');
    return { match: 'none', ...getDetailsForProviderlessPage(format(url)) };
  }

  return {
    match: 'none',
    pageContext,
    pageName: getDocumentTitle(document) ?? null,
  };
}

export function getDetailsForProviderlessPage(pageUrl: string): PageDetails {
  return {
    pageContext: {
      providerID: null,
      data: { location: pageUrl },
    },
    pageName: getDocumentTitle(document) ?? null,
  };
}
