import { aws_ecr as ECR, Duration } from 'aws-cdk-lib';

import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { zeroInstance } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { build3Instance } from 'ops/aws/src/radical-stack/ec2/build3.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { monitoringInstance } from 'ops/aws/src/radical-stack/ec2/monitoring.ts';

export const serverRepo = define(() => {
  const repo = new ECR.Repository(radicalStack(), 'ServerECRRepo', {
    repositoryName: Config.ECR_SERVER_REPO_NAME,
    imageScanOnPush: false,
  });
  vanta(
    repo,
    'Repository for Docker images containing builds of our server software',
    {},
  );

  repo.addLifecycleRule({
    description: 'Remove images built when submitting PRs after 7 days',
    tagStatus: ECR.TagStatus.TAGGED,
    tagPrefixList: ['build-'],
    maxImageAge: Duration.days(7),
    rulePriority: 1,
  });
  repo.addLifecycleRule({
    description: 'Remove all images after 14 days',
    tagStatus: ECR.TagStatus.ANY,
    maxImageAge: Duration.days(14),
    rulePriority: 2,
  });

  return repo;
});

export const oncallRepo = define(() => {
  const repo = new ECR.Repository(radicalStack(), 'OncallECRRepo', {
    repositoryName: Config.ECR_ONCALL_REPO_NAME,
    imageScanOnPush: false,
  });
  vanta(
    repo,
    'Repository for Docker images containing builds of oncall management software',
    { nonProd: true },
  );

  repo.addLifecycleRule({
    description: 'Remove untagged images after 7 days',
    tagStatus: ECR.TagStatus.UNTAGGED,
    maxImageAge: Duration.days(7),
  });

  return repo;
});

// gar = GitHub Actions Runner
export const garRepo = define(() => {
  const repo = new ECR.Repository(radicalStack(), 'garECRRepo', {
    repositoryName: 'github-actions-runner',
    imageScanOnPush: false,
  });
  vanta(repo, 'Repository for Docker images of our GitHub Actions Runner', {});

  repo.addLifecycleRule({
    description: 'Remove untagged images after 7 days',
    tagStatus: ECR.TagStatus.UNTAGGED,
    maxImageAge: Duration.days(7),
  });

  return repo;
});

define(() => {
  serverRepo().grantPullPush(zeroInstance().role);
  serverRepo().grantPullPush(build3Instance().role);
  oncallRepo().grantPullPush(zeroInstance().role);
  oncallRepo().grantPullPush(build3Instance().role);
  oncallRepo().grantPull(monitoringInstance().role);
  garRepo().grantPullPush(zeroInstance().role);
  garRepo().grantPullPush(build3Instance().role);
});
