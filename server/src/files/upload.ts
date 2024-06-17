import * as crypto from 'crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import * as credentialProviderNode from '@aws-sdk/credential-provider-node';

import env from 'server/src/config/Env.ts';
import type { UUID } from 'common/types/index.ts';
import {
  UPLOAD_URL_TTL_SECONDS,
  DOWNLOAD_URL_TTL_SECONDS,
  DELETE_URL_TTL_SECONDS,
} from 'common/const/Timing.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import setTimeoutAsync from 'common/util/setTimeoutAsync.ts';
import sleep from 'common/util/sleep.ts';

dayjs.extend(utc);

const {
  S3_ACCESS_KEY_ID,
  S3_ACCESS_KEY_SECRET,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_PUBLIC_BUCKET,
} = env;

const defaultS3Bucket: S3BucketConfig = {
  bucket: S3_BUCKET,
  region: S3_REGION,
};

export const publicS3Bucket: S3BucketConfig = {
  bucket: S3_PUBLIC_BUCKET,
  region: S3_REGION,
};

export interface S3BucketConfig {
  bucket: string;
  region: string;
  accessKeyID?: string;
  accessKeySecret?: string;
}

export interface S3BucketConfigWithCredentials extends S3BucketConfig {
  accessKeyID: string;
  accessKeySecret: string;
}

interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
}
let credentials: Credentials | null = null;

function getCredentials() {
  if (!credentials) {
    throw new Error('Link signing credentials not initialized');
  }
  return credentials;
}

export async function initializeLinkSigningCredentials() {
  if (S3_ACCESS_KEY_ID && S3_ACCESS_KEY_SECRET) {
    // there are credentials in the .env file - we'll just use these
    credentials = {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_ACCESS_KEY_SECRET,
    };
    return;
  }

  return await refreshLinkSigningCredentials();
}

async function refreshLinkSigningCredentials(): Promise<void> {
  try {
    credentials = await credentialProviderNode.defaultProvider({})();

    // We want to refresh (at least) every 5 hours.
    let refreshInMilliseconds = 5 * 60 * 60 * 1000; // 5 hours

    if (credentials.expiration) {
      const millisecondsUntilExpiration =
        credentials.expiration.getTime() - Date.now();

      // We want to create signed links that are valid for a certain period of
      // time, but it's limited by the lifetime of these credentials. So we want
      // to refresh the credentials soon enough: refresh no later than the
      // current credentials expiry minus the time for which the signed links to
      // be valid. For good measure add a 5 minute safety margin.
      const maxTtlSeconds = Math.max(
        DOWNLOAD_URL_TTL_SECONDS,
        UPLOAD_URL_TTL_SECONDS,
        DELETE_URL_TTL_SECONDS,
      );
      const needNewCredentialsInMilliseconds =
        millisecondsUntilExpiration - (maxTtlSeconds + 5 * 60) * 1000;

      if (needNewCredentialsInMilliseconds < 60 * 1000) {
        // No point in trying too often. Wait at least one minute.
        refreshInMilliseconds = 60000;
      } else if (needNewCredentialsInMilliseconds < refreshInMilliseconds) {
        // We want new credentials sooner than the default 5 hours from above.
        refreshInMilliseconds = needNewCredentialsInMilliseconds;
      }
    }

    anonymousLogger().info('Refreshed AWS credentials for S3 link signing', {
      accessKeyId: credentials.accessKeyId,
      nextRefreshInSeconds: refreshInMilliseconds / 1000,
    });
    setTimeoutAsync(refreshLinkSigningCredentials, refreshInMilliseconds);
  } catch (err) {
    // Something went wrong. Log the exception...
    anonymousLogger().logException('refreshLinkSigningCredentials', err);
    // ...then wait one second...
    await sleep(1000);
    // ...then retry.
    return await refreshLinkSigningCredentials();
  }
}

const sha256 = (text: string) =>
  crypto.createHash('sha256').update(text).digest();

const hmac256 = (text: string, key: any) =>
  crypto.createHmac('sha256', key).update(text).digest();

const sortedEntries = (object: Record<string, string>) =>
  Object.entries(object).sort(([key1], [key2]) => (key1 < key2 ? -1 : 1));

export const getSignedDownloadURL = (
  fileId: UUID,
  filename: string,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  config?: S3BucketConfig,
) =>
  getSignedURL(fileId, DOWNLOAD_URL_TTL_SECONDS, config, 'GET', undefined, {
    'response-content-disposition': `attachment; filename="${encodeURIComponent(
      filename,
    )}"`,
  });

export const getSignedUploadURL = (
  key: string,
  size: number,
  mimeType: string,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  config?: S3BucketConfig,
) =>
  getSignedURL(key, UPLOAD_URL_TTL_SECONDS, config, 'PUT', {
    'Content-Length': `${size}`,
    'Content-Type': mimeType,
  });

// eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
export const getSignedDeleteURL = (key: string, config?: S3BucketConfig) =>
  getSignedURL(key, DELETE_URL_TTL_SECONDS, config, 'DELETE');

export function getPublicBucketDownloadURL(filename: string) {
  return `https://${env.PUBLIC_UPLOADS_HOST}/${getPublicBucketKey(filename)}`;
}

export function getPublicBucketKey(key: string) {
  return env.S3_USE_PATH_BASED_URLS === 'true'
    ? env.S3_PUBLIC_BUCKET + '/' + key
    : key;
}

/*
  Implementation of https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
  Also documented here: https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
  I did this manually because I didn't want to include aws-sdk which for some reason is massive.
*/
export const getSignedURL = (
  key: string,
  expirationSeconds = 60, // default 1 minute
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  config: S3BucketConfig = defaultS3Bucket,
  verb = 'GET',
  additionalHeaders: Record<string, string> = {},
  additionalQueryParams: Record<string, string> = {},
) => {
  // We need credentials to create a signed URL. If the S3BucketConfig includes
  // them, then we use those (that's the case for 3rd party buckets). Otherwise,
  // we get our global credentials, which are the ones supplied in the .env
  // file, if any, or using the EC2 instance profile privileges instead.
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  const credentials: Credentials =
    config.accessKeyID && config.accessKeySecret
      ? {
          accessKeyId: config.accessKeyID,
          secretAccessKey: config.accessKeySecret,
        }
      : getCredentials();

  let now = dayjs().utc();

  // Round down the "current time" so that the signed URL doesn't change every
  // second. This gives browsers some hope of having a cache hit for
  // potentially-large images and files. Only do the rounding-down if the
  // expiration time is long enough, since this effectively shaves time off of
  // the expiration.
  if (expirationSeconds > 2 * 60) {
    now = now.second(0);
  }
  if (expirationSeconds > 2 * 60 * 60) {
    now = now.minute(0);
  }

  const time = now.format('YYYYMMDD[T]HHmmss[Z]');
  const date = now.format('YYYYMMDD');
  const s3Endpoint = S3_ENDPOINT.replace('<REGION>', config.region);

  const path =
    '/' +
    encodeRFC3986URIComponent(config.bucket) +
    '/' +
    key.split('/').map(encodeRFC3986URIComponent).join('/');
  const host = new URL(s3Endpoint).host;

  const headers = {
    host: host,
    ...additionalHeaders,
  };

  const signedHeaders = Object.keys(headers)
    .map((header) => header.toLowerCase())
    .sort()
    .join(';');

  const credential = [
    credentials.accessKeyId,
    date,
    config.region,
    's3',
    'aws4_request',
  ].join('/');

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': time,
    'X-Amz-Expires': `${expirationSeconds}`,
    'X-Amz-SignedHeaders': signedHeaders,
    ...additionalQueryParams,
  };
  if (credentials.sessionToken) {
    query['X-Amz-Security-Token'] = credentials.sessionToken;
  }

  const canonicalQueryString = sortedEntries(query)
    .map(
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      ([key, value]) =>
        `${encodeRFC3986URIComponent(key)}=${encodeRFC3986URIComponent(value)}`,
    )
    .join('&');

  const canonicalHeaders = sortedEntries(headers)
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    .map(([key, value]) => `${key.toLowerCase()}:${value.trim()}\n`)
    .join('');

  const canonicalRequestString = [
    verb,
    path,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    time,
    [date, config.region, 's3', 'aws4_request'].join('/'),
    sha256(canonicalRequestString).toString('hex'),
  ].join('\n');

  const dateKey = hmac256(date, 'AWS4' + credentials.secretAccessKey);
  const regionKey = hmac256(config.region, dateKey);
  const serviceKey = hmac256('s3', regionKey);
  const signingKey = hmac256('aws4_request', serviceKey);

  const signature = hmac256(stringToSign, signingKey).toString('hex');

  return `${s3Endpoint}${path}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
};

/**
 * Encode a URI component according to RFC3986, like AWS expects us to.
 *
 * There are characters that JavaScript's encodeURIComponent does not encode,
 * but AWS expects them to be encoded.
 *
 * AWS cites RFC3986 for URI encoding here:
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
 *
 * The implementation is copy-pasted from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_rfc3986
 */
function encodeRFC3986URIComponent(str: string) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
