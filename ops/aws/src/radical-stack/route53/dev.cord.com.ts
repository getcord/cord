import {
  aws_route53 as Route53,
  aws_route53_targets as Route53Targets,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { cordComZones } from 'ops/aws/src/radical-stack/route53/cord.com.ts';
import { accelerator } from 'ops/aws/src/radical-stack/globalaccelerator/index.ts';
import { newDualRecord } from 'ops/aws/src/radical-stack/route53/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

export const devZone = define(() => {
  const zone = new Route53.PublicHostedZone(
    radicalStack(),
    'dev.cord.com-zone',
    {
      zoneName: 'dev.cord.com',
    },
  );

  cordComZones().get('cord.com')?.addDelegation(zone);

  return zone;
});

define(() => {
  const zone = devZone();
  const acceleratorTarget = Route53.RecordTarget.fromAlias(
    new Route53Targets.GlobalAcceleratorTarget(accelerator()),
  );
  // *.dev.cord.com
  newDualRecord(zone, acceleratorTarget, '*');
});
