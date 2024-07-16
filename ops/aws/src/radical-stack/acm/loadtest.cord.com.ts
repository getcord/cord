import { aws_certificatemanager as acm } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { loadtestZone } from 'ops/aws/src/radical-stack/route53/loadtest.cord.com.ts';
import { PRIMARY_DOMAIN_NAME } from 'ops/aws/src/radical-stack/Config.ts';

export const loadtestCordComCertificate = define(() => {
  const cert = new acm.Certificate(
    radicalStack(),
    'loadtestCordComCertificate',
    {
      domainName: `loadtest.${PRIMARY_DOMAIN_NAME}`,
      subjectAlternativeNames: [`*.loadtest.${PRIMARY_DOMAIN_NAME}`],
      validation: acm.CertificateValidation.fromDns(loadtestZone()),
    },
  );

  return cert;
});
