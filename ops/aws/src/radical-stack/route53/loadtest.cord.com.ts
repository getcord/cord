import {
  aws_route53 as Route53,
  aws_route53_targets as Route53Targets,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { cordComZones } from 'ops/aws/src/radical-stack/route53/cord.com.ts';
import { appLoadtestCordComDistribution } from 'ops/aws/src/radical-stack/cloudfront/app.cord.com.ts';
import { accelerator } from 'ops/aws/src/radical-stack/globalaccelerator/index.ts';
import { PRIMARY_DOMAIN_NAME } from 'ops/aws/src/radical-stack/Config.ts';

export const loadtestZone = define(() => {
  const zone = new Route53.PublicHostedZone(
    radicalStack(),
    `loadtest.${PRIMARY_DOMAIN_NAME}-zone`,
    {
      zoneName: `loadtest.${PRIMARY_DOMAIN_NAME}`,
    },
  );

  cordComZones().get(PRIMARY_DOMAIN_NAME)?.addDelegation(zone);

  return zone;
});

define(() => {
  // A record for app.loadtest.cord.com
  new Route53.ARecord(loadtestZone(), 'app', {
    zone: loadtestZone(),
    recordName: 'app',
    target: Route53.RecordTarget.fromAlias(
      new Route53Targets.CloudFrontTarget(appLoadtestCordComDistribution()),
    ),
  });

  const acceleratorTarget = Route53.RecordTarget.fromAlias(
    new Route53Targets.GlobalAcceleratorTarget(accelerator()),
  );

  // A records for other host names within the domain
  for (const hostName of ['api', 'admin', 'console', 'docs']) {
    new Route53.ARecord(loadtestZone(), hostName, {
      zone: loadtestZone(),
      recordName: hostName,
      target: acceleratorTarget,
    });
  }
});
