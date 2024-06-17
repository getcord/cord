import { aws_route53 as Route53, Duration } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';

export const internalZone = define(
  () =>
    new Route53.PrivateHostedZone(radicalStack(), 'intCordCom-zone', {
      zoneName: 'int.cord.com',
      vpc: defaultVpc(),
    }),
);

export function addToInternalZone(name: string, ip: string) {
  const zone = internalZone();

  new Route53.ARecord(zone, name, {
    zone,
    target: Route53.RecordTarget.fromIpAddresses(ip),
    recordName: name,
    ttl: Duration.minutes(3),
  });
}

export function addAliasToInternalZone(name: string, domainName: string) {
  const zone = internalZone();

  new Route53.CnameRecord(zone, name, {
    zone,
    recordName: name,
    domainName,
    ttl: Duration.minutes(3),
  });
}
