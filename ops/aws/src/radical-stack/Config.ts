import type { Tier } from 'ops/aws/src/common.ts';

// AWS Environment values
export const AWS_REGION = 'eu-west-1';

// Default resource owner, used for tagging resources with tags that Vanta reads
export const DEFAULT_OWNER = 'engineering-devops@rows.com';

// The user group that is allowed to ssh to EC2 instances
export const EC2_INSTANCE_CONNECT_GROUP = 'engineering';

// The email address to send ops notifications to
export const OPS_NOTIFICATION_EMAIL = 'engineering-devops@rows.com';

// S3 bucket names have to be globally unique, so prefix all bucket names with
// this string
export const S3_BUCKET_PREFIX = 'rows-cord-bucket';

// AWS sets up a default VPC and security group in each region, and you're not
// able to create replacements with exactly the same properties in CF, so
// instead we import them by ID.  Replace these with the IDs of the objects that
// AWS creates for you.
export const DEFAULT_VPC_ID = 'vpc-0210ccd77df47acf9';
export const DEFAULT_SECURITY_GROUP_ID = 'sg-094d18ab420e94e06';
export const DEFAULT_PUBLIC_SUBNET_A_ID = 'subnet-08e5482dfaffa4bfc';
export const DEFAULT_PUBLIC_SUBNET_B_ID = 'subnet-0b3176a25337dfb65';
export const DEFAULT_PUBLIC_SUBNET_C_ID = 'subnet-03195181fc07bdc4f';
export const DEFAULT_VPC_ID_US_EAST_1 = 'vpc-0ad54bf72879bf666';

// all the domains under which we serve the product
export const CORD_COM_DOMAINS = [
  'cord-api.rows.com',
];

// The domain name we want all requests to be redirected to, and that serves as
// the base for all other domains (eg, api., app.)
export const PRIMARY_DOMAIN_NAME = CORD_COM_DOMAINS[0];

// domains for which we set up gmail
export const GMAIL_DOMAINS = [];

// Domain TXT records, for Google site verification and such things
export const TXT_RECORDS = {
  //'getradical.co': [
  //  'google-site-verification=BtgOe3c6_AitAdNHNDU-2dedVumtkfO5OAHpnUNrEyM',
  //],
  //'cord.com': [
  //  'google-site-verification=o0E3i6wuU7HmxGIf_D7jLS089pFF7l19xfj8OebZ8ds',
  //  'google-site-verification=33uewWcG3InRmPHAs8TUHCjGTHZonvQzd7MxjPZSaEo',
  //  'OSSRH-82140',
  //  'ahrefs-site-verification_4b6190ed0dbc98695c8737c1ad9070106203ccfca7f7cd1f309a73010d2cf744',
  //],
  //'cord.so': [
  //  'google-site-verification=gjiL3OQHqmQnYx7KyujYpX29mEvyyxnCwfRfIMwr1cQ',
  //],
};

// Domain keys for DKIM
export const DOMAIN_KEYS = {
  //'getradical.co': {
    // google = Google (our email)
  //  google:
  //    'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9UaUXI2l/R6DevMnY5lLzBGSmaK3sS5l1TGNMTu/oSlPTEaNJyiDt3b3zNrmoqWpMziPL6O5WwAG+l8CowD7gAnvjHujrIcPyP+EQ2k7+wh2pHk7prgITmTurljQKi2VedEfbRyT4u7UFctazXU0k4axUZGIjiQwrEAWR4ubgg9KEhZrFWPszOKeHTUsF9KahoasIJoPFfDS1FAiDYJcMDXAKg+4RjKM9aH42ADHht/gx98oQe4uwtJuCmfo/IvS5txTdRZMBeQ8Aip4jRRzqzdJVTTzsCE6eOnlsHyIpfWVtHK8uO41Est2s76EhpikVGt3NMRdsbHiJNgVYmmaCwIDAQAB',
  //},
  //'cord.com': {
    // google = Google (our email)
  //  google:
  //    'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiwzgkiUn2tEnh417+3ate4MfoK72XsUU2PKXAyQ8BOzmb3AcpnrYcyafFLWGxSZfFvai3F2PcRGe02JWDq2+x7YlS/JICm6vyyofM/F1qu1/YZv2+7xNyDEx0R2ccQGgOXrczX2ecWu7aHnCRWgQB0UtKE/78OYXEvoKeSQnFjmeY2v4KGu1W35gQ9o7Y44jNJrXKrsPTV+iIwuoaqh/F2zsDBgt0izEiiQcSaNJyXx3RKinQDhlKMTCR9gM4yQ4Zmi+S+M4BrZZ6WZD0P1sBiO5vfs4k7zCwWr2c+MLYwPIexw12T6socOtqcAjoHLkZ3gYHCGzNIz3Ct6aM/is4wIDAQAB',
  //},
  //'cord.so': {
    // google = Google (our email)
    // random strings: ...amazonses.com = Loops (marketing)
    //google:
    //  'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAn/NFJgjIFscAVGv8jbgDL0wr+Dh3nJxKAyxy31FyhEzUIJYwEtR9KyQXWeAO7D/sCEQ7dA+Dqum6kuiLc/OSFg4vu8bkYkQb0Vw5+2eQbTKoh/DQ5ju8Txiudd0r0SzQGx7YWzmJcfLPe1Jqa4AaYraZRCLyRDbfdg9bhOxaLJ+aUbX7xZVPEL35RfkW2Stlf3Ny7rl25bHRPFUnJQJflOkldXLZyRknXGP3s6eCXoAH84WVNr5XjPbUEUFwS9/TbDj7QKcQIcAPwRPH8/4arvw2j8nSzZHpVidIVyPO+J8ToUnRia33JT6uvqgsE3jBEQTSJyFOGNXiJ8eu8G/SZQIDAQAB',
    //gw7lwwllla3tk33rzzpi4pkk7b7vzw65:
    //  'CNAME:gw7lwwllla3tk33rzzpi4pkk7b7vzw65.dkim.amazonses.com.',
    //jgxjf2ny7ruwqsflekpn27zft64maxn7:
    //  'CNAME:jgxjf2ny7ruwqsflekpn27zft64maxn7.dkim.amazonses.com.',
    //wwmfgpjwizpjhbulmahzlx65e22z6oko:
    //  'CNAME:wwmfgpjwizpjhbulmahzlx65e22z6oko.dkim.amazonses.com.',
  //},
  //'cord.fyi': {
    // s1, s2 = Sendgrid (product notifications)
  //  s1: 'CNAME:s1.domainkey.u16847044.wl045.sendgrid.net',
  //  s2: 'CNAME:s2.domainkey.u16847044.wl045.sendgrid.net',
  //},
};

type SpfType = Record<string, string | Record<string, string> | undefined> & {
  default: string;
};

// SPF records
export const SPF_RECORDS: SpfType = {
  // _spf.google.com = Google (our email)
  // amazonses.com = Loops (marketing)
  // sendgrid.net = Sendgrid (product notifications)
  default: 'v=spf1 include:_spf.google.com ~all',
  'cord-api.rows.com': 'v=spf1 include:_spf.google.com ~all',
};

// CI/CD values
export const ECR_SERVER_REPO_NAME = 'server';
export const ECR_ONCALL_REPO_NAME = 'oncall';

export const SLACK_OAUTH_STATE_SIGNING_SECRET = 'SlackOauthStateSigningSecret';
export const SLACK_OAUTH_STATE_SIGNING_KEY_REF_NAME =
  'SlackOauthStateSigningSecretKey';

export const SENDGRID_INBOUND_WEBHOOK_SECRET = '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';
export const SENDGRID_INBOUND_WEBHOOK_SECRET_KEY_REF_NAME =
  'SendgridInboundWebhookSecretKey';

export const CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1 =
  'arn:aws:acm:us-east-1:009160069219:certificate/8cd3b695-adf7-41d1-876e-fc2ec9ccf8f5';
export const STAGING_CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1 =
  'arn:aws:acm:us-east-1:009160069219:certificate/e8df40c5-5fe9-4e46-91c0-86c015a13f53';
export const LOADTEST_CORD_COM_WILDCARD_CERTIFICATE_US_EAST_1 =
  'arn:aws:acm:us-east-1:009160069219:certificate/07bdea69-e56f-4cba-be74-e4c639c86a72';

type ScalingConstraints = {
  minCapacity: number;
  maxCapacity: number;
};
export const SERVER_AUTOSCALING_CAPACITY: {
  [k in Tier]: ScalingConstraints;
} = {
  prod: {
    minCapacity: 2,
    maxCapacity: 4,
  },
  staging: {
    minCapacity: 2,
    maxCapacity: 4,
  },
  loadtest: {
    minCapacity: 2,
    maxCapacity: 2,
  },
};
