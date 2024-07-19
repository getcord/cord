import { aws_ec2 as EC2, aws_route53 as Route53 } from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { addToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { cordComZones } from 'ops/aws/src/radical-stack/route53/cord.com.ts';
import {
  configureSSH,
  installCfnHupConfig,
} from 'ops/aws/src/radical-stack/ec2/CloudFormationInit.ts';
import { zeroSecurityGroup } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import {
  enableEc2InstanceConnect,
  waitForInstanceInit,
} from 'ops/aws/src/radical-stack/ec2/common.ts';
import { PRIMARY_DOMAIN_NAME } from 'ops/aws/src/radical-stack/Config.ts';
import { ec2KeyPair } from 'ops/aws/src/radical-stack/ec2/keyPair.ts';

const ENABLE_SSH_TUNNEL_HOST = true;

// SSH normally listens on port 22. Because of that, there are lots of random
// connection attempts made on port 22 on probably all machines on the internet.
// Bad players might scan the whole range of AWS data center ip addresses to
// connect to hosts with weak passwords. You can avoid that noise by just
// picking a different, random port number for SSH. This ssh tunnel host listens
// on the following port:
const EXPOSE_SSH_PORT = 44732;

// List all the peers (their ip addresses) that should be allowed to connect to
// this ssh tunnel host.
const allowConnectionFrom: EC2.IPeer[] = [
  // Google Cloud IP addresses (for gcp-analytics)
  EC2.Peer.ipv4('35.189.120.213/32'),
  EC2.Peer.ipv4('34.89.121.226/32'),
  EC2.Peer.ipv4('34.105.244.177/32'),
  EC2.Peer.ipv4('35.197.249.117/32'),
  EC2.Peer.ipv4('35.242.151.51/32'),
];

// For each tunnel user, define one entry here. Add their public SSH key(s) and
// the endpoints they should be allowed to forward to.
const users: Record<string, SshTunnelUser> = {
  'gcp-analytics': {
    keys: [
      'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDrsAxaC+3nKUoTHWSmZH2kxw21J8mUqcrpckxwyonqiYjapyrJ2hev2vn++Fk1lNhy3LaTxyV4USk3ligYYTRw=',
    ],
    forwardTo: [`database-prod.int.${PRIMARY_DOMAIN_NAME}:5432`],
  },
};

interface SshTunnelUser {
  keys: string[];
  forwardTo: string[];
}

export const sshTunnelHostInstance = define(() => {
  if (!ENABLE_SSH_TUNNEL_HOST) {
    return null;
  }

  const userData = EC2.UserData.forLinux();
  userData.addCommands('yum install -y aws-cfn-bootstrap');

  // Install hourly cronjob to apply security updates from the Amazon Linux rpm
  // repository
  userData.addCommands(
    '>/etc/cron.hourly/yum-upgrade-security ' +
      "echo -e '#!/bin/sh\n\nyum upgrade --security -y\npackage-cleanup -y --oldkernels --count=1' && " +
      'chmod a+x /etc/cron.hourly/yum-upgrade-security',
  );

  const instance: EC2.Instance = new EC2.Instance(
    radicalStack(),
    'sshTunnelHost-instance',
    {
      instanceType: EC2.InstanceType.of(
        EC2.InstanceClass.T4G,
        EC2.InstanceSize.MICRO,
      ),
      vpc: defaultVpc(),
      machineImage: EC2.MachineImage.latestAmazonLinux({
        generation: EC2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: EC2.AmazonLinuxCpuType.ARM_64,
        virtualization: EC2.AmazonLinuxVirt.HVM,
        storage: EC2.AmazonLinuxStorage.GENERAL_PURPOSE,
      }),
      securityGroup: sshTunnelHostSecurityGroup(),
      vpcSubnets: {
        subnetType: EC2.SubnetType.PUBLIC,
      },
      keyName: ec2KeyPair().keyName,
      userData,
      userDataCausesReplacement: true,
      requireImdsv2: true,
    },
  );
  vanta(
    instance,
    'SSH host allowing 3rd party tools that we are using to create an SSH tunnel to database servers',
    { nonProd: true },
  );
  waitForInstanceInit(instance);
  enableEc2InstanceConnect(instance);

  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });

  const createUsers = new EC2.InitConfig(
    Object.keys(users).map((user) => EC2.InitUser.fromName(user)),
  );
  const installKeys = new EC2.InitConfig(
    Object.entries(users).map(([name, info]) =>
      EC2.InitFile.fromString(
        `/home/${name}/.ssh/authorized_keys`,
        info.forwardTo.length
          ? info.keys
              .map(
                (key) =>
                  `restrict,command="/bin/false",port-forwarding${info.forwardTo
                    .map((x) => `,permitopen="${x}"`)
                    .join('')} ${key}`,
              )
              .join('\n') + '\n'
          : '\n',
        {
          mode: '000644',
          owner: name,
        },
      ),
    ),
  );

  EC2.CloudFormationInit.fromConfigSets({
    configSets: {
      Init: ['installCfnHup', 'configureSSH', 'createUsers', 'installKeys'],
    },
    configs: {
      installCfnHup: installCfnHupConfig(instance, 'Init'),
      createUsers,
      installKeys,
      configureSSH: configureSSH(EXPOSE_SSH_PORT),
    },
  }).attach(instance.instance, {
    instanceRole: instance.role,
    userData,
    platform: instance.osType,
    embedFingerprint: false,
    configSets: ['Init'],
  });

  addToInternalZone('ssh-tunnel', instance.instancePrivateIp);

  const cordComZone = cordComZones().get(PRIMARY_DOMAIN_NAME);
  if (cordComZone) {
    new Route53.ARecord(cordComZone, 'ssh-tunnel', {
      zone: cordComZone,
      recordName: 'ssh-tunnel',
      target: Route53.RecordTarget.fromIpAddresses(instance.instancePublicIp),
    });
  }

  return instance;
});

export const sshTunnelHostSecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(
    radicalStack(),
    'sshTunnelHostSecurityGroup',
    {
      vpc: defaultVpc(),
      securityGroupName: 'sshTunnelHostSecurityGroup',
    },
  );
  allowConnectionFrom.forEach((peer) =>
    sg.addIngressRule(peer, EC2.Port.tcp(EXPOSE_SSH_PORT)),
  );

  sg.addIngressRule(zeroSecurityGroup(), EC2.Port.tcp(22));

  return sg;
});
