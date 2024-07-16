import {
  aws_cloudfront as CloudFront,
  aws_cloudfront_origins as origins,
  aws_certificatemanager as acm,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { publicUploadsBucket } from 'ops/aws/src/radical-stack/s3/publicProfilePicturesBucket.ts';
import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import {
  hstsFunction,
  originAccessIdentity,
} from 'ops/aws/src/radical-stack/cloudfront/common.ts';

export const publicUploadsBucketDistribution = define(
  () =>
    new CloudFront.Distribution(
      radicalStack(),
      'publicUploadsBucketDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(publicUploadsBucket(), {
            originAccessIdentity: originAccessIdentity(),
          }),
          allowedMethods: CloudFront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy:
            CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: CloudFront.OriginRequestPolicy.CORS_S3_ORIGIN,
          functionAssociations: [
            {
              function: hstsFunction(),
              eventType: CloudFront.FunctionEventType.VIEWER_RESPONSE,
            },
          ],
        },
        domainNames: [`cdn.${Config.PRIMARY_DOMAIN_NAME}`],
        certificate: acm.Certificate.fromCertificateArn(
          radicalStack(),
          'publicUploadsBucketCertificate-us-east-1',
          Config.CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1,
        ),
        minimumProtocolVersion: CloudFront.SecurityPolicyProtocol.TLS_V1_2_2019,
        defaultRootObject: 'index.html', // doesnt actually exist, but stops the root listing the bucket contents: https://stackoverflow.com/questions/14383326/how-do-you-disable-directory-listing-in-aws-cloudfront
      },
    ),
);
