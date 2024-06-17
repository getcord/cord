import { decode } from 'js-base64';
import type { DeploymentType } from 'common/types/index.ts';
const BEARER_PREFIX = 'Bearer ';

// "Bearer ABCDE" -> "ABCDE"
export function getTokenFromAuthorizationHeader(authHeader: string): string {
  if (!authHeader.startsWith(BEARER_PREFIX)) {
    throw new Error('Malformed authorization header: no type prefix');
  }

  return authHeader.substring(BEARER_PREFIX.length);
}

// "ABCDE" -> "Bearer ABCDE"
// null -> ""
export const getAuthorizationHeaderWithToken = (
  token: string | null,
): string => (token ? BEARER_PREFIX + token : '');

export interface WebsocketAuthParams {
  Authorization: string;
  Version: string;
  Deployment: DeploymentType | null;
}

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
