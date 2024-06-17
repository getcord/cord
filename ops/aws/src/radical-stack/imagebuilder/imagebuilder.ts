import { aws_iam as IAM, aws_s3 as S3, RemovalPolicy } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

export const imagebuilderLogBucket = define(() => {
  const bucket = new S3.Bucket(radicalStack(), 'imagebuilder-s3logs', {
    bucketName: 'imagebuilder-s3logs',
    removalPolicy: RemovalPolicy.DESTROY,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    encryption: S3.BucketEncryption.S3_MANAGED,
  });
  vanta(bucket, 'Log files from AWS ImageBuilder', {});
  return bucket;
});

export const imageBuilderInstanceRole = define(() => {
  const role = new IAM.Role(radicalStack(), 'imagebuilder-instance-role', {
    roleName: 'imagebuilder-instance-role',
    managedPolicies: [
      {
        managedPolicyArn:
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      {
        managedPolicyArn:
          'arn:aws:iam::aws:policy/EC2InstanceProfileForImageBuilder',
      },
    ],
    assumedBy: new IAM.ServicePrincipal('ec2.amazonaws.com'),
    path: '/executionServiceEC2Role/',
  });

  imagebuilderLogBucket().grantReadWrite(role);

  return role;
});

export const imageBuilderInstanceProfile = define(
  () =>
    new IAM.CfnInstanceProfile(
      radicalStack(),
      'imagebuilder-instance-profile',
      {
        instanceProfileName: 'imagebuilder-instance-profile',
        roles: [imageBuilderInstanceRole().roleName],
        path: '/executionServiceEC2Role/',
      },
    ),
);
