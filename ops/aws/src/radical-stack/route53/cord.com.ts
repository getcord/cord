import {
  aws_route53 as Route53,
  aws_route53_targets as Route53Targets,
  Duration,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import { GMAIL_MX_RECORDS } from 'ops/aws/src/Constants.ts';
import { appCordComDistribution } from 'ops/aws/src/radical-stack/cloudfront/app.cord.com.ts';
import { publicUploadsBucketDistribution } from 'ops/aws/src/radical-stack/cloudfront/cord-public-uploads.ts';
import { newDualRecord } from 'ops/aws/src/radical-stack/route53/common.ts';
import { accelerator } from 'ops/aws/src/radical-stack/globalaccelerator/index.ts';

const vercelCnameTarget = 'cname.vercel-dns.com';

// Integrity check for our config: make sure TXT_RECORDS and GMAIL_DOMAINS do
// not list domains which we do not define.
for (const domain of Object.keys(Config.TXT_RECORDS)) {
  if (!Config.CORD_COM_DOMAINS.includes(domain)) {
    throw new Error(
      `TXT_RECORDS entry '${domain}' is not listed in CORD_COM_DOMAINS`,
    );
  }
}
for (const domain of Config.GMAIL_DOMAINS) {
  if (!Config.CORD_COM_DOMAINS.includes(domain)) {
    throw new Error(
      `GMAIL_DOMAINS entry '${domain}' is not listed in CORD_COM_DOMAINS`,
    );
  }
}
for (const domain of Object.keys(Config.DOMAIN_KEYS)) {
  if (!Config.CORD_COM_DOMAINS.includes(domain)) {
    throw new Error(
      `DOMAIN_KEYS entry '${domain}' is not listed in CORD_COM_DOMAINS`,
    );
  }
}

// Create Route53 zones for each domain in CORD_COM_DOMAINS
export const cordComZones = define(() => {
  return new Map(
    Config.CORD_COM_DOMAINS.map((domain) => {
      const zone = new Route53.PublicHostedZone(
        radicalStack(),
        `${domain}-zone`,
        {
          zoneName: domain,
        },
      );

      return [domain, zone];
    }),
  );
});

export const cordToZone = define(() => {
  const zone = new Route53.PublicHostedZone(radicalStack(), `cord-to-zone`, {
    zoneName: 'cord.to',
  });
  return zone;
});

define(() => {
  const acceleratorTarget = Route53.RecordTarget.fromAlias(
    new Route53Targets.GlobalAcceleratorTarget(accelerator()),
  );
  const zone = cordToZone();
  newDualRecord(zone, acceleratorTarget);
});

// A records pointing to loadBalancer
define(async () => {
  const acceleratorTarget = Route53.RecordTarget.fromAlias(
    new Route53Targets.GlobalAcceleratorTarget(accelerator()),
  );
  const vercelATarget = Route53.RecordTarget.fromIpAddresses('76.76.21.21');

  for (const [domain, zone] of cordComZones()) {
    // Apex and www always points to Vercel.
    new Route53.ARecord(zone, '_', {
      zone,
      target: vercelATarget,
      ttl: Duration.minutes(5),
    });
    new Route53.CnameRecord(zone, 'www', {
      zone,
      domainName: vercelCnameTarget,
      recordName: 'www',
      ttl: Duration.minutes(5),
    });

    if (domain !== Config.WEB_SITE_DOMAIN) {
      continue;
    }

    // A records for host names within the domain
    for (const hostName of [
      'api',
      'app',
      'admin',
      'console',
      'docs',
      'monitoring',
      'oncall',
      'cdn',
      'go',
    ]) {
      let target: Route53.RecordTarget;

      if (hostName === 'app') {
        target = Route53.RecordTarget.fromAlias(
          new Route53Targets.CloudFrontTarget(appCordComDistribution()),
        );
      } else if (hostName === 'cdn') {
        target = Route53.RecordTarget.fromAlias(
          new Route53Targets.CloudFrontTarget(
            publicUploadsBucketDistribution(),
          ),
        );
      } else {
        target = acceleratorTarget;
      }

      newDualRecord(zone, target, hostName);
    }
  }
});

// TXT records on the domains themselves: Google Site Verification and Sender
// Policy Framework
define(() => {
  const zones = cordComZones();

  for (const [domain, zone] of zones) {
    const txtRecords: string[] = [];
    const subdomainRecords: Record<string, string> = {};

    // TXT records for Google Site Verification etc.
    if (domain in Config.TXT_RECORDS) {
      txtRecords.push(
        ...Config.TXT_RECORDS[domain as keyof typeof Config.TXT_RECORDS],
      );
    }

    // SPF (Sender Policy Framework)
    if (Config.SPF_RECORDS[domain]) {
      const spf = Config.SPF_RECORDS[domain]!;
      if (typeof spf === 'string') {
        txtRecords.push(spf);
      } else {
        for (const subdomain in spf) {
          if (subdomain === '@') {
            txtRecords.push(spf[subdomain]);
          } else {
            subdomainRecords[subdomain] = spf[subdomain];
          }
        }
      }
    } else if (Config.GMAIL_DOMAINS.includes(domain)) {
      txtRecords.push(Config.SPF_RECORDS.default);
    }

    if (txtRecords.length) {
      new Route53.TxtRecord(zone, 'TxtRecords', {
        zone,
        values: txtRecords,
      });
    }
    for (const subdomain in subdomainRecords) {
      new Route53.TxtRecord(zone, `TxtRecords-${subdomain}`, {
        zone,
        recordName: subdomain,
        values: [subdomainRecords[subdomain]],
      });
    }
  }
});

// Setting up email: MX records (for GMAIL_DOMAINS), DKIM, DMARC
define(() => {
  const cordComZone = cordComZones().get(Config.PRIMARY_DOMAIN_NAME);

  for (const [domain, zone] of cordComZones()) {
    if (Config.GMAIL_DOMAINS.includes(domain)) {
      new Route53.MxRecord(zone, 'MX', { zone, values: GMAIL_MX_RECORDS });
    }

    if (domain in Config.DOMAIN_KEYS) {
      const domainKeys =
        Config.DOMAIN_KEYS[domain as keyof typeof Config.DOMAIN_KEYS];

      for (const [key, value] of Object.entries(domainKeys)) {
        if (value.startsWith('CNAME:')) {
          new Route53.CnameRecord(zone, `DomainKey_${key}`, {
            zone,
            recordName: `${key}._domainkey`,
            domainName: value.substring(6),
          });
        } else {
          new Route53.TxtRecord(zone, `DomainKey_${key}`, {
            zone,
            recordName: `${key}._domainkey`,
            values: [value],
          });
        }
      }
      // ADSP = Author Domain Signing Practices. Announce we are using DKIM.
      new Route53.TxtRecord(zone, 'ADSP-DKIM-TXT', {
        zone,
        recordName: '_adsp._domainkey',
        values: ['dkim=all'],
      });

      new Route53.CnameRecord(zone, 'DMARC-CNAME', {
        zone,
        recordName: '_dmarc',
        domainName: `${domain}.hosted.dmarc-report.com`,
      });

      // Opt-in to receive DMARC reports for our domains
      cordComZone &&
        new Route53.TxtRecord(cordComZone, `dmarc-report-${domain}`, {
          zone: cordComZone,
          recordName: `${domain}._report._dmarc`,
          values: ['v=DMARC1'],
        });
    }
  }
});

// cord.fyi setup for SendGrid
define(() => {
  const zone = cordComZones().get('cord.fyi');
  if (zone) {
    // Custom CNAME records for verification
    new Route53.CnameRecord(zone, `sendgrid-em5842`, {
      zone,
      recordName: 'em5842',
      domainName: 'u16847044.wl045.sendgrid.net',
    });

    // Replies to cord.fyi emails should go to SendGrid
    // https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook#set-up-an-mx-record
    new Route53.MxRecord(zone, 'sendgrid-mx', {
      zone,
      values: [{ priority: 10, hostName: 'mx.sendgrid.net.' }],
    });
  }
});

// local.cord.com hostname, pointing to localhost (for local development)
define(() => {
  const zone = cordComZones().get(Config.PRIMARY_DOMAIN_NAME);
  if (zone) {
    new Route53.ARecord(zone, 'local', {
      zone,
      target: Route53.RecordTarget.fromIpAddresses('127.0.0.1'),
      recordName: 'local',
    });
    new Route53.ARecord(zone, 'local-wildcard', {
      zone,
      target: Route53.RecordTarget.fromIpAddresses('127.0.0.1'),
      recordName: '*.local',
    });
    new Route53.AaaaRecord(zone, 'aaaa/local', {
      zone,
      target: Route53.RecordTarget.fromIpAddresses('::1'),
      recordName: 'local',
    });
    new Route53.AaaaRecord(zone, 'aaaa/local-wildcard', {
      zone,
      target: Route53.RecordTarget.fromIpAddresses('::1'),
      recordName: '*.local',
    });
  }
});

// We have a lot of places where we just need a cname, so we can just stick it
// here. If you need to do something more complicated than just a straight
// cname, please code it directly like we do above instead of splitting the
// logic between here and elsewhere.
const cnames: Record<string, [string, string][]> = {
  [Config.PRIMARY_DOMAIN_NAME]: [
    // status.cord.com hostname, pointing to betteruptime
    ['status', 'statuspage.betteruptime.com'],

    // CNAME for Auth0 verification on auth.console.cord.com
    [
      'auth.console',
      'dev-e20axg57-cd-qp1p4mic3gql9izj.edge.tenants.eu.auth0.com',
    ],

    // clack.cord.com: hosted in a different AWS account (the OHFFS one)
    // Verification for ACM
    [
      '_88a1c5829924f1cb6295068ab4ab5d21.clack',
      '_f0bcdbd915dc0e4ce167188b3f1f7041.qqqkmlyjyg.acm-validations.aws.',
    ],
    [
      '_be2ff483ae0a01dac94c2df6c812c550.api.clack',
      '_a749d4cb15aae7fcd1ff146e794c9382.qqqkmlyjyg.acm-validations.aws.',
    ],
    // Server
    ['clack', 'clack-client-656024712.us-west-2.elb.amazonaws.com'],
    // Client
    ['api.clack', 'clack-server-1850454502.us-west-2.elb.amazonaws.com'],

    // mirord.cord.com: hosted in a different AWS account (the OHFFS one)
    // Verification for ACM
    [
      '_6cbd834bf94f3ac380c77cd43ba462bc.mirord.cord.com.',
      '_5f4829b602900a64a51d224f853c8bce.mhbtsbpdnt.acm-validations.aws.',
    ],
    [
      '_2b40912a39d08ff1863998161187fc11.api.mirord.cord.com.',
      '_eed83bf5499ede9c3c61d82381bf7482.mhbtsbpdnt.acm-validations.aws.',
    ],
    // Client
    ['mirord', 'mirord-556218686.us-west-2.elb.amazonaws.com'],
    // Server
    ['api.mirord', 'mirord-556218686.us-west-2.elb.amazonaws.com'],

    // community.cord.com, dat.cord.com both deployed on vercel
    ['community', vercelCnameTarget],
    ['dat', vercelCnameTarget],
  ],
};

define(() => {
  for (const zoneName in cnames) {
    const zone = cordComZones().get(zoneName);
    if (!zone) {
      continue;
    }
    for (const [recordName, domainName] of cnames[zoneName]) {
      new Route53.CnameRecord(zone, recordName, {
        zone,
        recordName,
        domainName,
      });
    }
  }
});
