import {
  CopyObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Request, Response } from 'express';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import env from 'server/src/config/Env.ts';
import type {
  S3BucketConfig,
  S3BucketConfigWithCredentials,
} from 'server/src/files/upload.ts';
import type { UUID } from '@cord-sdk/types';
import { S3BucketEntity } from 'server/src/entity/s3_bucket/S3BucketEntity.ts';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 1000;

async function CopyFilesHandler(req: Request, res: Response) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_access_token');
  }
  const region = req.query['region'];
  if (typeof region !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: 'The region field must be a string',
    });
  }
  const bucket = req.query['bucket'];
  if (typeof bucket !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: 'The bucket field must be a string',
    });
  }

  const limitString = req.query['limit'];
  if (limitString && typeof limitString !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: 'Invalid copy limit',
    });
  }
  const limit = limitString ? parseInt(limitString, 10) : DEFAULT_LIMIT;
  if (limit <= 0 || MAX_LIMIT < limit) {
    throw new ApiCallerError('invalid_field', {
      message: `The limit must be between 1 and ${MAX_LIMIT}`,
    });
  }

  const applications = await ApplicationEntity.findAll({
    where: { customerID },
  });

  const destClient = new S3Client({
    region,
    endpoint: env.S3_ENDPOINT.replace('<REGION>', region),
  });

  const [files, s3Contents] = await Promise.all([
    FileEntity.findAll({
      where: {
        platformApplicationID: applications.map((a) => a.id),
        uploadStatus: 'uploaded',
      },
    }),
    getAllFilesFromBucket(destClient, bucket),
  ]);

  const filesToCopy = files.filter((f) => !s3Contents.has(f.id));
  const credentialsCache = new Map<UUID, S3BucketConfigWithCredentials>();

  let copied = 0;

  // Try one copy first, in case we don't have permissions right
  await doCopy(filesToCopy[copied], bucket, credentialsCache);
  copied++;

  // That succeeded, so now do all the others in parallel
  const promises = [];
  for (; copied < limit && copied < filesToCopy.length; copied++) {
    promises.push(doCopy(filesToCopy[copied], bucket, credentialsCache));
  }
  await Promise.all(promises);

  return res.status(200).json({
    copied,
  });
}

async function doCopy(
  fileToCopy: FileEntity,
  bucket: string,
  credentialsCache: Map<UUID, S3BucketConfigWithCredentials>,
) {
  const config = await getConfigForCopy(fileToCopy, credentialsCache);

  const srcClient = new S3Client({
    endpoint: env.S3_ENDPOINT.replace('<REGION>', config.region),
    ...(config.accessKeyID &&
      config.accessKeySecret && {
        credentials: {
          accessKeyId: config.accessKeyID,
          secretAccessKey: config.accessKeySecret,
        },
      }),
  });
  const command = new CopyObjectCommand({
    CopySource: `${config.bucket}/${fileToCopy.id}`,
    Bucket: bucket,
    Key: fileToCopy.id,
  });
  await srcClient.send(command);
}

async function getConfigForCopy(
  file: FileEntity,
  credentialsCache: Map<UUID, S3BucketConfigWithCredentials>,
): Promise<S3BucketConfig> {
  if (!file.s3Bucket) {
    return {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
    };
  }
  let credentials: S3BucketConfigWithCredentials;
  if (credentialsCache.has(file.s3Bucket)) {
    credentials = credentialsCache.get(file.s3Bucket)!;
  } else {
    const s3Bucket = await S3BucketEntity.findByPk(file.s3Bucket);
    if (!s3Bucket) {
      throw new Error('Could not find S3 bucket config');
    }
    credentials = s3Bucket.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT();
    credentialsCache.set(file.s3Bucket, credentials);
  }
  return credentials;
}

async function getAllFilesFromBucket(client: S3Client, bucket: string) {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
  });

  const files = new Set<string>();

  let more = true;
  while (more) {
    const response = await client.send(command);
    (response.Contents ?? []).forEach((c) => files.add(c.Key ?? ''));
    if (response.IsTruncated) {
      command.input.ContinuationToken = response.NextContinuationToken;
    } else {
      more = false;
    }
  }
  return files;
}

export default forwardHandlerExceptionsToNext(CopyFilesHandler);
