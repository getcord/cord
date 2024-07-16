import {
  aws_route53 as Route53,
  aws_route53_targets as Route53Targets,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { cordComZones } from 'ops/aws/src/radical-stack/route53/cord.com.ts';
import { appStagingCordComDistribution } from 'ops/aws/src/radical-stack/cloudfront/app.cord.com.ts';
import { newDualRecord } from 'ops/aws/src/radical-stack/route53/common.ts';
import { accelerator } from 'ops/aws/src/radical-stack/globalaccelerator/index.ts';
import { PRIMARY_DOMAIN_NAME } from 'ops/aws/src/radical-stack/Config.ts';

export const stagingZone = define(() => {
  const zone = new Route53.PublicHostedZone(
    radicalStack(),
    `staging.${PRIMARY_DOMAIN_NAME}-zone`,
    {
      zoneName: `staging.${PRIMARY_DOMAIN_NAME}`,
    },
  );

  cordComZones().get(PRIMARY_DOMAIN_NAME)?.addDelegation(zone);

  return zone;
});

define(() => {
  const zone = stagingZone();

  // A record for app.staging.cord.com
  newDualRecord(
    zone,
    Route53.RecordTarget.fromAlias(
      new Route53Targets.CloudFrontTarget(appStagingCordComDistribution()),
    ),
    'app',
  );

  const acceleratorTarget = Route53.RecordTarget.fromAlias(
    new Route53Targets.GlobalAcceleratorTarget(accelerator()),
  );

  // A records for other host names within the domain
  for (const hostName of ['api', 'admin', 'console', 'docs']) {
    newDualRecord(zone, acceleratorTarget, hostName);
  }

  // status.staging.cord.com
  new Route53.CnameRecord(zone, 'status', {
    zone,
    recordName: 'status',
    domainName: 'statuspage.betteruptime.com',
  });
});
