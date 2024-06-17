import { aws_s3 as S3, Duration } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

export const elbLogsBucket = define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'cloudtrailLogsBucket', {
    bucketName: 'aws-cloudtrail-logs-869934154475-eac040ca',
    accessControl: S3.BucketAccessControl.PRIVATE,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    lifecycleRules: [{ expiration: Duration.days(30) }],
    versioned: true,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(bucket, 'CloudTrail logs', {});
  return bucket;
});
