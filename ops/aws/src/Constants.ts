import type { aws_route53 as Route53 } from 'aws-cdk-lib';

// MX records pointing to GMail servers (for all domains in GMAIL_DOMAINS)
export const GMAIL_MX_RECORDS: Route53.MxRecordValue[] = [
  { hostName: 'aspmx.l.google.com.', priority: 1 },
  { hostName: 'alt1.aspmx.l.google.com.', priority: 5 },
  { hostName: 'alt2.aspmx.l.google.com.', priority: 5 },
  { hostName: 'aspmx2.googlemail.com.', priority: 10 },
  { hostName: 'aspmx3.googlemail.com.', priority: 10 },
];

export const SSH_PORT = 22;
export const POSTGRESQL_PORT = 5432;
export const DOCKER_PORT = 2375;
