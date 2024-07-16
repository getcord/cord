import { aws_certificatemanager as acm } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { stagingZone } from 'ops/aws/src/radical-stack/route53/staging.cord.com.ts';
import { PRIMARY_DOMAIN_NAME } from 'ops/aws/src/radical-stack/Config.ts';

export const stagingCordComCertificate = define(() => {
  const cert = new acm.Certificate(
    radicalStack(),
    'stagingCordComCertificate',
    {
      domainName: `staging.${PRIMARY_DOMAIN_NAME}`,
      subjectAlternativeNames: [`*.staging.${PRIMARY_DOMAIN_NAME}`],
      validation: acm.CertificateValidation.fromDns(stagingZone()),
    },
  );

  return cert;
});
