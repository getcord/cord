import type { DocumentLocation } from 'common/types/index.ts';
import { ElementIdentifierMatch, LocationMatch } from 'common/types/index.ts';
import {
  CURRENT_ELEMENT_IDENTIFIER_VERSION,
  matchElementIdentity,
} from 'external/src/delegate/location/elementIdentifier/index.ts';
import type { ElementIdentifierV2 } from 'external/src/delegate/location/elementIdentifier/version2.ts';
import {
  isIframe,
  isMediaElement,
} from 'external/src/delegate/location/util.ts';
import { isIframeAccessible } from 'external/src/delegate/trackAccessibleIframes.ts';
import {
  CORD_TARGET_ATTRIBUTE_NAME,
  getSelector,
} from 'external/src/lib/getSelector/index.ts';

const SIBLING_MATCH_TIME_LIMIT_MS = 15;

const matchingSiblingSelectorCache: { [selector: string]: string } = {};
const nonUniqueMatchSelectorCache = new Set<string>();
const expensiveMatchCache = new Set<string>();

export function isHidden(element: Element) {
  const rect = element.getBoundingClientRect();
  if (!rect.width && !rect.height) {
    return true;
  }
  return false;
}

export function findTarget({
  location,
  includeContainingListItemBehaviour,
}: {
  location: DocumentLocation;
  includeContainingListItemBehaviour?: boolean;
}): { target: Element | null; matchType: LocationMatch } {
  const targetElement = document.querySelector(location.selector);

  if (targetElement && isHidden(targetElement)) {
    return {
      target: null,
      matchType: LocationMatch.NONE,
    };
  }

  const isStableCordTarget =
    targetElement?.hasAttribute(CORD_TARGET_ATTRIBUTE_NAME) ||
    targetElement?.closest(`[${CORD_TARGET_ATTRIBUTE_NAME}]`);
  if (isStableCordTarget) {
    return { target: targetElement, matchType: LocationMatch.EXACT };
  }

  if (
    targetElement &&
    isIframe(targetElement) &&
    !isIframeAccessible(targetElement)
  ) {
    return {
      target: targetElement,
      matchType: LocationMatch.INACCESSIBLE_CROSS_DOMAIN_IFRAME,
    };
  }

  if (isMediaElement(targetElement)) {
    return {
      target: targetElement,
      matchType: LocationMatch.MULTIMEDIA,
    };
  }

  // If annotation is on a chart, we either return CHART or NONE
  // If CHART, we show a message that it the content may have changed
  // We don't try to match content because chart content changes constantly
  // Hence location.elementIdentifier will be undefined if onChart is true
  if (location.onChart) {
    return {
      target: targetElement,
      matchType: targetElement ? LocationMatch.CHART : LocationMatch.NONE,
    };
  }

  // Return unavailable if:
  // 1) No element identifier (i.e. annotation made before we introduced it)
  // 2) Annotation was made with a later version of the ElementIdentifier
  //    (i.e. the user is on an old version of the extension)
  if (
    !location.elementIdentifier ||
    parseInt(location.elementIdentifier.version) >
      parseInt(CURRENT_ELEMENT_IDENTIFIER_VERSION)
  ) {
    return {
      target: null,
      matchType: LocationMatch.INCOMPATIBLE_IDENTIFIER_VERSION,
    };
  }

  const getElementIdentityMatch = (element: Element) =>
    matchElementIdentity(
      element,
      location.elementIdentifier?.identifier,
      location.elementIdentifier?.version,
      includeContainingListItemBehaviour,
    );

  const identifier =
    location.elementIdentifier &&
    (location.elementIdentifier.identifier as ElementIdentifierV2);

  const matchType = targetElement && getElementIdentityMatch(targetElement);

  if (targetElement) {
    // If exact match, the target is definitely correct
    const exactMatch = matchType === ElementIdentifierMatch.EXACT;
    if (exactMatch) {
      return {
        target: targetElement,
        matchType: LocationMatch.EXACT,
      };
    }
  }

  // If we have previously matched a sibling, try that first to avoid unnecessary calcs
  const previouslyMatchedSiblingSelector =
    matchingSiblingSelectorCache[location.selector];
  if (previouslyMatchedSiblingSelector) {
    const match = document.querySelector(previouslyMatchedSiblingSelector);
    if (
      match &&
      getElementIdentityMatch(match) === ElementIdentifierMatch.EXACT
    ) {
      return {
        target: match,
        matchType: LocationMatch.EXACT,
      };
    }
  }

  // If in a list, the position may have moved - either within the list or to another list
  // Look more broadly for an exact match, and move the target if we find one
  // We don't run this if we've already found that the matching siblings are not unique
  if (
    identifier?.containingListItem &&
    !nonUniqueMatchSelectorCache.has(location.selector) &&
    !expensiveMatchCache.has(location.selector)
  ) {
    const time = performance.now();
    const broadSiblingSelector = location.selector
      .split(' ')
      .map((sel) => sel.replace(/:nth-child\(\d*\)/, ''))
      .join(' ');
    const siblingElements = document.querySelectorAll(broadSiblingSelector);
    const siblingMatches = [...siblingElements].filter(
      (element) =>
        getElementIdentityMatch(element) === ElementIdentifierMatch.EXACT,
    );
    if (siblingMatches.length === 1) {
      const match = siblingMatches[0];
      const matchingSiblingSelector = getSelector(match);
      if (matchingSiblingSelector) {
        matchingSiblingSelectorCache[location.selector] =
          matchingSiblingSelector;
        return {
          target: match,
          matchType: LocationMatch.SIBLING,
        };
      }
    } else if (siblingMatches.length > 1) {
      nonUniqueMatchSelectorCache.add(location.selector);
    }
    if (performance.now() - time > SIBLING_MATCH_TIME_LIMIT_MS) {
      // Expensive check - don't do it again
      expensiveMatchCache.add(location.selector);
    }
  }
  if (!targetElement) {
    return {
      target: null,
      matchType: LocationMatch.NONE,
    };
  } else {
    return {
      target: targetElement,
      matchType:
        matchType === ElementIdentifierMatch.PARTIAL
          ? LocationMatch.MAYBE_STALE
          : LocationMatch.STALE,
    };
  }
}
