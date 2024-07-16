import { aws_s3 as S3, Duration } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { S3_BUCKET_PREFIX } from 'ops/aws/src/radical-stack/Config.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

export const elbLogsBucket = define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'elb-logs-devLoadBalancer', {
    bucketName: `${S3_BUCKET_PREFIX}elb-logs-devloadbalancer`,
    accessControl: S3.BucketAccessControl.PRIVATE,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    lifecycleRules: [{ expiration: Duration.days(30) }],
    versioned: true,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(bucket, 'Load balancer logs', {});
  return bucket;
});

export const elbQueryResultsBucket = define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'cord-elb-query-results', {
    bucketName: `${S3_BUCKET_PREFIX}cord-elb-query-results`,
    accessControl: S3.BucketAccessControl.PRIVATE,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    lifecycleRules: [{ expiration: Duration.days(30) }],
    versioned: true,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(bucket, 'Output of queries of load balancer logs', { nonProd: true });
  return bucket;
});
