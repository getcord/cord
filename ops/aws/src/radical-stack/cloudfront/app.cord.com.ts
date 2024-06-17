import type { aws_s3 as S3 } from 'aws-cdk-lib';
import {
  aws_cloudfront as CloudFront,
  aws_cloudfront_origins as origins,
  aws_certificatemanager as acm,
  Duration,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import {
  appCordComBucket,
  appLoadtestCordComBucket,
  appStagingCordComBucket,
} from 'ops/aws/src/radical-stack/s3/app.cord.com.ts';
import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import {
  hstsFunction,
  originAccessIdentity,
} from 'ops/aws/src/radical-stack/cloudfront/common.ts';

function makeDistribution(
  id: string,
  bucket: S3.Bucket,
  domainNames: string[],
  certificate: acm.ICertificate,
) {
  return new CloudFront.Distribution(radicalStack(), id, {
    defaultBehavior: {
      origin: new origins.S3Origin(bucket, {
        originAccessIdentity: originAccessIdentity(),
      }),
      allowedMethods: CloudFront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: CloudFront.OriginRequestPolicy.CORS_S3_ORIGIN,
      cachePolicy: new CloudFront.CachePolicy(
        radicalStack(),
        `${id}-caching-policy`,
        {
          minTtl: Duration.seconds(1),
          // the Origin header is part of the cache key so that no-CORS and CORS
          // requests receive back correct headers
          headerBehavior: CloudFront.CacheHeaderBehavior.allowList('Origin'),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        },
      ),
      functionAssociations: [
        {
          function: hstsFunction(),
          eventType: CloudFront.FunctionEventType.VIEWER_RESPONSE,
        },
      ],
    },
    domainNames,
    certificate,
    minimumProtocolVersion: CloudFront.SecurityPolicyProtocol.TLS_V1_2_2019,
    defaultRootObject: 'index.html',
    errorResponses: [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
      },
    ],
  });
}

export const appCordComDistribution = define(() =>
  makeDistribution(
    'appCordComDistribution',
    appCordComBucket(),
    ['app.cord.com'],
    acm.Certificate.fromCertificateArn(
      radicalStack(),
      'cordComCertificate-us-east-1',
      Config.CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1,
    ),
  ),
);

export const appStagingCordComDistribution = define(() =>
  makeDistribution(
    'appStagingCordComDistribution',
    appStagingCordComBucket(),
    ['app.staging.cord.com'],
    acm.Certificate.fromCertificateArn(
      radicalStack(),
      'stagingCordComCertificate-us-east-1',
      Config.STAGING_CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1,
    ),
  ),
);

export const appLoadtestCordComDistribution = define(() =>
  makeDistribution(
    'appLoadtestCordComDistribution',
    appLoadtestCordComBucket(),
    ['app.loadtest.cord.com'],
    acm.Certificate.fromCertificateArn(
      radicalStack(),
      'loadtestCordComCertificate-us-east-1',
      Config.LOADTEST_CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1,
    ),
  ),
);
