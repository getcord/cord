import { aws_certificatemanager as acm } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { stagingZone } from 'ops/aws/src/radical-stack/route53/staging.cord.com.ts';

export const stagingCordComCertificate = define(() => {
  const cert = new acm.Certificate(
    radicalStack(),
    'stagingCordComCertificate',
    {
      domainName: 'staging.cord.com',
      subjectAlternativeNames: ['*.staging.cord.com'],
      validation: acm.CertificateValidation.fromDns(stagingZone()),
    },
  );

  return cert;
});
