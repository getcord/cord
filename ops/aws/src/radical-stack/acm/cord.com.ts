import { aws_certificatemanager as acm } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import {
  cordComZones,
  cordToZone,
} from 'ops/aws/src/radical-stack/route53/cord.com.ts';

// This is the certificate we use for "the server", i.e. traffic forwarded to
// nginx running on our dev-xl instance, such as {api,app,admin}.cord.com,
// and the corresponding names in our secondary domains.

const PRIMARY_DOMAIN_NAME = 'cord.com';

export const cordComCertificate = define(() => {
  const zones = cordComZones();

  // additional domain names: this is a list of all the domain names, once
  // bare and once as a wildcard ('cord.com', '*.cord.com', ...), and then
  // PRIMARY_DOMAIN_NAME removed from it, because it's the certificate's
  // `domainName` and thus must not be included in the
  // `subjectAlternativeNames` as well
  const subjectAlternativeNames = [...zones.keys()]
    .map((domain) => [domain, `*.${domain}`])
    .flat()
    .filter((d) => d !== PRIMARY_DOMAIN_NAME);

  if (!subjectAlternativeNames.includes('cord.to')) {
    subjectAlternativeNames.push('cord.to');
  }

  const cert = new acm.Certificate(radicalStack(), 'cordComCertificate', {
    // primary domain name
    domainName: PRIMARY_DOMAIN_NAME,
    subjectAlternativeNames,
    validation: acm.CertificateValidation.fromDnsMultiZone({
      ...Object.fromEntries(zones),
      'cord.to': cordToZone(),
    }),
  });

  return cert;
});
