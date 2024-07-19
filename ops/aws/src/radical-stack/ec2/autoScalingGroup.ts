import {
  aws_autoscaling as autoScaling,
  aws_ec2 as EC2,
  aws_cloudwatch as CloudWatch,
  aws_cloudwatch_actions as CWActions,
  aws_iam as IAM,
  Duration,
} from 'aws-cdk-lib';
import jsonStableStringify from 'fast-json-stable-stringify';

import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import type { Tier } from 'ops/aws/src/common.ts';
import { define, defineForEachTier } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import {
  allowSshFromInternalNetworkSecurityGroup,
  securityGroups,
} from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { serverRepo } from 'ops/aws/src/radical-stack/ecr/ECRConfig.ts';
import {
  opsNotificationTopic,
  snsTopics,
} from 'ops/aws/src/radical-stack/sns/topics.ts';
import { amazonLinuxWithDockerMachineImage } from 'ops/aws/src/radical-stack/imagebuilder/amazon-linux-with-docker.ts';
import {
  serverAPITargetGroups,
  serverAdminTargetGroups,
  serverConsoleTargetGroups,
  serverDocsTargetGroups,
} from 'ops/aws/src/radical-stack/ec2/loadBalancers.ts';
import { privateSubnets } from 'ops/aws/src/radical-stack/ec2/privateSubnets.ts';
import { publicUploadsBucket } from 'ops/aws/src/radical-stack/s3/publicProfilePicturesBucket.ts';
import { makeAgentConfig } from 'ops/aws/config/cloudwatch-agent/config.ts';
import { stringToBase64 } from 'ops/aws/src/util.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { enableEc2InstanceConnect } from 'ops/aws/src/radical-stack/ec2/common.ts';
import { fileUploadsBucket } from 'ops/aws/src/radical-stack/s3/fileUploads.ts';
import { AWS_ACCOUNT, LOADTEST_TIER_ENABLED } from 'ops/aws/src/Config.ts';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';
import { ec2KeyPair } from 'ops/aws/src/radical-stack/ec2/keyPair.ts';

const userData = (service: 'server' | 'asyncWorker', tier: Tier) => {
  const script = EC2.UserData.forLinux();
  script.addCommands(
    `echo "${stringToBase64(
      jsonStableStringify(makeAgentConfig(tier)),
    )}" | base64 -d > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || true`,
    `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || true`,
    `sudo -u ec2-user docker stop server || true`,
    `sudo -u ec2-user docker rm server || true`,
    `sudo -u ec2-user docker pull ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/server:${tier}`,
    `sudo -u ec2-user docker run -d --restart always --name ${service} --network host \
      -e CORD_TIER=${tier} \
      ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/server:${tier} \
      ${
        // * 'server' runs the default command configured in our Docker image.
        service === 'server' ? '' : `npm run start-${service}-prod`
      }`,
  );
  return script;
};

export const serverLondonASGs = defineForEachTier(makeServerASG);

function makeServerASG(tier: Tier) {
  if (tier === 'loadtest' && !LOADTEST_TIER_ENABLED) {
    return null;
  }

  const autoScalingGroupName = `${tier}-server`;
  const asg = new autoScaling.AutoScalingGroup(
    radicalStack(),
    `${tier}ServerLondonASG`,
    {
      autoScalingGroupName,
      instanceType: EC2.InstanceType.of(
        // m5.xlarge: general purpose instance type
        // 4 vCPUs, 16 GiB of ram
        EC2.InstanceClass.M5,
        EC2.InstanceSize.XLARGE,
      ),
      vpc: defaultVpc(),
      vpcSubnets: { subnets: privateSubnets() },
      associatePublicIpAddress: false,
      machineImage: amazonLinuxWithDockerMachineImage(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoScaling.BlockDeviceVolume.ebs(40, {
            deleteOnTermination: true,
          }),
        },
      ],
      securityGroup: securityGroups[tier](),
      userData: userData('server', tier),
      ...Config.SERVER_AUTOSCALING_CAPACITY[tier],
      keyName: ec2KeyPair().keyName,
      instanceMonitoring: autoScaling.Monitoring.DETAILED,
      healthCheck: autoScaling.HealthCheck.elb({ grace: Duration.minutes(5) }),
      notifications: [
        {
          topic: snsTopics[tier](),
        },
      ],
      requireImdsv2: true,
    },
  );
  vanta(
    asg,
    tier === 'prod'
      ? 'Our primary production servers fleet running all business-critical customer facing applications'
      : `Non-production ${tier} environment`,

    {
      applyToLaunchedInstances: true,
      nonProd: tier !== 'prod',
    },
  );

  enableEc2InstanceConnect(asg);

  serverRepo().grantPull(asg.role);
  publicUploadsBucket().grantReadWrite(asg.role);
  fileUploadsBucket().grantReadWrite(asg.role);
  asg.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
  });
  asg.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });
  asg.role.attachInlinePolicy(serverPermissionPolicy());

  asg.addSecurityGroup(allowSshFromInternalNetworkSecurityGroup());

  asg.scaleOnCpuUtilization('KeepSpareCPU', {
    targetUtilizationPercent: 60,
  });

  const cfnAsg = getAsgResource(asg);
  const apiTargetGroup = serverAPITargetGroups[tier]();
  const adminTargetGroup = serverAdminTargetGroups[tier]();
  const consoleTargetGroup = serverConsoleTargetGroups[tier]();
  const docsTargetGroup = serverDocsTargetGroups[tier]();

  cfnAsg.targetGroupArns = [
    adminTargetGroup?.targetGroupArn,
    apiTargetGroup?.targetGroupArn,
    consoleTargetGroup?.targetGroupArn,
    docsTargetGroup?.targetGroupArn,
  ].filter((x?: string): x is string => x !== undefined);

  attachAlarmstoASG(asg, autoScalingGroupName, tier);

  return asg;
}

export const asyncLondonASGs = defineForEachTier(makeAsyncASG);

function makeAsyncASG(tier: Tier) {
  if (tier === 'loadtest' && !LOADTEST_TIER_ENABLED) {
    return null;
  }

  const autoScalingGroupName = `${tier}-asyncWorker`;
  const asg = new autoScaling.AutoScalingGroup(
    radicalStack(),
    `${tier}AsyncLondonASG`,
    {
      autoScalingGroupName,
      instanceType: EC2.InstanceType.of(
        // t3.xlarge: burstable general-purpose instance type
        // 4 vCPUs (40% average usage included in price), 16 GiB of ram
        EC2.InstanceClass.T3,
        EC2.InstanceSize.XLARGE,
      ),
      vpc: defaultVpc(),
      vpcSubnets: { subnets: privateSubnets() },
      associatePublicIpAddress: false,
      machineImage: amazonLinuxWithDockerMachineImage(),
      securityGroup: securityGroups[tier](),
      userData: userData('asyncWorker', tier),
      minCapacity: 1,
      maxCapacity: 1,
      keyName: ec2KeyPair().keyName,
      requireImdsv2: true,
    },
  );
  vanta(
    asg,
    tier === 'prod'
      ? 'Production group of servers that execute long-running jobs: data migrations and handling expensive API requests etc'
      : `Non-production ${tier} environment`,

    {
      applyToLaunchedInstances: true,
      nonProd: tier !== 'prod',
    },
  );

  serverRepo().grantPull(asg.role);
  publicUploadsBucket().grantReadWrite(asg.role);
  fileUploadsBucket().grantReadWrite(asg.role);
  asg.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });
  asg.role.attachInlinePolicy(serverPermissionPolicy());

  asg.addSecurityGroup(allowSshFromInternalNetworkSecurityGroup());

  attachAlarmstoASG(asg, autoScalingGroupName, tier);

  return asg;
}

export function attachAlarmstoASG(
  asg: autoScaling.AutoScalingGroup,
  groupName: string,
  tier: Tier,
) {
  const metric = new CloudWatch.Metric({
    namespace: 'AWS/EC2',
    metricName: 'CPUUtilization',
    dimensionsMap: { AutoScalingGroupName: groupName },
    statistic: 'Average',
  });

  const serverErrorsAlarm = new CloudWatch.Alarm(asg, 'alarm-cpu-utilization', {
    alarmName: `${groupName} CPU utilization`,
    alarmDescription: 'CPU utilization above 75%',
    metric: metric.with({ period: Duration.minutes(1) }),
    evaluationPeriods: 2,
    comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    threshold: 75,
    actionsEnabled: true,
  });
  serverErrorsAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic[tier]()),
  );
}

export const serverPermissionPolicy = define(
  () =>
    new IAM.Policy(radicalStack(), 'serverPermissionPolicy', {
      statements: [
        new IAM.PolicyStatement({
          actions: [
            'iam:GenerateCredentialReport',
            'iam:GetCredentialReport',
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
            'logs:PutLogEvents',
            'logs:GetLogEvents',
            'logs:FilterLogEvents',
            'secretsmanager:GetSecretValue',
          ],
          effect: IAM.Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    }),
);

export function getAsgResource(asg: autoScaling.AutoScalingGroup) {
  const resource = asg.node.defaultChild;

  if (resource instanceof autoScaling.CfnAutoScalingGroup) {
    return resource;
  }

  throw new Error('node.defaultChild does not have expected type');
}
