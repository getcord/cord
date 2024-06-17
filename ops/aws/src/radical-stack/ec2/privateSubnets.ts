import { aws_ec2 as EC2 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import {
  publicSubnetANatGateway,
  publicSubnetBNatGateway,
  publicSubnetCNatGateway,
  vpcId,
} from 'ops/aws/src/radical-stack/ec2/vpc.ts';

// These were defined with 24-bit netmasks, so there are less than 255 available
// addresses in each, that's not much. These subnets are in use, but when adding
// new stuff, use the large privateSubnets below.
export const legacyPrivateSubnets = define(() =>
  ['a', 'b', 'c'].map(
    (zone, idx) =>
      new EC2.PrivateSubnet(radicalStack(), `subnet${zone.toUpperCase()}`, {
        availabilityZone: `eu-west-2${zone}`,
        vpcId,
        // 172.31.{129,130,131}.0/24
        cidrBlock: `172.31.${129 + idx}.0/24`,
        mapPublicIpOnLaunch: false,
      }),
  ),
);

export const privateSubnets = define(() =>
  (['a', 'b', 'c'] as const).map((zone, idx) => {
    const subnet = new EC2.PrivateSubnet(
      radicalStack(),
      `private-subnet-${zone}`,
      {
        availabilityZone: `eu-west-2${zone}`,
        vpcId,
        // 172.31.{144,160,176}.0/20
        cidrBlock: `172.31.${144 + idx * 16}.0/20`,
        mapPublicIpOnLaunch: false,
      },
    );

    const gateway = {
      a: publicSubnetANatGateway,
      b: publicSubnetBNatGateway,
      c: publicSubnetCNatGateway,
    }[zone]();
    subnet.addDefaultNatRoute(gateway.ref);

    return subnet;
  }),
);
