import * as jwt from 'jsonwebtoken';

/**
 * Verifies that the given token is signed with the given key and the encoded
 * payload is properly a JSON object.  Returns the object, or null if the value
 * is invalid for any reason.
 */
export function verifyJwtObject(
  token: string,
  secretOrPublicKey: jwt.Secret,
  options?: jwt.VerifyOptions,
) {
  try {
    const obj = jwt.verify(token, secretOrPublicKey, options);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj;
    }
  } catch {}
  return null;
}
