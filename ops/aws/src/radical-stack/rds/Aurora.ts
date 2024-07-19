import {
  aws_rds as RDS,
  aws_ec2 as EC2,
  aws_secretsmanager as SecretsManager,
  aws_kms as KMS,
  aws_cloudwatch as CloudWatch,
  aws_cloudwatch_actions as CWActions,
  Duration,
  RemovalPolicy,
  NestedStack,
} from 'aws-cdk-lib';

import { define, tiers } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import {
  monitoringSecurityGroup,
  securityGroups,
} from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { addAliasToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { privateSubnets } from 'ops/aws/src/radical-stack/ec2/privateSubnets.ts';
import { POSTGRESQL_PORT } from 'ops/aws/src/Constants.ts';
import { sshTunnelHostSecurityGroup } from 'ops/aws/src/radical-stack/ec2/sshTunnelHost.ts';
import { zeroSecurityGroup } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { opsNotificationTopic } from 'ops/aws/src/radical-stack/sns/topics.ts';
import { build3SecurityGroup } from 'ops/aws/src/radical-stack/ec2/build3.ts';
import { LOADTEST_TIER_ENABLED } from 'ops/aws/src/Config.ts';

const stack = define(() => new NestedStack(radicalStack(), 'stack-rds'));

type AuroraTier = 'prod' | 'loadtest';
const defineForEachAuroraTier = <T>(func: (tier: AuroraTier) => T) => ({
  prod: define(() => func('prod')),
  loadtest: define(() => func('loadtest')),
});

const databaseSecretNames = {
  prod: 'database-prod-1',
  loadtest: 'database-loadtest-1',
};

const auroraEngine = RDS.DatabaseClusterEngine.auroraPostgres({
  version: RDS.AuroraPostgresEngineVersion.VER_15_2,
});

const makeAuroraSecurityGroup = (tier: AuroraTier) => {
  const key = `database-${tier}`;
  const isProduction = tier === 'prod';

  const securityGroup = new EC2.SecurityGroup(stack(), `sg-${key}`, {
    vpc: defaultVpc(),
    allowAllOutbound: false,
    description: 'Security Group for Aurora',
    securityGroupName: key,
  });

  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  for (const tier of tiers) {
    securityGroup.addIngressRule(
      securityGroups[tier](),
      EC2.Port.tcp(POSTGRESQL_PORT),
    );
  }

  if (isProduction) {
    // Allow third-party tools access to prod db via ssh-tunnel.cord.com
    securityGroup.addIngressRule(
      sshTunnelHostSecurityGroup(),
      EC2.Port.tcp(POSTGRESQL_PORT),
    );
  }
  securityGroup.addIngressRule(
    build3SecurityGroup(),
    EC2.Port.tcp(POSTGRESQL_PORT),
  );
  securityGroup.addIngressRule(
    zeroSecurityGroup(),
    EC2.Port.tcp(POSTGRESQL_PORT),
  );

  // allow Grafana instance to access the DB
  securityGroup.addIngressRule(
    monitoringSecurityGroup(),
    EC2.Port.tcp(POSTGRESQL_PORT),
  );

  return securityGroup;
};

export const auroraSecurityGroups = defineForEachAuroraTier(
  makeAuroraSecurityGroup,
);

function makeAuroraCluster(tier: AuroraTier) {
  if (tier === 'loadtest' && !LOADTEST_TIER_ENABLED) {
    return null;
  }

  const key = `database-${tier}`;
  const isProduction = tier === 'prod';

  const kmsKey = new KMS.Key(stack(), `kms-key-${tier}`, {
    description: `Encryption key for Aurora cluster '${key}'`,
    alias: key,
    keySpec: KMS.KeySpec.SYMMETRIC_DEFAULT,
    keyUsage: KMS.KeyUsage.ENCRYPT_DECRYPT,
    enableKeyRotation: true,
  });

  const cluster = new RDS.DatabaseCluster(stack(), `aurora-${tier}`, {
    backup: { retention: Duration.days(isProduction ? 21 : 7) },
    instanceProps: {
      instanceType: EC2.InstanceType.of(
        EC2.InstanceClass.R6G,
        isProduction ? EC2.InstanceSize.XLARGE4 : EC2.InstanceSize.XLARGE2,
      ),
      vpc: defaultVpc(),
      securityGroups: [auroraSecurityGroups[tier]()],
      vpcSubnets: { subnets: privateSubnets() },
      enablePerformanceInsights: true,
      performanceInsightRetention: RDS.PerformanceInsightRetention.DEFAULT,
    },
    port: POSTGRESQL_PORT,
    instances: 2,
    clusterIdentifier: key,
    instanceIdentifierBase: key,
    engine: auroraEngine,
    deletionProtection: isProduction,
    removalPolicy: isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.SNAPSHOT,
    credentials: RDS.Credentials.fromSecret(
      makeDatabaseSecret(databaseSecretNames[tier]),
    ),
    parameterGroup: parameterGroup(),
    monitoringInterval: Duration.seconds(60),
    cloudwatchLogsExports: ['postgresql'],
    storageEncrypted: true,
    storageEncryptionKey: kmsKey,
  });

  vanta(
    cluster,
    isProduction
      ? 'General production database'
      : `Non-production database for the ${tier} environment`,
    {
      // set Vanta tags for both database cluster and instances (but not other
      // resource types such as roles and subnet groups)
      includeResourceTypes: ['AWS::RDS::DBCluster', 'AWS::RDS::DBInstance'],

      nonProd: !isProduction,
      userDataStored: isProduction
        ? 'All user data - including messages/profiles/authentication tokens'
        : undefined,
    },
  );

  addAliasToInternalZone(key, cluster.clusterEndpoint.hostname);
  addAliasToInternalZone(`${key}-read`, cluster.clusterReadEndpoint.hostname);
  cluster.instanceEndpoints.forEach((endpoint, idx) =>
    addAliasToInternalZone(`${key}-${idx + 1}`, endpoint.hostname),
  );

  const oldKey = `aurora-${tier}`;
  addAliasToInternalZone(oldKey, cluster.clusterEndpoint.hostname);
  addAliasToInternalZone(
    `${oldKey}-read`,
    cluster.clusterReadEndpoint.hostname,
  );
  cluster.instanceEndpoints.forEach((endpoint, idx) =>
    addAliasToInternalZone(`${oldKey}-${idx + 1}`, endpoint.hostname),
  );

  return cluster;
}

export const auroraClusters = defineForEachAuroraTier(makeAuroraCluster);

const parameterGroup = define(
  () =>
    new RDS.ParameterGroup(stack(), 'auroraParameterGroup', {
      engine: auroraEngine,
      parameters: {
        max_connections: '5000',
        'rds.logical_replication': '1',
        wal_sender_timeout: '0',
        max_replication_slots: '5',
        // log all statements that take more than 100ms. If we ever want to log
        // all statements and their durations, we can set this parameter to 0.
        log_min_duration_statement: '100',
      },
    }),
);

const makeDatabaseSecret = (secretName: string, username = 'ChuckNorris') =>
  new SecretsManager.Secret(stack(), `databaseSecret-${secretName}`, {
    secretName,
    generateSecretString: {
      // We do not want to use punctuation characters, because they can be
      // inconvenient and have even caused us trouble. (Amazon DMS can't
      // handle a few of them.) A password of length 30, when using lower and
      // upper case characters and numbers, has over 178 bits of entropy,
      // which is crazy safe.
      excludeLowercase: false,
      excludeUppercase: false,
      excludeNumbers: false,
      excludePunctuation: true,
      includeSpace: false,
      generateStringKey: 'password',
      passwordLength: 30,
      secretStringTemplate: JSON.stringify({ username }),
    },
    removalPolicy: RemovalPolicy.DESTROY,
  });

defineForEachAuroraTier((tier) => {
  const cluster = auroraClusters[tier]();
  if (cluster === null) {
    return;
  }

  const serverErrorsAlarm = new CloudWatch.Alarm(
    cluster,
    'alarm-cpu-utilization',
    {
      alarmName: `${cluster.clusterIdentifier} CPU utilization`,
      alarmDescription: 'CPU utilization above 50%',
      metric: cluster
        .metricCPUUtilization()
        .with({ period: Duration.minutes(1) }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 50,
      actionsEnabled: true,
    },
  );
  serverErrorsAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic[tier]()),
  );

  const freeLocalStorageAlarm = new CloudWatch.Alarm(
    cluster,
    'free-local-storage',
    {
      alarmName: `${cluster.clusterIdentifier} free local storage`,
      alarmDescription: 'local free storage under 10GiB',
      metric: cluster
        .metricFreeLocalStorage()
        .with({ period: Duration.minutes(1) }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      threshold: 10 * 1024 ** 3,
      actionsEnabled: true,
    },
  );
  freeLocalStorageAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic[tier]()),
  );

  const freeableMemoryAlarm = new CloudWatch.Alarm(cluster, 'freeable-memory', {
    alarmName: `${cluster.clusterIdentifier} freeable memory`,
    alarmDescription: 'freeable memory under 10GiB',
    metric: cluster
      .metricFreeableMemory()
      .with({ period: Duration.minutes(1) }),
    evaluationPeriods: 2,
    comparisonOperator: CloudWatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    threshold: 10 * 1024 ** 3,
    actionsEnabled: true,
  });
  freeableMemoryAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic[tier]()),
  );

  const diskQueueDepthAlarm = new CloudWatch.Alarm(
    cluster,
    'disk-queue-depth',
    {
      alarmName: `${cluster.clusterIdentifier} disk queue depth`,
      alarmDescription: 'disk queue depth above 50',
      metric: cluster
        .metric('DiskQueueDepth', { statistic: 'Average' })
        .with({ period: Duration.minutes(5) }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 50,
      actionsEnabled: true,
    },
  );
  diskQueueDepthAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic[tier]()),
  );
});

define(() => {
  makeDatabaseSecret('database-prod-gcpanalytics', 'gcpanalytics');
});

/*
Commands for setting up logical replication into Google Bigquery. (Replace
***PASSWORD*** with the password from the 'database-prod-gcpanalytics' secret in
SecretsManager!)

CREATE USER gcpanalytics WITH ENCRYPTED PASSWORD '***PASSWORD***';

GRANT RDS_REPLICATION TO gcpanalytics;
GRANT SELECT ON ALL TABLES IN SCHEMA cord TO gcpanalytics;
GRANT USAGE ON SCHEMA cord TO gcpanalytics;
ALTER DEFAULT PRIVILEGES IN SCHEMA cord GRANT SELECT ON TABLES TO gcpanalytics;

CREATE PUBLICATION gcpanalytics FOR ALL TABLES;
SELECT PG_CREATE_LOGICAL_REPLICATION_SLOT('gcpanalytics', 'pgoutput');
*/
