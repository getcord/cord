import { aws_iam as IAM } from 'aws-cdk-lib';
import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

const policy = define(
  () =>
    new IAM.ManagedPolicy(
      radicalStack(),
      'AmazonEC2ContainerRegistryReadOnlyForSnyk',
      {
        managedPolicyName: 'AmazonEC2ContainerRegistryReadOnlyForSnyk',
        statements: [
          new IAM.PolicyStatement({
            sid: 'SnykAllowPull',
            effect: IAM.Effect.ALLOW,
            actions: [
              'ecr:GetLifecyclePolicyPreview',
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
              'ecr:DescribeImages',
              'ecr:GetAuthorizationToken',
              'ecr:DescribeRepositories',
              'ecr:ListTagsForResource',
              'ecr:ListImages',
              'ecr:BatchCheckLayerAvailability',
              'ecr:GetRepositoryPolicy',
              'ecr:GetLifecyclePolicy',
            ],
            resources: ['*'],
          }),
        ],
      },
    ),
);

const role = define(
  () =>
    new IAM.Role(radicalStack(), 'SnykServiceRole', {
      roleName: 'SnykServiceRole',
      description:
        'Allows EC2 instances to call Snyk AWS services on your behalf',
      assumedBy: new IAM.PrincipalWithConditions(
        new IAM.ArnPrincipal(
          'arn:aws:iam::198361731867:user/ecr-integration-user',
        ),
        {
          StringEquals: {
            'sts:ExternalId': '083432f5-c321-4a1a-af27-fe2bea954be6',
          },
        },
      ),
    }),
);

define(() => {
  role().addManagedPolicy(policy());
});
