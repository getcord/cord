import { aws_cloudfront as CloudFront } from 'aws-cdk-lib';
import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

export const originAccessIdentity = define(
  () =>
    new CloudFront.OriginAccessIdentity(radicalStack(), 'cloudfront-oai', {}),
);

const functionSource = `\
function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // Set HTTP security headers
  headers['strict-transport-security'] = { value: 'max-age=31536000; includeSubDomains' }; 

  return response;
}`;

export const hstsFunction = define(
  () =>
    new CloudFront.Function(radicalStack(), 'cloudfront-hsts-function', {
      code: CloudFront.FunctionCode.fromInline(functionSource),
    }),
);
