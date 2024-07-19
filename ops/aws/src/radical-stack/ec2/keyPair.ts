import { aws_ec2 as EC2 } from 'aws-cdk-lib';
import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

export const ec2KeyPair = define(() => {
  return new EC2.CfnKeyPair(radicalStack(), 'radical-ec2-key', {
    keyName: 'radical-ec2-key',
  });
});
