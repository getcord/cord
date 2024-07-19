import {
  aws_ec2 as EC2,
  aws_ssm as SSM,
  aws_iam as IAM,
  aws_cloudwatch as CloudWatch,
  aws_cloudwatch_actions as CWActions,
  NestedStack,
  Duration,
} from 'aws-cdk-lib';
import jsonStableStringify from 'fast-json-stable-stringify';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { allowSshFromInternalNetworkSecurityGroup } from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { addToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';
import { installCfnHupConfigOnUbuntu } from 'ops/aws/src/radical-stack/ec2/CloudFormationInit.ts';
import {
  enableEc2InstanceConnect,
  waitForInstanceInit,
} from 'ops/aws/src/radical-stack/ec2/common.ts';
import { opsNotificationTopic } from 'ops/aws/src/radical-stack/sns/topics.ts';
import { privateSubnets } from 'ops/aws/src/radical-stack/ec2/privateSubnets.ts';
import { basicAgentConfig } from 'ops/aws/config/cloudwatch-agent/config.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';
import { ec2KeyPair } from 'ops/aws/src/radical-stack/ec2/keyPair.ts';

export const hostname = 'build3';
// Whether to install the services on the machine that allow it to operate as a
// runner for GitHub actions, local tests, etc.
export const INCLUDE_GITHUB_RUNNER = false;

const availabilityZone = `${AWS_REGION}b`;
const packages: string[] = [
  'amazon-ecr-credential-helper',
  'docker-compose',
  'docker.io',
  'emacs',
  'git',
  'htop',
  'jq',
  'postgresql-client-12',
  'python3-pip',
  'tmux',
];

const stack = define(() => new NestedStack(radicalStack(), 'stack-build3'));

const machineImage = EC2.MachineImage.genericLinux({
  [AWS_REGION]: SSM.StringParameter.valueForStringParameter(
    stack(),
    '/aws/service/canonical/ubuntu/server/20.04/stable/20220131/amd64/hvm/ebs-gp2/ami-id',
  ),
});

export const build3SecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(stack(), 'security-group', {
    vpc: defaultVpc(),
    securityGroupName: 'build3SecurityGroup',
  });
  return sg;
});

export const build3Instance = define(() => {
  const userData = EC2.UserData.forLinux();
  userData.addCommands(
    // Set host name
    `echo "${hostname}" >/etc/hostname`,
    `hostname "${hostname}"`,

    // Install early dependencies:
    // * awscli: AWS command line client
    // * python3, python3-pip: needed for installing aws-cfn below
    //   (CloudFormationInit support)
    'apt-get update -y',
    'apt-get install --no-install-recommends -y awscli python3 python3-pip',

    // Steps to install AWS CloudFormationInit
    'mkdir -p /opt/aws/bin',
    'pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
    'ln -s /usr/local/bin/cfn-* /opt/aws/bin',

    // Add NodeSource repo so we get Node 18.x, which is what we use in
    // production, instead of whatever Ubuntu's default is at this time.
    // https://github.com/nodesource/distributions#installation-instructions
    'apt-get install --no-install-recommends -y ca-certificates curl gnupg',
    'mkdir -p /etc/apt/keyrings',
    'curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg',
    'echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list',
    'apt-get update',
    'apt-get install -y nodejs',
  );

  const instance = new EC2.Instance(
    stack(),

    // Logical name. Change this (increment version number) to force replacement
    // of this instance with a new one.
    'build3-instance-v3',

    {
      instanceType: EC2.InstanceType.of(
        EC2.InstanceClass.C5N,
        EC2.InstanceSize.XLARGE4,
      ),
      availabilityZone,
      vpc: defaultVpc(),
      machineImage,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: EC2.BlockDeviceVolume.ebs(200, {
            deleteOnTermination: true,
            volumeType: EC2.EbsDeviceVolumeType.GP3,
            iops: 10_000,
          }),
        },
      ],
      securityGroup: build3SecurityGroup(),
      vpcSubnets: { subnets: privateSubnets() },
      keyName: ec2KeyPair().keyName,
      userData,
      userDataCausesReplacement: false,
    },
  );

  // For this instance, we cannot just use `requireImdsv2` to disable old-style
  // tokenless IMDS (Instance MetaData Service). The reason is that we contact
  // AWS services from within Docker. The network traffic from within the Docker
  // container is forwarded by the operating system, which constitutes a "hop"
  // in terms of the IP protocol. By default, AWS's response to the get-a-token
  // http PUT request is sent with a TTL value in the IP header such that it
  // just so reaches the EC2 instance. Response packets do not get forwarded
  // into the Docker container because of the TTL value. We can fix that by
  // providing our own LaunchTemplate, which not only sets `httpTokens` to
  // `required` (the equivalent of setting `requireImdsv2` to `true` above), but
  // also sets the `httpPutResponseHopLimit` to 2 (default is 1). The increased
  // value means that the EC2 instance will forward the response packages into
  // the Docker container instead of discarding them.

  const launchTemplate = new EC2.CfnLaunchTemplate(instance, 'LaunchTemplate', {
    launchTemplateName: `${instance.node.id}LaunchTemplate`,
    launchTemplateData: {
      metadataOptions: {
        httpTokens: 'required',
        httpPutResponseHopLimit: 2,
      },
    },
  });
  instance.instance.launchTemplate = {
    launchTemplateName: launchTemplate.launchTemplateName,
    version: launchTemplate.getAtt('LatestVersionNumber').toString(),
  };

  waitForInstanceInit(instance);
  enableEc2InstanceConnect(instance);
  vanta(
    instance,
    'Instance running self-hosted GitHub Actions Runners for CI',
    {
      includeResourceTypes: ['AWS::EC2::Instance'],
    },
  );

  instance.addSecurityGroup(allowSshFromInternalNetworkSecurityGroup());

  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
  });
  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });

  EC2.CloudFormationInit.fromConfigSets({
    configSets: {
      Init: [
        'installCfnHup',
        'configureApt',
        'installPackages',
        'cloudWatchAgent',
        'dockerCredHelper',
        'dockerPruneCronJob',
        'testDatabase',
        ...(INCLUDE_GITHUB_RUNNER ? ['githubActionsRunner'] : []),
      ],
    },
    configs: {
      installCfnHup: installCfnHupConfigOnUbuntu(instance, 'Init'),
      configureApt: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/etc/apt/apt.conf.d/90norecommends',
          [
            'APT::Install-Recommends "false";\n',
            'APT::AutoRemove::SuggestsImportant "false";\n',
            'APT::AutoRemove::RecommendsImportant "false";\n',
          ].join(''),
        ),

        // Re-run apt-get update after updating configuration
        EC2.InitCommand.argvCommand(['apt-get', 'update', '-y']),
      ]),
      installPackages: new EC2.InitConfig(
        packages.map((pkg) => EC2.InitPackage.apt(pkg)),
      ),
      cloudWatchAgent: new EC2.InitConfig([
        EC2.InitCommand.shellCommand(
          'wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb',
        ),
        EC2.InitCommand.shellCommand(
          'dpkg -i /tmp/amazon-cloudwatch-agent.deb',
        ),
        EC2.InitFile.fromString(
          '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
          jsonStableStringify(basicAgentConfig),
        ),
        EC2.InitCommand.shellCommand(
          '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || true',
        ),
      ]),
      dockerCredHelper: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/root/.docker/config.json',
          JSON.stringify({
            credHelpers: {
              'public.ecr.aws': 'ecr-login',
              [`${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com`]:
                'ecr-login',
            },
          }),
          {
            mode: '000600',
          },
        ),
      ]),
      dockerPruneCronJob: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/etc/cron.daily/docker-prune',
          '#!/bin/bash\n' +
            'exec &>/tmp/docker-prune."$(date +%Y%m%d-%H%M%S)".log\n' +
            'docker system prune -a -f --filter until=24h\n',
          {
            mode: '000755',
          },
        ),
      ]),
      ...(INCLUDE_GITHUB_RUNNER
        ? {
            githubActionsRunner: new EC2.InitConfig([
              EC2.InitFile.fromAsset(
                `/etc/docker/compose/github-actions-runner/docker-compose.yml`,
                `config/build3/github-actions-runner/docker-compose.yml`,
              ),
              EC2.InitFile.fromString(
                '/lib/systemd/system/github-actions-runner.service',
                [
                  '[Unit]\n',
                  'Description=GitHub Actions Runner\n',
                  'Requires=docker.service\n\n',
                  'After=docker.service\n',
                  '[Service]\n',
                  'Type=oneshot\n',
                  'RemainAfterExit=true\n',
                  'TimeoutStartSec=5m\n',
                  'WorkingDirectory=/etc/docker/compose/github-actions-runner\n',
                  'ExecStart=/usr/bin/docker-compose up -d --remove-orphans --scale runner=6\n',
                  'ExecStop=/usr/bin/docker-compose down\n',
                  'Restart=on-failure\n',
                  'RestartSec=5\n',
                  '[Install]\n',
                  'WantedBy=multi-user.target',
                ].join(''),
              ),
              EC2.InitFile.fromString(
                '/etc/cron.d/restart-github-actions-runner',
                '# Restart every morning at 7am UTC\n' +
                  '0 7 * * * root ' +
                  `docker pull ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/github-actions-runner:latest && ` +
                  'systemctl restart github-actions-runner\n',
              ),
              EC2.InitCommand.shellCommand(
                'systemctl daemon-reload && ' +
                  'systemctl enable github-actions-runner && ' +
                  'systemctl restart github-actions-runner',
              ),
            ]),
          }
        : {}),
      testDatabase: new EC2.InitConfig([
        EC2.InitFile.fromAsset(
          `/etc/docker/compose/test-db/docker-compose.yml`,
          `config/build3/test-db/docker-compose.yml`,
        ),
        EC2.InitFile.fromAsset(
          `/etc/docker/compose/test-db/Dockerfile`,
          `../dockerfiles/postgres.dev/Dockerfile`,
        ),
        EC2.InitFile.fromAsset(
          `/etc/docker/compose/test-db/setup-cord.sh`,
          `../dockerfiles/postgres.dev/setup-cord.sh`,
        ),
        EC2.InitFile.fromString(
          '/lib/systemd/system/test-db.service',
          [
            '[Unit]\n',
            'Description=Database for tests\n',
            'Requires=docker.service\n\n',
            'After=docker.service\n',
            '[Service]\n',
            'Type=oneshot\n',
            'RemainAfterExit=true\n',
            'TimeoutStartSec=5m\n',
            'WorkingDirectory=/etc/docker/compose/test-db\n',
            'ExecStart=/usr/bin/docker-compose up -d --remove-orphans\n',
            'ExecStop=/usr/bin/docker-compose down\n',
            'Restart=on-failure\n',
            'RestartSec=5\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitCommand.shellCommand(
          'systemctl daemon-reload && ' +
            'systemctl enable test-db && ' +
            'systemctl restart test-db',
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

  addToInternalZone('build3', instance.instancePrivateIp);

  return instance;
});

define(() => {
  build3Instance().role.attachInlinePolicy(
    new IAM.Policy(stack(), 'build3InstancePolicy', {
      statements: [
        new IAM.PolicyStatement({
          actions: [
            'autoscaling:DescribeAutoScalingInstances',
            'autoscaling:StartInstanceRefresh',
            'autoscaling:CancelInstanceRefresh',
            'cloudfront:CreateInvalidation',
            'ec2:DescribeInstances',
            'elasticloadbalancing:DeregisterTargets',
            'elasticloadbalancing:RegisterTargets',
            'elasticloadbalancing:DescribeTargetHealth',
            'secretsmanager:GetSecretValue',
            's3:GetObject',
            's3:ListBucket',
            's3:PutObject',
          ],
          effect: IAM.Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    }),
  );
});

define(() => {
  const instance = build3Instance();

  const metric = new CloudWatch.Metric({
    namespace: 'AWS/EC2',
    metricName: 'CPUUtilization',
    dimensionsMap: { InstanceId: instance.instanceId },
    statistic: 'Average',
  });

  const serverErrorsAlarm = new CloudWatch.Alarm(
    stack(),
    'alarm-cpu-utilization',
    {
      alarmName: 'build3 CPU utilization',
      alarmDescription: 'CPU utilization above 90% for 10 hours',
      metric: metric.with({ period: Duration.hours(1) }),
      evaluationPeriods: 10,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 90,
      actionsEnabled: true,
    },
  );
  serverErrorsAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic['prod']()),
  );
});
