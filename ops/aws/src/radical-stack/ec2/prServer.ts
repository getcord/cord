import { createHash } from 'crypto';
import { readFileSync } from 'fs';

import { aws_ec2 as EC2, AssetHashType, NestedStack } from 'aws-cdk-lib';
import jsonStableStringify from 'fast-json-stable-stringify';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { allowSshFromInternalNetworkSecurityGroup } from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { addToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { installCfnHupConfig } from 'ops/aws/src/radical-stack/ec2/CloudFormationInit.ts';
import {
  enableEc2InstanceConnect,
  waitForInstanceInit,
} from 'ops/aws/src/radical-stack/ec2/common.ts';
import { privateSubnets } from 'ops/aws/src/radical-stack/ec2/privateSubnets.ts';
import { amazonLinuxWithDockerMachineImage } from 'ops/aws/src/radical-stack/imagebuilder/amazon-linux-with-docker.ts';
import { basicAgentConfig } from 'ops/aws/config/cloudwatch-agent/config.ts';
import { build3SecurityGroup } from 'ops/aws/src/radical-stack/ec2/build3.ts';
import { securityGroup as loadBalancerSecurityGroup } from 'ops/aws/src/radical-stack/ec2/loadBalancers.ts';
import { serverPermissionPolicy } from 'ops/aws/src/radical-stack/ec2/autoScalingGroup.ts';
import { zeroSecurityGroup } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';

export const hostname = 'pr-server';
const availabilityZone = `${AWS_REGION}a`;
const packages = ['nodejs', 'jq', 'git'];

export const prServerStack = define(
  () => new NestedStack(radicalStack(), 'stack-prserver'),
);

export const prServerSecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(prServerStack(), 'security-group', {
    vpc: defaultVpc(),
    securityGroupName: 'prServerSecurityGroup',
  });
  return sg;
});
define(() => {
  const sg = prServerSecurityGroup();
  for (const peerSecurityGroup of [
    loadBalancerSecurityGroup(),
    build3SecurityGroup(),
    zeroSecurityGroup(),
  ]) {
    sg.addIngressRule(peerSecurityGroup, EC2.Port.tcp(8081));
    peerSecurityGroup.addEgressRule(sg, EC2.Port.tcp(8081));
  }
});

export const prServerInstance = define(() => {
  const userData = EC2.UserData.forLinux();
  userData.addCommands(
    // Add EPEL rpm repository so we can install nginx
    `amazon-linux-extras install -y epel`,
  );

  const instance = new EC2.Instance(
    prServerStack(),

    // Logical name. Change this (increment version number) to force replacement
    // of this instance with a new one.
    'prServer-instance-v5',

    {
      instanceType: EC2.InstanceType.of(
        // Burstable instance, 4 vCPUs, 16GiB ram
        EC2.InstanceClass.T3,
        EC2.InstanceSize.XLARGE,
      ),
      availabilityZone,
      vpc: defaultVpc(),
      machineImage: amazonLinuxWithDockerMachineImage(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: EC2.BlockDeviceVolume.ebs(200, {
            deleteOnTermination: true,
            volumeType: EC2.EbsDeviceVolumeType.GP3,
            iops: 10_000,
          }),
        },
      ],
      securityGroup: prServerSecurityGroup(),
      vpcSubnets: { subnets: privateSubnets() },
      keyName: 'radical-ec2-key',
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
  vanta(instance, 'Instance serving builds of pull requests', {
    nonProd: true,
    includeResourceTypes: ['AWS::EC2::Instance'],
  });

  instance.addSecurityGroup(allowSshFromInternalNetworkSecurityGroup());

  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });

  instance.role.attachInlinePolicy(serverPermissionPolicy());

  const webserverServiceHandle = new EC2.InitServiceRestartHandle();
  EC2.CloudFormationInit.fromConfigSets({
    configSets: {
      Init: [
        'installCfnHup',
        'addNodesourceRepo',
        'installPackages',
        'cloudWatchAgent',
        'deployScript',
        'prServer',
      ],
    },
    configs: {
      installCfnHup: installCfnHupConfig(instance, 'Init'),
      addNodesourceRepo: new EC2.InitConfig([
        EC2.InitCommand.shellCommand(
          [
            'curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -',
            'yum install -y nodejs',
          ].join(' && '),
        ),
      ]),
      installPackages: new EC2.InitConfig(
        packages.map((pkg) => EC2.InitPackage.yum(pkg)),
      ),
      cloudWatchAgent: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
          jsonStableStringify(basicAgentConfig),
        ),
        EC2.InitCommand.shellCommand(
          '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || true',
        ),
      ]),
      deployScript: new EC2.InitConfig([
        EC2.InitFile.fromAsset(
          `/root/deploy.sh`,
          `config/pr-server/deploy.sh`,
          {
            mode: '000755',
            owner: 'root',
            group: 'root',
          },
        ),
      ]),
      prServer: new EC2.InitConfig([
        EC2.InitFile.fromAsset(
          `/home/ec2-user/pr-server.cjs`,
          'dist/scripts/pr-server.cjs',
          {
            mode: '000755',
            owner: 'ec2-user',
            group: 'ec2-user',

            // We provide a custom hash, which we calculate from the source TS
            // file rather than the bundle. That's because we don't want to
            // trigger updating this file just because the bundle looks
            // different. This way, only a change to the source TS file will
            // trigger an update.
            assetHashType: AssetHashType.CUSTOM,
            assetHash: createHash('sha256')
              .update(readFileSync('scripts/pr-server.ts'))
              .digest('hex'),
          },
        ),
        EC2.InitFile.fromString(
          '/lib/systemd/system/pr-server.service',
          [
            '[Unit]\n',
            'Description=Pull Request Server\n',
            '[Service]\n',
            'Type=exec\n',
            'User=ec2-user\n',
            'Group=ec2-user\n',
            'Restart=always\n',
            'ExecStart=/home/ec2-user/pr-server.cjs\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('pr-server', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: webserverServiceHandle,
        }),
      ]),
    },
  }).attach(instance.instance, {
    instanceRole: instance.role,
    userData,
    platform: instance.osType,
    embedFingerprint: false,
    configSets: ['Init'],
  });

  addToInternalZone(hostname, instance.instancePrivateIp);

  return instance;
});
