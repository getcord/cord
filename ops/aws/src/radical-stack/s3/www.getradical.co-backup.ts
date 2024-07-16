import { aws_s3 as S3 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { S3_BUCKET_PREFIX } from 'ops/aws/src/radical-stack/Config.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'www.getradical.co-backup', {
    bucketName: `${S3_BUCKET_PREFIX}www.getradical.co-backup`,
    accessControl: S3.BucketAccessControl.PRIVATE,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    versioned: true,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(bucket, 'Backup of our old web site - for the history books', {});
  return bucket;
});
