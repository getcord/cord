import { useMemo } from 'react';
import { decode } from 'js-base64';

export function parseJWT(jwt: string): {
  header: Record<string, any>;
  payload: Record<string, any>;
} {
  let parsed;
  try {
    const segments = jwt.split('.');
    const [header, payload] = segments.slice(0, 2).map((s) => {
      // decode supports both normal and URL-safe base64
      const decoded = JSON.parse(decode(s));
      if (Object.prototype.toString.call(decoded).slice(8, -1) !== 'Object') {
        throw new Error('Parsed decoded segment is not an object');
      }
      return decoded;
    });
    parsed = { header, payload };
  } catch (e) {
    throw new Error(`Error parsing JWT ${e}`);
  }

  return parsed;
}

// This function determines if X has property Y and does so in a
// a way that preserves the type information within TypeScript.
export function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  // eslint-disable-next-line no-prototype-builtins
  return obj.hasOwnProperty(prop);
}

type UnpackedClientAuthTokenPayload = {
  userID: string | undefined;
  organizationID: string | undefined;
};

export function useUnpackClientAuthTokenPayload(
  clientAuthToken: string | null | undefined,
): UnpackedClientAuthTokenPayload {
  return useMemo(() => {
    const ret: UnpackedClientAuthTokenPayload = {
      userID: undefined,
      organizationID: undefined,
    };

    if (!clientAuthToken) {
      return ret;
    }

    const segments = clientAuthToken.split('.');
    if (segments.length !== 3) {
      return ret;
    }

    const [_header, payload] = segments;

    let decodedPayload: unknown;
    try {
      // Do NOT use atob or libraries depending on atob here - see PR7924.
      // jsonwebtoken encodes tokens with base64url rather than standard base64,
      // which involves a couple of character substitutions.  atob will throw if
      // it encounters these.
      decodedPayload = parseJWT(clientAuthToken).payload;
    } catch (e) {
      console.error('`clientAuthToken` payload did not contain valid JSON');
      console.error(e);
      return ret;
    }

    if (typeof decodedPayload !== 'object' || decodedPayload === null) {
      console.error('invalid `clientAuthToken` payload: ' + payload);
      return ret;
    }

    if (
      hasOwnProperty(decodedPayload, 'user_id') &&
      (typeof decodedPayload.user_id === 'string' ||
        typeof decodedPayload.user_id === 'number')
    ) {
      ret.userID = decodedPayload.user_id.toString();
    } else {
      console.log('`clientAuthToken` was missing user_id');
    }

    if (
      hasOwnProperty(decodedPayload, 'organization_id') &&
      (typeof decodedPayload.organization_id === 'string' ||
        typeof decodedPayload.organization_id === 'number')
    ) {
      ret.organizationID = decodedPayload.organization_id.toString();
    }

    if (
      hasOwnProperty(decodedPayload, 'group_id') &&
      (typeof decodedPayload.group_id === 'string' ||
        typeof decodedPayload.group_id === 'number')
    ) {
      ret.organizationID = decodedPayload.group_id.toString();
    }

    return ret;
  }, [clientAuthToken]);
}
