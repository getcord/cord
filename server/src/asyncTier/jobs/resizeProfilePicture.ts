import { parse } from 'url';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import env from 'server/src/config/Env.ts';
import type { UUID } from 'common/types/index.ts';
import {
  MIN_RESIZED_PROFILE_PICTURE_DIMENSION,
  RESIZE_PROFILE_PICTURE_THRESHOLD,
} from 'common/uploads/index.ts';
import {
  getPublicBucketDownloadURL,
  getPublicBucketKey,
} from 'server/src/files/upload.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import sleep from 'common/util/sleep.ts';

const streamToBuffer = (stream: Readable) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.once('error', reject);
    stream.once('end', () => resolve(Buffer.concat(chunks)));
  });

export default new AsyncTierJobDefinition(
  'resizeProfilePicture',
  resizeProfilePicture,
);

export type ResizeProfilePicture = {
  profilePictureURL: UUID;
  userID: UUID;
  orgID: UUID;
  pictureType: 'apiUpload' | 'userSettingsUpload';
};
export const RESIZE_PROFILE_PICTURE_JOB = 'resizeProfilePicture';

// job run when a user uploads a profile picture which needs resizing
async function resizeProfilePicture(
  data: ResizeProfilePicture,
  logger: Logger,
) {
  const { profilePictureURL, userID, orgID } = data;

  const parsedURL = parse(profilePictureURL);

  // URLs should be in the format https://cdn.cord.com/ca9bb95e-3f5f-495e-bbf0-b8f752b6dbcd
  if (parsedURL.host !== env.PUBLIC_UPLOADS_HOST || !parsedURL.path) {
    logger.error(
      `Bad profile picture url submitted for resizing: ${profilePictureURL}`,
    );
    return;
  }

  const fileID =
    env.S3_USE_PATH_BASED_URLS === 'true'
      ? // Remove slash before and after bucket name
        parsedURL.path.substring(2 + env.S3_PUBLIC_BUCKET.length)
      : // Just remove leading slash
        parsedURL.path.substring(1);

  const s3Client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT.replace('<REGION>', env.S3_REGION),
  });

  // get the image that was just uploaded
  const { originalImageBuffer, size } = await getUserUploadedImage(
    fileID,
    s3Client,
    logger,
  );

  // image is already small, skip resizing
  if (size < RESIZE_PROFILE_PICTURE_THRESHOLD) {
    logger.info(
      `Skipping resize of ${profilePictureURL}: size is ${Math.round(
        size / 1024,
      )} KB`,
    );
    return;
  }

  // resize and compress the image
  const resizedImgBuffer = await sharp(originalImageBuffer)
    .resize({
      width: MIN_RESIZED_PROFILE_PICTURE_DIMENSION,
      // Scale image proportionally
      fit: 'outside',
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  // upload the new image the a new file ID (leaving original image unchanged)
  const resizedImageFileName = `${fileID}_resized_${MIN_RESIZED_PROFILE_PICTURE_DIMENSION}`;

  const putObjectCommand = new PutObjectCommand({
    Body: resizedImgBuffer,
    Bucket: env.S3_PUBLIC_BUCKET,
    Key: getPublicBucketKey(resizedImageFileName),
    ContentType: 'image/jpeg',
  });

  await s3Client.send(putObjectCommand);

  // update the profiles table to point to the resized image
  await new UserMutator(
    Viewer.createLoggedInViewer(userID, orgID),
    null,
  ).updateProfilePictureURL(getPublicBucketDownloadURL(resizedImageFileName));
}

const getUserUploadedImage = async (
  fileID: UUID,
  s3: S3Client,
  logger: Logger,
) => {
  let originalImageBuffer: Buffer | undefined;
  let size: number | undefined;

  // try for up to 60s, in case the upload on the client is slow
  for (let i = 0; i < 6; i++) {
    // wait a few seconds for the file to upload on the client
    await sleep(10 * 1000);
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: env.S3_PUBLIC_BUCKET,
        Key: getPublicBucketKey(fileID),
      });

      const { ContentLength, Body } = await s3.send(getObjectCommand);

      if (Body instanceof Readable) {
        originalImageBuffer = await streamToBuffer(Body);
      } else if (Body instanceof Blob) {
        originalImageBuffer = Buffer.from(await Body.arrayBuffer());
      } else {
        throw new Error(
          `Body returned from s3 is not of of type Readable or Blob, ${typeof Body}`,
        );
      }

      size = ContentLength;

      break;
    } catch (e: any) {
      if (e.name.includes('NoSuchKey')) {
        // file not been uploaded yet - wait and try again
      } else {
        // unexpected error
        logger.error(
          `Unexpected error when resizing profile picture ${fileID}`,
        );
        throw e;
      }
    }
  }

  if (!originalImageBuffer || !size) {
    throw new Error(`Cant find file ${fileID} in public uploads bucket`);
  }

  return { originalImageBuffer, size };
};
