import type {
  ElementIdentifierVersion,
  JsonObject,
} from 'common/types/index.ts';
import { ElementIdentifierMatch } from 'common/types/index.ts';
import v1 from 'external/src/delegate/location/elementIdentifier/version1.ts';
import v2 from 'external/src/delegate/location/elementIdentifier/version2.ts';

export const CURRENT_ELEMENT_IDENTIFIER_VERSION: ElementIdentifierVersion = '2';

const identifierFunctionByVersion: {
  [key in ElementIdentifierVersion]: (
    element: Element,
  ) => JsonObject | undefined;
} = {
  '1': v1.getElementIdentifierV1,
  '2': v2.getElementIdentifierV2,
};

const elementIdentityMatcherFnByVersion: {
  [key in ElementIdentifierVersion]: (
    element: Element,
    hashObj: JsonObject,
    includeContainingListItemBehaviour?: boolean,
  ) => ElementIdentifierMatch;
} = {
  '1': v1.elementIdentityMatcherV1,
  '2': v2.elementIdentityMatcherV2,
};

export function getElementIdentifier(element: Element) {
  const identifier =
    identifierFunctionByVersion[CURRENT_ELEMENT_IDENTIFIER_VERSION](element);
  if (!identifier) {
    return undefined;
  }
  return { identifier, version: CURRENT_ELEMENT_IDENTIFIER_VERSION };
}
export function matchElementIdentity(
  element: Element,
  identifier: JsonObject | undefined,
  version: ElementIdentifierVersion | undefined,
  includeContainingListItemBehaviour?: boolean,
) {
  if (!identifier || !version) {
    return ElementIdentifierMatch.NONE;
  }
  return elementIdentityMatcherFnByVersion[version](
    element,
    identifier,
    includeContainingListItemBehaviour,
  );
}
