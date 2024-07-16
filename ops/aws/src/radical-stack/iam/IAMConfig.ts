import { aws_iam as IAM } from 'aws-cdk-lib';

import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';
import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

define(() =>
  new IAM.ManagedPolicy(radicalStack(), 'ec2-instance-connect', {
    managedPolicyName: 'ec2-instance-connect',
    description:
      'Enables users to use EC2 Instance Connect to connect to EC2 machines',
    statements: [
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        actions: ['ec2-instance-connect:SendSSHPublicKey'],
        resources: [
          `arn:aws:ec2:${Config.AWS_REGION}:${AWS_ACCOUNT}:instance/*`,
        ],
        conditions: {
          StringEquals: {
            'ec2:osuser': ['ec2-user', 'ubuntu'],
            'aws:ResourceTag/enable-ec2-connect': 'true',
          },
        },
      }),
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        actions: ['ec2:DescribeInstances'],
        resources: ['*'],
      }),
    ],
    groups: [
      IAM.Group.fromGroupArn(
        radicalStack(),
        'Group',
        Config.EC2_INSTANCE_CONNECT_GROUP,
      ),
    ],
  }));
