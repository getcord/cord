import { isEmpty } from 'radash';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { ElementIdentifierMatch } from 'common/types/index.ts';
import { md5Hash } from 'common/util/index.ts';

type ElementHashedProperties = {
  textContent?: string;
  href?: string;
};

type ElementIdentifier = {
  self?: ElementHashedProperties;
  closestHashableAncestor?: ElementHashedProperties;
};

export default {
  getElementIdentifierV1,
  elementIdentityMatcherV1,
};

function getElementIdentifierV1(
  element: Element,
): ElementIdentifier | undefined {
  const selfHashedProperties = getElementHashedProperties(element);
  if (selfHashedProperties) {
    return { self: selfHashedProperties };
  }

  const closestAncestorHashedProperties =
    getClosestAncestorHashedProperties(element);
  if (closestAncestorHashedProperties) {
    return {
      closestHashableAncestor: closestAncestorHashedProperties,
    };
  }

  return undefined;
}

function elementIdentityMatcherV1(
  element: Element,
  identifier: ElementIdentifier,
) {
  return isEqual(getElementIdentifierV1(element), identifier)
    ? ElementIdentifierMatch.EXACT
    : ElementIdentifierMatch.NONE;
}

function getElementHashedProperties(element: Element) {
  const { textContent, href } = element as any;
  const hashedProperties: ElementHashedProperties = {};
  if (doesTextQualify(textContent)) {
    hashedProperties.textContent = md5Hash(prepareTextContent(textContent));
  }
  if (doesTextQualify(href)) {
    hashedProperties.href = md5Hash(href);
  }
  return !isEmpty(hashedProperties) ? hashedProperties : null;
}

function prepareTextContent(textContent: string) {
  return textContent.trim().toLowerCase();
}

function getClosestAncestorHashedProperties(element: Element) {
  let ancestor = element.parentElement;
  while (ancestor) {
    const hashedProperties = getElementHashedProperties(ancestor);
    if (hashedProperties) {
      return hashedProperties;
    }
    ancestor = ancestor.parentElement;
  }
  return null;
}

function doesTextQualify(text: string | undefined | null) {
  return Boolean(text && text.length > 1 && text.trim());
}
