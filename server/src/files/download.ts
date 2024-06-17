import * as crypto from 'crypto';
import env from 'server/src/config/Env.ts';
import type { UUID } from 'common/types/index.ts';

type FileProxyTokenPayload = {
  id: UUID;
};

export function encodeFileProxyToken(payload: FileProxyTokenPayload): string {
  const data = JSON.stringify({
    ...payload,
    time: Date.now(),
  });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    env.FILE_PROXY_SIGNING_SECRET_KEY,
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    'v1',
    encrypted.toString('hex'),
    authTag.toString('hex'),
    iv.toString('hex'),
  ].join(':');
}

export function decodeFileProxyToken(token: string) {
  const [_version, encrypted, authTag, iv] = token.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    env.FILE_PROXY_SIGNING_SECRET_KEY,

    Buffer.from(iv, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final();

  return JSON.parse(decrypted) as FileProxyTokenPayload;
}
