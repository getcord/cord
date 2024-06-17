import { sign } from 'jsonwebtoken';

import type { Session } from 'server/src/auth/index.ts';
import env from 'server/src/config/Env.ts';

export function encodeSessionToJWT(
  session: Session,
  expiresInSeconds: number,
): string {
  return sign(session, env.JWT_SIGNING_SECRET, { expiresIn: expiresInSeconds });
}
