import * as crypto from 'crypto';

import type { S3BucketConfig } from 'server/src/files/upload.ts';
import { getSignedUploadURL } from 'server/src/files/upload.ts';
import { safeFetch } from 'server/src/util/safeFetch.ts';

export function downloadURL(url: string) {
  return safeFetch(url)
    .then((response) => response.blob())
    .then((blob) => (blob as any).arrayBuffer() as Promise<ArrayBuffer>)
    .then((arrayBuffer) => Buffer.from(arrayBuffer));
}

export const sha384 = (buffer: Buffer) =>
  crypto.createHash('sha384').update(buffer).digest('hex');

export async function uploadImageToS3(
  outputFilename: string,
  outputImageBuffer: Buffer,
  outputMimeType: string,
  publicS3Bucket: S3BucketConfig,
) {
  const uploadResponse = await fetch(
    getSignedUploadURL(
      outputFilename,
      outputImageBuffer.byteLength,
      outputMimeType,
      publicS3Bucket,
    ),
    {
      method: 'PUT',
      body: outputImageBuffer,
      headers: {
        'Content-Length': `${outputImageBuffer.byteLength}`,
        'Content-Type': outputMimeType,
      },
    },
  );
  if (uploadResponse.status !== 200) {
    throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
  }
}
