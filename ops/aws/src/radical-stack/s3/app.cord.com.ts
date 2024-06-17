import { aws_s3 as S3 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { CORS_RULES } from 'ops/aws/src/radical-stack/s3/S3Config.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { originAccessIdentity } from 'ops/aws/src/radical-stack/cloudfront/common.ts';

function makeBucket(id: string, bucketName: string) {
  const bucket = new S3.Bucket(radicalStack(), id, {
    bucketName,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    cors: CORS_RULES,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(bucket, `Static assets and JavaScript bundles for ${bucketName}`, {
    nonProd: bucketName !== 'app.cord.com',
  });

  return bucket;
}

export const appCordComBucket = define(() =>
  makeBucket('appCordComBucket', 'app.cord.com'),
);
export const appStagingCordComBucket = define(() =>
  makeBucket('appStagingCordComBucket', 'app.staging.cord.com'),
);
export const appLoadtestCordComBucket = define(() =>
  makeBucket('appLoadtestCordComBucket', 'app.loadtest.cord.com'),
);

define(() => {
  appCordComBucket().grantRead(originAccessIdentity());
  appStagingCordComBucket().grantRead(originAccessIdentity());
  appLoadtestCordComBucket().grantRead(originAccessIdentity());
});
