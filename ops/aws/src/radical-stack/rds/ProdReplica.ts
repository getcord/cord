import {
  aws_rds as RDS,
  aws_ec2 as EC2,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { addAliasToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { makeDatabaseSecret } from 'ops/aws/src/radical-stack/rds/makeDatabaseSecret.ts';
import { auroraSecurityGroups } from 'ops/aws/src/radical-stack/rds/Aurora.ts';
import { POSTGRESQL_PORT } from 'ops/aws/src/Constants.ts';
import { sshTunnelHostSecurityGroup } from 'ops/aws/src/radical-stack/ec2/sshTunnelHost.ts';
import { zeroSecurityGroup } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { build3SecurityGroup } from 'ops/aws/src/radical-stack/ec2/build3.ts';
import { monitoringSecurityGroup } from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';

const postgresEngine = RDS.DatabaseInstanceEngine.postgres({
  version: RDS.PostgresEngineVersion.VER_15,
});

export const prodReplica = define(() => {
  const instance = new RDS.DatabaseInstance(radicalStack(), 'ProdReplica', {
    allocatedStorage: 50,
    maxAllocatedStorage: 2000,
    storageType: RDS.StorageType.GP2,
    backupRetention: Duration.days(4),
    instanceType: EC2.InstanceType.of(
      EC2.InstanceClass.R6G,
      EC2.InstanceSize.LARGE,
    ),
    instanceIdentifier: 'prod-replica',
    engine: postgresEngine,
    subnetGroup: subnetGroup(),
    vpc: defaultVpc(),
    publiclyAccessible: true,
    securityGroups: [
      prodReplicaSecurityGroup(),
      prodReplicaExternalSecurityGroup(),
    ],
    deletionProtection: true,
    removalPolicy: RemovalPolicy.RETAIN,
    credentials: RDS.Credentials.fromSecret(
      makeDatabaseSecret('prod-replica-1'),
    ),
    allowMajorVersionUpgrade: true,
    monitoringInterval: Duration.seconds(60),
    cloudwatchLogsExports: ['postgresql', 'upgrade'],
  });
  vanta(
    instance,
    'Regularly updated snapshot of production database for analysis jobs and connecting to from third party analysis tools',
    {
      includeResourceTypes: ['AWS::RDS::DBInstance'],
      nonProd: true,
      userDataStored:
        'All user data - including messages/profiles/authentication tokens',
    },
  );

  addAliasToInternalZone('prod-replica', instance.dbInstanceEndpointAddress);

  makeDatabaseSecret('prod-replica-winnie', 'winnie');

  return instance;
});

export const prodReplicaSecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(radicalStack(), `sg-prod-replica`, {
    vpc: defaultVpc(),
    allowAllOutbound: true,
    description: 'Security Group for Prod Replica database',
    securityGroupName: 'prod-replica',
  });
  sg.addIngressRule(
    auroraSecurityGroups['prod'](),
    EC2.Port.tcp(POSTGRESQL_PORT),
  );
  sg.addIngressRule(sg, EC2.Port.tcp(POSTGRESQL_PORT));
  sg.addIngressRule(build3SecurityGroup(), EC2.Port.tcp(POSTGRESQL_PORT));
  sg.addIngressRule(zeroSecurityGroup(), EC2.Port.tcp(POSTGRESQL_PORT));
  auroraSecurityGroups['prod']().addIngressRule(
    sg,
    EC2.Port.tcp(POSTGRESQL_PORT),
  );
  // allow Grafana instance to access the DB
  sg.addIngressRule(monitoringSecurityGroup(), EC2.Port.tcp(POSTGRESQL_PORT));

  // Allow third-party tools access to prod db via ssh-tunnel.cord.com
  sg.addIngressRule(
    sshTunnelHostSecurityGroup(),
    EC2.Port.tcp(POSTGRESQL_PORT),
  );

  return sg;
});

// This security group was created and is maintained manually. This is where
// the ip addresses of third-party tools are added to allow them accessing the
// prod-replica db.
// https://eu-west-2.console.aws.amazon.com/vpc/home?region=eu-west-2#SecurityGroup:groupId=sg-045134e80da8c2ee5
export const prodReplicaExternalSecurityGroup = define(() =>
  EC2.SecurityGroup.fromSecurityGroupId(
    radicalStack(),
    'sg-prod-replica-external',
    'sg-045134e80da8c2ee5',
  ),
);

const subnetGroup = define(() =>
  RDS.SubnetGroup.fromSubnetGroupName(
    radicalStack(),
    'prod-replica-subnets',
    'default',
  ),
);

/* To set up this replica properly:
 * * create a database called `radical_db` as user ChuckNorris
 * * log in as ChuckNorris and execute the following statements:
 *   CREATE USER winnie WITH NOCREATEDB NOCREATEROLE NOINHERIT NOSUPERUSER
 *       NOREPLICATION LOGIN PASSWORD '<password taken from secret>';
 *   GRANT SELECT ON ALL TABLES IN SCHEMA cord TO winnie;
 *   CREATE SCHEMA stats;
 *   GRANT ALL PRIVILEGES ON SCHEMA stats TO winnie;
 */
