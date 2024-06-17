import { aws_route53 as Route53 } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

export function newDualRecord(
  zone: Route53.IHostedZone & Construct,
  target: Route53.RecordTarget,
  recordName?: string,
  options?: Partial<Route53.ARecordProps & Route53.AaaaRecordProps>,
) {
  new Route53.ARecord(zone, recordName ?? '_', {
    zone,
    recordName,
    target,
    ...options,
  });

  new Route53.AaaaRecord(zone, `aaaa/${recordName ?? '_'}`, {
    zone,
    recordName,
    target,
    ...options,
  });
}
