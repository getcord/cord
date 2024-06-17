import { aws_ec2 as EC2 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { usEast1Stack } from 'ops/aws/src/us-east-1/stack.ts';

// For now we just import pre-defined VPCs here. In the future, we should
// actually define them here.
export const vpcId = 'vpc-54696e2e';

export const defaultVpc = define(() => {
  const vpc = EC2.Vpc.fromLookup(usEast1Stack(), 'defaultVpc', {
    vpcId,
  });
  vpc.addFlowLog('defaultVpc-flowLog');

  return vpc;
});
