import { isEmpty } from 'radash';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { ElementIdentifierMatch } from 'common/types/index.ts';
import {
  generateSalt,
  doesTextQualify,
  md5Hash,
  prepareTextContent,
  sha256HashAndSalt,
  getSha256Salt,
} from 'common/util/index.ts';

// TODO for next version
//- Img should hash src, not textContent

type ElementHashedProperties = {
  // This normally contains `${hashtype}:${salt}:${hash}`, where hashtype is
  // always "sha256" currently.  Older annotations may contain just an MD5 hash
  // (with no hashtype or salt), which continue to be recognized for
  // compatibility, but are no longer created.
  textContent: string;
  nodeName?: string;
};

export type ElementIdentifierV2 = {
  self?: ElementHashedProperties;
  closestHashableAncestor?: ElementHashedProperties;
  containingListItem?: ElementHashedProperties;
};

export default {
  getElementIdentifierV2,
  elementIdentityMatcherV2,
};

function getElementIdentifierV2(
  element: Element,
): ElementIdentifierV2 | undefined {
  const salt = generateSalt();
  const elementIdentifier: ElementIdentifierV2 = {};
  const selfHashedProperties = getElementHashedProperties(element, salt);
  if (selfHashedProperties) {
    elementIdentifier.self = selfHashedProperties;
  }

  if (!selfHashedProperties) {
    const closestAncestorHashedProperties = getClosestAncestorHashedProperties(
      element,
      salt,
    );
    if (closestAncestorHashedProperties) {
      elementIdentifier.closestHashableAncestor =
        closestAncestorHashedProperties;
    }
  }

  if (isEmpty(elementIdentifier)) {
    return undefined;
  }

  const listItemHashedProperties = getContainingListItemHashedProperties(
    element,
    salt,
  );
  if (listItemHashedProperties) {
    elementIdentifier.containingListItem = listItemHashedProperties;
  }

  return elementIdentifier;
}

function elementIdentityMatcherV2(
  element: Element,
  identifier: ElementIdentifierV2,
  includeContainingListItemBehaviour?: boolean,
) {
  if (isEmpty(identifier)) {
    return ElementIdentifierMatch.NONE;
  }
  if (identifier.self) {
    if (
      !isEqual(
        getElementHashedProperties(
          element,
          getSha256Salt(identifier.self.textContent),
        ),
        identifier.self,
      )
    ) {
      return ElementIdentifierMatch.NONE;
    }
  }
  if (identifier.closestHashableAncestor) {
    if (
      !isEqual(
        getClosestAncestorHashedProperties(
          element,
          getSha256Salt(identifier.closestHashableAncestor.textContent),
        ),
        identifier.closestHashableAncestor,
      )
    ) {
      return ElementIdentifierMatch.NONE;
    }
  }
  if (identifier.containingListItem && includeContainingListItemBehaviour) {
    if (
      !isEqual(
        getContainingListItemHashedProperties(
          element,
          getSha256Salt(identifier.containingListItem.textContent),
        ),
        identifier.containingListItem,
      )
    ) {
      return ElementIdentifierMatch.PARTIAL;
    }
  }
  return ElementIdentifierMatch.EXACT;
}

function getElementHashedProperties(element: Element, salt: string) {
  const { innerText } = element as HTMLElement;
  if (innerText && doesTextQualify(innerText)) {
    return {
      textContent: hash(prepareTextContent(innerText), salt),
      nodeName: element.nodeName,
    };
  } else {
    return null;
  }
}

function hash(value: string, salt: string) {
  if (salt === '') {
    return md5Hash(value);
  } else {
    return sha256HashAndSalt(value, salt);
  }
}

function getClosestAncestorHashedProperties(element: Element, salt: string) {
  let ancestor = element.parentElement;
  while (ancestor) {
    const hashedProperties = getElementHashedProperties(ancestor, salt);
    if (hashedProperties) {
      return hashedProperties;
    }
    ancestor = ancestor.parentElement;
  }
  return null;
}

function getContainingListItemHashedProperties(element: Element, salt: string) {
  let containingListItem: Element | null = null;
  let parent = element.parentElement;
  // If element is inside a <li> element, use that
  // If inside multiple <li>s, use the second up
  // We assume that if multiple <li>s, the first is likely to be a small element
  // e.g. short text / icon - neither of which is robust enough to check for an exact element match
  let listItemCount = 0;
  while (parent) {
    if (parent.nodeName === 'LI') {
      listItemCount++;
      containingListItem = parent;
      if (listItemCount === 2) {
        break;
      }
    }
    parent = parent.parentElement;
  }
  if (!containingListItem) {
    // Otherwise, look for an element that has siblings with identical classNames
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    let parent = element.parentElement;
    while (parent) {
      const prevSibling = parent.previousElementSibling;
      const nextSibling = parent.nextElementSibling;
      if (
        (prevSibling && areElementsEffectivelyListItems(prevSibling, parent)) ||
        (nextSibling && areElementsEffectivelyListItems(parent, nextSibling))
      ) {
        containingListItem = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }
  return containingListItem
    ? getElementHashedProperties(containingListItem, salt)
    : null;
}

function areElementsEffectivelyListItems(elementA: Element, elementB: Element) {
  return (
    elementA.className === elementB.className &&
    elementA.nodeName === elementB.nodeName
  );
}
