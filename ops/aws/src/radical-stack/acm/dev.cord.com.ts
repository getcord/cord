import { aws_certificatemanager as acm } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { devZone } from 'ops/aws/src/radical-stack/route53/dev.cord.com.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

export const devCordComCertificate = define(() => {
  const cert = new acm.Certificate(radicalStack(), 'devCordComCertificate', {
    domainName: 'dev.cord.com',
    subjectAlternativeNames: ['*.dev.cord.com'],
    validation: acm.CertificateValidation.fromDns(devZone()),
  });

  return cert;
});
