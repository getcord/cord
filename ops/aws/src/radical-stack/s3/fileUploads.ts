import { aws_s3 as S3 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { S3_BUCKET_PREFIX } from 'ops/aws/src/radical-stack/Config.ts';
import { CORS_RULES } from 'ops/aws/src/radical-stack/s3/S3Config.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

export const fileUploadsBucket = define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'fileUploadsBucket', {
    bucketName: `${S3_BUCKET_PREFIX}radical-stack-fileuploads-wumx9efffh4z`,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    cors: CORS_RULES,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(
    bucket,
    'S3 bucket hosting files that users have attached to their messages',
    {},
  );
  return bucket;
});
