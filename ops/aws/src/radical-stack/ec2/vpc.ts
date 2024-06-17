import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as EC2 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

// For now we just import pre-defined VPCs here. In the future, we should
// actually define them here.
export const vpcId = 'vpc-1f773277';

export const defaultVpc = define(() => {
  const vpc = EC2.Vpc.fromLookup(radicalStack(), 'defaultVpc', {
    vpcId,
  });
  vpc.addFlowLog('defaultVpc-flowLog');

  return vpc;
});

export const publicSubnetA = define(() =>
  EC2.PublicSubnet.fromSubnetAttributes(radicalStack(), 'public-subnet-a', {
    subnetId: 'subnet-c0ae25ba',
    ipv4CidrBlock: '172.31.16.0/20',
    availabilityZone: 'eu-west-2a',
  }),
);
export const publicSubnetB = define(() =>
  EC2.PublicSubnet.fromSubnetAttributes(radicalStack(), 'public-subnet-b', {
    subnetId: 'subnet-f177a9bd',
    ipv4CidrBlock: '172.31.32.0/20',
    availabilityZone: 'eu-west-2b',
  }),
);
export const publicSubnetC = define(() =>
  EC2.PublicSubnet.fromSubnetAttributes(radicalStack(), 'public-subnet-c', {
    subnetId: 'subnet-b086c9d9',
    ipv4CidrBlock: '172.31.0.0/20',
    availabilityZone: 'eu-west-2c',
  }),
);

// These are the IP addresses outbound traffic from our servers comes from.
// If we change anything here we must update customers with deep slack integration
// in advance so they can adjust the list of whitelabelled IPs for their custom Slack app.
export const [
  publicSubnetANatGateway,
  publicSubnetBNatGateway,
  publicSubnetCNatGateway,
] = [publicSubnetA, publicSubnetB, publicSubnetC].map((psn, idx) =>
  define(() => {
    const elasticIP = new EC2.CfnEIP(radicalStack(), `EIP-${idx}`, {
      domain: 'vpc',
    });
    elasticIP.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.DELETE;

    const gateway = new EC2.CfnNatGateway(radicalStack(), `NATGateway-${idx}`, {
      subnetId: psn().subnetId,
      allocationId: elasticIP.attrAllocationId,
    });
    gateway.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.DELETE;

    return gateway;
  }),
);
