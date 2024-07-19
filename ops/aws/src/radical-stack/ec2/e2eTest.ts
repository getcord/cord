import {
  aws_ec2 as EC2,
  aws_ecr as ECR,
  aws_logs as CWL,
  aws_s3 as S3,
  aws_secretsmanager as SecretsManager,
  NestedStack,
  Duration,
} from 'aws-cdk-lib';
import jsonStableStringify from 'fast-json-stable-stringify';

import { define } from 'ops/aws/src/common.ts';
import { SSH_PORT } from 'ops/aws/src/Constants.ts';
import { serverLondonASGs } from 'ops/aws/src/radical-stack/ec2/autoScalingGroup.ts';
import { build3Instance } from 'ops/aws/src/radical-stack/ec2/build3.ts';
import { installCfnHupConfig } from 'ops/aws/src/radical-stack/ec2/CloudFormationInit.ts';
import {
  enableEc2InstanceConnect,
  waitForInstanceInit,
} from 'ops/aws/src/radical-stack/ec2/common.ts';
import { zeroInstance } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { amazonLinuxWithDockerMachineImage } from 'ops/aws/src/radical-stack/imagebuilder/amazon-linux-with-docker.ts';
import { addToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { basicAgentConfig } from 'ops/aws/config/cloudwatch-agent/config.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';
import {
  AWS_REGION,
  S3_BUCKET_PREFIX,
} from 'ops/aws/src/radical-stack/Config.ts';
import { ec2KeyPair } from 'ops/aws/src/radical-stack/ec2/keyPair.ts';

const stack = define(() => new NestedStack(radicalStack(), 'stack-e2eTest'));

export const e2eTestVpc = define(() => {
  const vpc = new EC2.Vpc(stack(), 'vpc', {
    vpcName: 'e2eTest',
    ipAddresses: EC2.IpAddresses.cidr('172.30.0.0/16'),
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'public',
        subnetType: EC2.SubnetType.PUBLIC,
      },
    ],
    maxAzs: 1,
  });
  vpc.addFlowLog('e2eTestVpc-flowLog');

  vanta(
    vpc,
    'vpc for having end-to-end testing separated from our production vpc',
    { nonProd: true },
  );

  return vpc;
});

export const e2eTestSecurityGroup = define(
  () =>
    new EC2.SecurityGroup(stack(), 'e2eTestSecurityGroup', {
      vpc: e2eTestVpc(),
      securityGroupName: 'e2eTestSecurityGroup',
      allowAllOutbound: true,
    }),
);

define(() => {
  e2eTestSecurityGroup().addIngressRule(
    EC2.Peer.ipv4(`${zeroInstance().instancePublicIp}/32`),
    EC2.Port.tcp(SSH_PORT),
    'allow SSH access from zero',
  );
});

const e2eTestInstance = define(() => {
  const userData = EC2.UserData.forLinux();

  const instance = new EC2.Instance(stack(), 'e2etest', {
    instanceType: EC2.InstanceType.of(
      // Burstable instance, 4 vCPUs, 16GiB ram
      EC2.InstanceClass.T3,
      EC2.InstanceSize.XLARGE,
    ),
    vpc: e2eTestVpc(),
    machineImage: amazonLinuxWithDockerMachineImage(),
    blockDevices: [
      {
        deviceName: '/dev/xvda',
        volume: EC2.BlockDeviceVolume.ebs(80, {
          deleteOnTermination: true,
          volumeType: EC2.EbsDeviceVolumeType.GP3,
          iops: 10_000,
        }),
      },
    ],
    userData,
    userDataCausesReplacement: true,
    securityGroup: e2eTestSecurityGroup(),
    keyName: ec2KeyPair().keyName,
    requireImdsv2: true,
  });
  vanta(instance, 'EC2 instance running automated e2e tests', {
    nonProd: true,
  });
  addToInternalZone('e2e-test', instance.instancePublicIp);
  waitForInstanceInit(instance);
  enableEc2InstanceConnect(instance);

  const serviceHandle = new EC2.InitServiceRestartHandle();

  EC2.CloudFormationInit.fromConfigSets({
    configSets: {
      Init: ['installCfnHup', 'configureE2eTestRunner', 'cloudWatchAgent'],
    },
    configs: {
      installCfnHup: installCfnHupConfig(instance, 'Init'),
      configureE2eTestRunner: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/etc/systemd/system/e2e-test-runner.service',
          [
            '[Unit]\n',
            'Description=e2e test runner\n',
            '[Service]\n',
            'Restart=always\n',
            `ExecStartPre=/bin/sh -c '/usr/bin/aws ecr get-login-password --region "${AWS_REGION}" | /usr/bin/docker login -u AWS https://${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com --password-stdin'\n`,
            `ExecStart=/usr/bin/docker run --rm=true --name=e2e-test-runner --net=host --ipc=host --init ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/e2e-test-runner:latest\n`,
            'ExecStop=/usr/bin/docker stop -t 2 e2e-test-runner\n\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('e2e-test-runner', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: serviceHandle,
        }),
        EC2.InitFile.fromString(
          // Add a cronjob to keep us logged into the ECR repository
          '/etc/cron.d/ecr-login',
          `0-59/15 * * * * root /usr/bin/aws ecr get-login-password --region "${AWS_REGION}" | /usr/bin/docker login -u AWS https://${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com --password-stdin\n`,
        ),
        EC2.InitFile.fromString(
          // Every minute, pull the newest e2e-test-runner container. (This
          // command completes really quickly (in ~0.1s) if there is no new
          // image to download.)
          '/etc/cron.d/pull-e2e-test-runner',
          `* * * * * root docker pull ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/e2e-test-runner:latest\n`,
        ),
        EC2.InitFile.fromString(
          // Once a day, remove old version of the image.
          '/etc/cron.daily/docker-prune',
          '#!/bin/sh\n\ndocker image prune --force\n',
          {
            mode: '000755',
            owner: 'root',
            group: 'root',
          },
        ),
        EC2.InitFile.fromString(
          // Configure systemd to not use more than 100M of space
          '/etc/systemd/journald.conf',
          '[Journal]\nSystemMaxUse=100M\n',
        ),
      ]),
      cloudWatchAgent: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
          jsonStableStringify(basicAgentConfig),
        ),
        EC2.InitCommand.shellCommand(
          '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || true',
        ),
      ]),
    },
  }).attach(instance.instance, {
    instanceRole: instance.role,
    userData,
    platform: instance.osType,
    embedFingerprint: false,
    configSets: ['Init'],
  });

  return instance;
});

define(() => {
  const secret = new SecretsManager.Secret(stack(), 'e2e-test-secret', {
    description: 'Secrets the e2e test runner needs',
    secretName: 'e2e-test',
  });
  secret.grantRead(e2eTestInstance());
});

const s3Bucket = define(() => {
  const bucket = new S3.Bucket(stack(), 'e2e-tests-s3-bucket', {
    bucketName: `${S3_BUCKET_PREFIX}cord-e2e-tests`,
    blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    encryption: S3.BucketEncryption.S3_MANAGED,
    lifecycleRules: [{ id: '30day-expiration', expiration: Duration.days(30) }],
  });
  vanta(bucket, 'S3 bucket for storing results of our e2e test runs', {
    nonProd: true,
  });
  return bucket;
});

define(() => {
  s3Bucket().grantWrite(e2eTestInstance());
  Object.values(serverLondonASGs).forEach((asg) => {
    const resource = asg();
    if (resource) {
      s3Bucket().grantRead(resource);
    }
  });
});

const e2eTestRepo = define(() => {
  const repo = new ECR.Repository(stack(), 'e2eTestRepo', {
    repositoryName: 'e2e-test-runner',
    imageScanOnPush: false,
  });
  vanta(repo, 'Repository for Docker images of our e2e tests runner', {
    nonProd: true,
  });

  repo.addLifecycleRule({
    description: 'Remove untagged images after 7 days',
    tagStatus: ECR.TagStatus.UNTAGGED,
    maxImageAge: Duration.days(7),
  });

  return repo;
});

define(() => {
  e2eTestRepo().grantPull(e2eTestInstance().role);
  e2eTestRepo().grantPullPush(build3Instance().role);
});

const e2eTestLogGroup = define(() => {
  const lgroup = new CWL.LogGroup(stack(), 'logGroup', {
    logGroupName: 'e2e-test-runner',
    retention: CWL.RetentionDays.ONE_MONTH,
  });
  vanta(lgroup, 'Log group for e2e test runner logs', { nonProd: true });

  return lgroup;
});
define(() => {
  e2eTestLogGroup().grant(
    e2eTestInstance(),
    'logs:CreateLogStream',
    'logs:DescribeLogStreams',
    'logs:PutLogEvents',
  );
});
