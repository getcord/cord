import { Buffer } from 'buffer';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type { JsonValue } from 'common/types/index.ts';
import { CORD_COMPONENT_WRAPS_DOM_DATA_ATTRIBUTE } from '@cord-sdk/types';
import type { SuccessResult } from 'server/src/schema/resolverTypes.ts';

export function decodeAccessTokenPayload(
  token: string,
): Record<string, JsonValue> | null {
  try {
    const payloadBase64 = token.split('.')[1] as string | undefined;
    if (!payloadBase64) {
      return null;
    }

    const object = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    if (typeof object !== 'object') {
      return null;
    }

    const { iat: _iat, exp: _exp, ...rest } = object;

    return rest;
  } catch (e) {
    return null;
  }
}

export function accessTokenPayloadsMatch(
  token1: string | undefined,
  token2: string,
) {
  if (!token1) {
    return false;
  }

  try {
    return isEqual(
      decodeAccessTokenPayload(token1),
      decodeAccessTokenPayload(token2),
    );
  } catch (e) {
    return false;
  }
}

export function isEntireSelectionInsideHTMLTag(tagName: string) {
  try {
    const currentRange = window.getSelection()?.getRangeAt(0);

    return currentRange?.commonAncestorContainer.parentElement?.closest(
      tagName,
    );
  } catch {
    return;
  }
}

export function isEntireSelectionInsideCordComponentUI() {
  try {
    const currentRange = window.getSelection()?.getRangeAt(0);

    return currentRange?.commonAncestorContainer.parentElement?.closest(
      `[${CORD_COMPONENT_WRAPS_DOM_DATA_ATTRIBUTE}="true"]`,
    );
  } catch {
    return;
  }
}

/**
 * For as long as we have a shadowRoot, we need to pass
 * our CSS (which is defined outside) to the shadowRoot.
 * When we get rid of shadowRoot, we won't need this.
 */
export function DO_NOT_USE_injectCordCss(target: HTMLElement) {
  const link = document.getElementById('cord_css') as HTMLLinkElement | null;
  if (!link) {
    return;
  }
  const cloneAndAppend = () => {
    target.appendChild(link.cloneNode());
  };

  /**
   * We have zero guarantee the stylesheet has been loaded.
   * We do not want to clone an empty stylesheet, that would mean our component would be unstyled.
   * So we check if loaded:
   * - yes: we clone now
   * - no: we add an event listener to load event and will clone it at that moment.
   **/
  if (link.sheet) {
    cloneAndAppend();
  } else {
    link.addEventListener('load', () => {
      cloneAndAppend();
    });
  }
}

export function handleSuccessResult(result: SuccessResult | undefined): true {
  if (result?.success) {
    return true;
  } else if (result?.failureDetails?.message) {
    throw new Error(result.failureDetails.message);
  } else {
    throwUnknownApiError();
  }
}

export function throwUnknownApiError(): never {
  throw new Error(
    "API call failed, but we don't know why.  Reach out if you need help!",
  );
}

export function convertDateObjectIntoISOString(
  dateObject: Date | undefined,
): string | undefined {
  if (dateObject && !isNaN(dateObject.getTime())) {
    return dateObject.toISOString();
  } else {
    return;
  }
}

const noGroupJSAPIError = 'Must specify a groupID';
const doubleGroupJSAPIError =
  'Must not specify a groupID in the options if the user is signed in with an access token that contains a groupID - choose one or the other';

export function checkGroupIDExists(
  source: string,
  viewerGroupID?: string | null,
  optionsGroupID?: string,
): string {
  if (!!viewerGroupID === !!optionsGroupID) {
    // We only log error if the groupID in the signed token does not match
    // the one added in the options
    if (optionsGroupID && optionsGroupID !== viewerGroupID) {
      throw new Error(`${source}: ${doubleGroupJSAPIError}`);
    }

    if (!optionsGroupID) {
      throw new Error(`${source}: ${noGroupJSAPIError}`);
    }
  }
  // This will always be defined.  The only way it could not be is if both are
  // undefined, and that path will hit the `if (!optionsGroupID)` branch above.
  return (optionsGroupID ?? viewerGroupID)!;
}

type CachedValues<I, E> = {
  [key: string]: { internal: I; external: E };
};

/**
 * The purpose of this cache is to compute and cache the externalized version of
 * internal objects, so that we can reuse them in future callbacks in the JS API
 * and not needlessly cause rerenders.  It will produce a new version of the
 * externalized object each time the internalized object changes, so it relies
 * on the internalized object being properly React-y and only changing when its
 * value changes.  (This is true of ThreadsDataContext and friends.)
 */
export class ExternalizedCache<I extends { id: string }, E> {
  private cached: CachedValues<I, E> = {};
  private externalize: (internal: I) => E;

  constructor(externalize: (internal: I) => E) {
    this.externalize = externalize;
  }

  get(internal: I): E {
    if (internal.id in this.cached) {
      const cachedValue = this.cached[internal.id];
      // This is the key point: as long as the internal object doesn't change,
      // continue returning the cached value
      if (cachedValue.internal === internal) {
        return cachedValue.external;
      }
    }
    const newValue = { internal, external: this.externalize(internal) };
    this.cached[internal.id] = newValue;
    return newValue.external;
  }
}
