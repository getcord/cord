import { aws_ec2 as EC2 } from 'aws-cdk-lib';

import type { Tier } from 'ops/aws/src/common.ts';
import { define, defineForEachTier, tiers } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { securityGroup as loadBalancerSecurityGroup } from 'ops/aws/src/radical-stack/ec2/loadBalancers.ts';
import { zeroSecurityGroup } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { SSH_PORT } from 'ops/aws/src/Constants.ts';
import { build3SecurityGroup } from 'ops/aws/src/radical-stack/ec2/build3.ts';
import { DEFAULT_SECURITY_GROUP_ID } from 'ops/aws/src/radical-stack/Config.ts';

export const defaultSecurityGroup = define(() =>
  EC2.SecurityGroup.fromSecurityGroupId(
    radicalStack(),
    'defaultSecurityGroup',
    DEFAULT_SECURITY_GROUP_ID,
  ),
);

export const allowSshFromInternalNetworkSecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(
    radicalStack(),
    'allowSshFromInternalNetworkSecurityGroup',
    {
      vpc: defaultVpc(),
      securityGroupName: `allowSshFromInternalNetwork`,
    },
  );

  sg.addIngressRule(
    EC2.Peer.ipv4(defaultVpc().vpcCidrBlock),
    EC2.Port.tcp(SSH_PORT),
  );

  return sg;
});

export const securityGroups = defineForEachTier(makeSecurityGroup);

function makeSecurityGroup(tier: Tier) {
  const sg = new EC2.SecurityGroup(radicalStack(), `${tier}SecurityGroup`, {
    vpc: defaultVpc(),
    securityGroupName: `${tier}SecurityGroup`,
  });

  sg.addIngressRule(monitoringSecurityGroup(), EC2.Port.tcp(MONITORING_PORT));
  return sg;
}

define(() => {
  for (const tier of tiers) {
    const destination = securityGroups[tier]();
    for (const port of [8123, 8161, 8171, 8191]) {
      for (const source of [loadBalancerSecurityGroup()]) {
        destination.addIngressRule(source, EC2.Port.tcp(port));
      }
    }

    for (const source of [zeroSecurityGroup(), build3SecurityGroup()]) {
      destination.addIngressRule(source, EC2.Port.allTcp());
    }
  }
});

export const MONITORING_PORT = 8111;
export const monitoringSecurityGroup = define(
  () =>
    new EC2.SecurityGroup(radicalStack(), 'monitoringSecurityGroup', {
      vpc: defaultVpc(),
      securityGroupName: 'monitoringSecurityGroup',
    }),
);
define(() => {
  monitoringSecurityGroup().addIngressRule(
    loadBalancerSecurityGroup(),
    EC2.Port.tcp(3000), // Grafana
  );
  monitoringSecurityGroup().addIngressRule(
    loadBalancerSecurityGroup(),
    EC2.Port.tcp(8080), // Oncall
  );
  monitoringSecurityGroup().addIngressRule(
    EC2.Peer.ipv4(defaultVpc().vpcCidrBlock),
    EC2.Port.tcp(4040), // Pyroscope
  );
});
