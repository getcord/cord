import * as cdk from 'aws-cdk-lib';
import {
  aws_dlm as DLM,
  aws_ec2 as EC2,
  aws_iam as IAM,
  aws_cloudwatch as CloudWatch,
  aws_cloudwatch_actions as CWActions,
  Duration,
  Tags,
} from 'aws-cdk-lib';
import jsonStableStringify from 'fast-json-stable-stringify';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import {
  allowSshFromInternalNetworkSecurityGroup,
  monitoringSecurityGroup,
} from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { addToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { amazonLinuxWithDockerMachineImage } from 'ops/aws/src/radical-stack/imagebuilder/amazon-linux-with-docker.ts';
import { privateSubnets } from 'ops/aws/src/radical-stack/ec2/privateSubnets.ts';
import { installCfnHupConfig } from 'ops/aws/src/radical-stack/ec2/CloudFormationInit.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { basicAgentConfig } from 'ops/aws/config/cloudwatch-agent/config.ts';
import { opsNotificationTopic } from 'ops/aws/src/radical-stack/sns/topics.ts';
import {
  enableEc2InstanceConnect,
  waitForInstanceInit,
} from 'ops/aws/src/radical-stack/ec2/common.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';
import { ec2KeyPair } from 'ops/aws/src/radical-stack/ec2/keyPair.ts';

const availabilityZone = `${AWS_REGION}a`;

export const monitoringInstance = define(() => {
  const userData = EC2.UserData.forLinux();
  userData.addCommands(
    // Attach and mount the data volume
    `EC2_INSTANCE_ID="$(ec2-metadata --instance-id | cut -f 2 -d ' ')"
     echo "EC2_INSTANCE_ID=$EC2_INSTANCE_ID"

     mkdir -p /data

     for attempt in {1..100}
     do
       sleep 5

       echo "Starting attempt #$attempt to attach and mount data volume"
       aws ec2 --region ${AWS_REGION} attach-volume --volume-id ${
         dataVolume().volumeId
       } --device sdh --instance-id "$EC2_INSTANCE_ID" || true
       sleep 1
       if test -b /dev/disk/by-label/monitoring-data
       then
         echo "Found data volume block device"
         echo 'LABEL=monitoring-data /data ext4 defaults,discard 0 0' >>/etc/fstab
         mount /data
         break
       fi
     done
    `,

    // Configure Docker to place
    `mkdir -p /data/docker`,
    `sed --in-place 's|^OPTIONS="|OPTIONS="--data-root /data/docker |' /etc/sysconfig/docker`,
    'systemctl restart docker',
  );

  const instance = new EC2.Instance(radicalStack(), 'monitoring', {
    instanceType: EC2.InstanceType.of(
      // Burstable instance, 8 vCPUs, 32GiB ram
      EC2.InstanceClass.T3,
      EC2.InstanceSize.XLARGE2,
    ),
    vpc: defaultVpc(),
    vpcSubnets: { subnets: privateSubnets() },
    availabilityZone,
    machineImage: amazonLinuxWithDockerMachineImage(),
    userData,
    userDataCausesReplacement: true,
    securityGroup: monitoringSecurityGroup(),
    keyName: ec2KeyPair().keyName,
    requireImdsv2: true,
  });
  vanta(
    instance,
    'Prometheus/Grafana monitoring services. Only stores metrics of our production processes.',
    { nonProd: true },
  );

  instance.addSecurityGroup(allowSshFromInternalNetworkSecurityGroup());
  waitForInstanceInit(instance);
  enableEc2InstanceConnect(instance);
  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess',
  });
  addToInternalZone('monitoring', instance.instancePrivateIp);

  const prometheusServiceHandle = new EC2.InitServiceRestartHandle();
  const pyroscopeServiceHandle = new EC2.InitServiceRestartHandle();
  const grafanaServiceHandle = new EC2.InitServiceRestartHandle();
  const mysqlServiceHandle = new EC2.InitServiceRestartHandle();
  const oncallServiceHandle = new EC2.InitServiceRestartHandle();

  EC2.CloudFormationInit.fromConfigSets({
    configSets: {
      Init: [
        'installCfnHup',
        'configureMonitoring',
        'configureOncall',
        'cloudWatchAgent',
      ],
    },
    configs: {
      installCfnHup: installCfnHupConfig(instance, 'Init'),
      configureMonitoring: new EC2.InitConfig([
        EC2.InitFile.fromAsset(
          '/data/config/prometheus/prometheus.yml',
          'config/monitoring/prometheus.yml',
          { serviceRestartHandles: [prometheusServiceHandle] },
        ),
        EC2.InitFile.fromAsset(
          '/data/config/prometheus/rules.yml',
          'config/monitoring/rules.yml',
          { serviceRestartHandles: [prometheusServiceHandle] },
        ),
        EC2.InitFile.fromString(
          '/lib/systemd/system/prometheus.service',
          [
            '[Unit]\n',
            'Description=Prometheus\n',
            'Requires=docker.service\n\n',
            'After=docker.service\n',
            '[Service]\n',
            'Restart=always\n',
            'ExecStart=/usr/bin/docker run --rm=true --name=mon_prometheus --net=host --volume=/data/config/prometheus:/etc/prometheus --volume=mon_prometheus_data:/prometheus prom/prometheus:v2.51.2 --storage.tsdb.retention.time=35d --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --web.console.libraries=/usr/share/prometheus/console_libraries --web.console.templates=/usr/share/prometheus/consoles\n',
            'ExecStop=/usr/bin/docker stop -t 2 mon_prometheus\n\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('prometheus', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: prometheusServiceHandle,
        }),

        EC2.InitFile.fromString(
          '/lib/systemd/system/pyroscope.service',
          [
            '[Unit]\n',
            'Description=Pyroscope\n',
            'Requires=docker.service\n\n',
            'After=docker.service\n',
            '[Service]\n',
            'Restart=always\n',
            'ExecStart=/usr/bin/docker run --rm=true --name=mon_pyroscope --net=host --volume=mon_pyroscope_data:/data grafana/pyroscope:1.5.0 -storage.backend=filesystem -storage.filesystem.dir=/data/shared -compactor.blocks-retention-period=48h -self-profiling.disable-push=true -usage-stats.enabled=false -pyroscopedb.retention-policy-min-free-disk-gb=0 -pyroscopedb.retention-policy-min-disk-available-percentage=0\n',
            'ExecStop=/usr/bin/docker stop -t 2 mon_pyroscope\n\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('pyroscope', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: pyroscopeServiceHandle,
        }),

        EC2.InitFile.fromAsset(
          '/data/config/grafana/grafana.ini',
          'config/monitoring/grafana.ini',
          { serviceRestartHandles: [grafanaServiceHandle] },
        ),
        EC2.InitFile.fromString(
          '/lib/systemd/system/grafana.service',
          [
            '[Unit]\n',
            'Description=Grafana\n',
            'Requires=docker.service\n\n',
            'After=docker.service\n',
            '[Service]\n',
            'Restart=always\n',
            'ExecStart=/usr/bin/docker run --rm=true --name=mon_grafana --net=host --volume=/data/config/grafana:/etc/grafana --volume=mon_grafana_data:/var/lib/grafana grafana/grafana:10.4.2\n',
            'ExecStop=/usr/bin/docker stop -t 2 mon_grafana\n\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('grafana', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: grafanaServiceHandle,
        }),
      ]),
      configureOncall: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/lib/systemd/system/mysql.service',
          [
            '[Unit]\n',
            'Description=MySQL\n',
            'Requires=docker.service\n\n',
            'After=docker.service\n',
            '[Service]\n',
            'Restart=always\n',
            'ExecStart=/usr/bin/docker run --rm=true --name=mysql --net=host --pull=always --volume=mysql_data:/var/lib/mysql --env MYSQL_ROOT_PASSWORD=quVCYmirvoC0xn1v44GG mysql:5.7\n',
            'ExecStop=/usr/bin/docker stop -t 2 mysql\n\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('mysql', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: mysqlServiceHandle,
        }),
        EC2.InitFile.fromAsset(
          '/data/config/oncall/oncall.yaml',
          'config/monitoring/oncall.yaml',
          { serviceRestartHandles: [oncallServiceHandle] },
        ),
        EC2.InitFile.fromString(
          '/lib/systemd/system/oncall.service',
          [
            '[Unit]\n',
            'Description=Oncall\n',
            'Requires=mysql.service\n\n',
            'After=mysql.service\n',
            '[Service]\n',
            'Restart=always\n',
            `ExecStart=/usr/bin/docker run --rm=true --name=oncall --net=host --pull=always --volume=/data/config/oncall/oncall.yaml:/home/oncall/config/config.yaml ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/oncall:latest\n`,
            'ExecStop=/usr/bin/docker stop -t 2 oncall\n\n',
            '[Install]\n',
            'WantedBy=multi-user.target',
          ].join(''),
        ),
        EC2.InitService.enable('oncall', {
          enabled: true,
          ensureRunning: true,
          serviceRestartHandle: oncallServiceHandle,
        }),
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

  instance.addToRolePolicy(
    new IAM.PolicyStatement({
      actions: ['ec2:DescribeInstances'],
      resources: ['*'],
    }),
  );

  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
  });
  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });

  return instance;
});

// Volume for storing the monitoring data.
// As of Jan 2022, we had about 20GiB of data
// In Feb of 2024, we had about 30Gib so bumping again to 80GiB.
const dataVolume = define(
  () =>
    new EC2.Volume(radicalStack(), 'monitoring-dataVolume', {
      availabilityZone,
      size: cdk.Size.gibibytes(80),
      volumeName: 'monitoringData',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    }),
);
Tags.of(dataVolume()).add('monitoring-backup', 'true');

define(() =>
  new DLM.CfnLifecyclePolicy(radicalStack(), 'monitoring-dataVolume-backup', {
    description: 'Weekly snapshots of monitoring data volume',
    executionRoleArn: `arn:aws:iam::${AWS_ACCOUNT}:role/AWSDataLifecycleManagerDefaultRole`,
    state: 'ENABLED',
    policyDetails: {
      policyType: 'EBS_SNAPSHOT_MANAGEMENT',
      resourceTypes: ['VOLUME'],
      targetTags: [{ key: 'monitoring-backup', value: 'true' }],
      schedules: [
        {
          name: 'snapshot',
          tagsToAdd: [{ key: 'createdBy', value: 'dlm' }],
          createRule: {
            // Every Wednesday at 10:15, so that it happens while we're likely
            // to be working
            cronExpression: 'cron(15 10 ? * WED *)',
          },
          retainRule: {
            interval: 3,
            intervalUnit: 'MONTHS',
          },
        },
      ],
    },
  }));

// Allow the monitoring EC2 instance to attach the data volume
define(() => {
  const policy = new IAM.Policy(
    radicalStack(),
    'monitoring-dataAttachmentPolicy',
  );

  const statement = new IAM.PolicyStatement();
  statement.addActions('ec2:AttachVolume', 'ec2:DetachVolume');
  statement.addResources(
    cdk.Arn.format(
      {
        resource: 'volume',
        service: 'ec2',
        resourceName: dataVolume().volumeId,
      },
      radicalStack(),
    ),
    cdk.Arn.format(
      {
        resource: 'instance',
        service: 'ec2',
        resourceName: monitoringInstance().instanceId,
      },
      radicalStack(),
    ),
  );

  policy.addStatements(statement);
  policy.attachToRole(monitoringInstance().role);
});

// Alarm on low disk space
define(() => {
  const metric = new CloudWatch.Metric({
    namespace: 'CWAgent',
    metricName: 'disk_used_percent',
    dimensionsMap: {
      InstanceId: monitoringInstance().instanceId,
      path: '/data',
      fstype: 'ext4',
    },
    statistic: 'Maximum',
  });

  const serverErrorsAlarm = new CloudWatch.Alarm(
    monitoringInstance(),
    'alarm-disk-usage-data',
    {
      alarmName: 'monitoring data',
      alarmDescription: 'Capacity used above 75%',
      metric: metric.with({ period: Duration.minutes(1) }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 75,
      actionsEnabled: true,
    },
  );
  serverErrorsAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic['prod']()),
  );
});
