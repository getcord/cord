import { aws_s3 as S3 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { CORS_RULES } from 'ops/aws/src/radical-stack/s3/S3Config.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { originAccessIdentity } from 'ops/aws/src/radical-stack/cloudfront/common.ts';

export const publicUploadsBucket = define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'publicUploadsBucket', {
    bucketName: 'cord-public-uploads',
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    cors: CORS_RULES,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(
    bucket,
    'S3 bucket hosting publicly available assets such as avatar pictures',
    {},
  );
  return bucket;
});

define(() => {
  publicUploadsBucket().grantRead(originAccessIdentity());
});
