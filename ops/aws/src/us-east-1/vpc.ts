import { aws_ec2 as EC2 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { DEFAULT_VPC_ID_US_EAST_1 } from 'ops/aws/src/radical-stack/Config.ts';
import { usEast1Stack } from 'ops/aws/src/us-east-1/stack.ts';

export const vpcId = DEFAULT_VPC_ID_US_EAST_1;

export const defaultVpc = define(() => {
  const vpc = EC2.Vpc.fromLookup(usEast1Stack(), 'defaultVpc', {
    vpcId,
  });
  vpc.addFlowLog('defaultVpc-flowLog');

  return vpc;
});
