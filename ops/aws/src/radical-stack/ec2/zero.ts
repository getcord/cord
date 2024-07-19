import { createHash } from 'crypto';
import { readFileSync } from 'fs';

import {
  aws_ec2 as EC2,
  aws_ssm as SSM,
  aws_efs as EFS,
  aws_route53 as Route53,
  aws_secretsmanager as SecretsManager,
  Duration,
  AssetHashType,
  RemovalPolicy,
  CfnDeletionPolicy,
} from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { addToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import {
  AWS_REGION,
  PRIMARY_DOMAIN_NAME,
} from 'ops/aws/src/radical-stack/Config.ts';
import { cordComZones } from 'ops/aws/src/radical-stack/route53/cord.com.ts';
import {
  configureSSH,
  installCfnHupConfigOnUbuntu,
  installSSHHostKeys,
} from 'ops/aws/src/radical-stack/ec2/CloudFormationInit.ts';
import { legacyPrivateSubnets } from 'ops/aws/src/radical-stack/ec2/privateSubnets.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import {
  enableEc2InstanceConnect,
  waitForInstanceInit,
} from 'ops/aws/src/radical-stack/ec2/common.ts';
import { ec2KeyPair } from 'ops/aws/src/radical-stack/ec2/keyPair.ts';

// SSH normally listens on port 22. Because of that, there are lots of random
// connection attempts made on port 22 on probably all machines on the internet.
// Bad players might scan the whole range of AWS data center ip addresses to
// connect to hosts with weak passwords. You can avoid that noise by just
// picking a different, random port number for SSH. This ssh tunnel host listens
// on the following port:
const EXPOSE_SSH_PORT = 28547; // Prime time!
const hostname = 'zero';
// Normally zero gets a new host key every time it gets replaced, which means
// ssh will complain that the identity has changed.  If you change this to true,
// it will attempt to extract keys from a secret and install those so the
// identity doesn't change.
const STABLE_HOST_KEYS = false;

const availabilityZone = `${AWS_REGION}a`;
const packages: string[] = [
  'build-essential',
  'cmake',
  'docker.io',
  'emacs',
  'htop',
  'jq',
  'k6',
  'nodejs',
  'postgresql-client-12',
  'python3-boto3',
  'python3-pip',
  'redis-tools',
  'tmux',
];

const machineImage = EC2.MachineImage.genericLinux({
  [AWS_REGION]: SSM.StringParameter.valueForStringParameter(
    radicalStack(),
    '/aws/service/canonical/ubuntu/server/20.04/stable/20210825/amd64/hvm/ebs-gp2/ami-id',
  ),
});

const zeroHomeFileSystem = define(() => {
  return new EFS.FileSystem(radicalStack(), 'zeroHome-efs', {
    fileSystemName: 'zeroHome',
    encrypted: true,
    securityGroup: mountTargetSecurityGroup(),
    vpcSubnets: { subnets: legacyPrivateSubnets() },
    vpc: defaultVpc(),
  });
});

export const zeroInstance = define(() => {
  const userData = EC2.UserData.forLinux();
  userData.addCommands(
    // Set host name
    `echo "${hostname}" >/etc/hostname`,
    `hostname "${hostname}"`,

    // Move the home directory of the ubuntu user out of /home, because we are
    // going to mount an EFS filesystem to /home for the user hoe directories
    `mkdir -p /var/home`,
    `usermod --move-home --home /var/home/ubuntu ubuntu`,

    // Install early dependencies:
    // * awscli: AWS command line client
    // * python3, python3-pip: needed for installing aws-cfn below
    //   (CloudFormationInit support)
    // * git, binutils: needed for building/installing amazon-efs-utils
    'apt-get update -y',
    'apt-get install --no-install-recommends -y python3 python3-pip awscli git binutils',

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

    // Build/install amazon-efs-utils. Amazon doesn't seem to distribute Ubuntu
    // packages of this. According to Amazon's docs we have to build and install
    // it like this:
    // (https://docs.aws.amazon.com/efs/latest/ug/installing-amazon-efs-utils.html#installing-other-distro)
    `(
      cd "$(mktemp -d)"
      chmod 1777 .
      sudo -u ubuntu sh -c "git clone https://github.com/aws/efs-utils && cd efs-utils && ./build-deb.sh"
      apt install --no-install-recommends -y ./efs-utils/build/amazon-efs-utils*deb
     )`,

    // Mount home directory
    `echo '${
      zeroHomeFileSystem().fileSystemId
    } /home efs _netdev,noresvport,tls,iam 0 0' >>/etc/fstab`,
    'mount /home || true',
  );

  const instance = new EC2.Instance(
    radicalStack(),

    // Logical name. Change this (increment version number) to force replacement
    // of this instance with a new one.
    'zero-instance-v2',

    {
      instanceType: EC2.InstanceType.of(
        EC2.InstanceClass.T3,
        EC2.InstanceSize.XLARGE,
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
      securityGroup: zeroSecurityGroup(),
      vpcSubnets: {
        subnetType: EC2.SubnetType.PUBLIC,
      },
      keyName: ec2KeyPair().keyName,
      userData,
      userDataCausesReplacement: false,
      requireImdsv2: true,
    },
  );
  vanta(
    instance,
    'SSH bastion host for employees allowing connecting to instances/services in our private AWS network.',
    { nonProd: true },
  );

  let sshHostKeysSecret: SecretsManager.Secret | undefined;
  if (STABLE_HOST_KEYS) {
    sshHostKeysSecret = new SecretsManager.Secret(
      radicalStack(),
      'zero-ssh-host-keys-secret',
      {
        description: 'SSH Host keys for zero',
        secretName: 'zero-ssh-host-keys',
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );
    sshHostKeysSecret.grantRead(instance);
  }

  EC2.CloudFormationInit.fromConfigSets({
    configSets: {
      Init: [
        'installCfnHup',
        'configureSSH',
        ...(STABLE_HOST_KEYS ? ['installSSHHostKeys'] : []),
        'configureApt',
        'installPackages',
        'installEc2InstanceConnect',
        'installSyncUsers',
        'addScripts',
      ],
    },
    configs: {
      installCfnHup: installCfnHupConfigOnUbuntu(instance, 'Init'),
      configureSSH: configureSSH(EXPOSE_SSH_PORT),
      ...(STABLE_HOST_KEYS && sshHostKeysSecret
        ? { installSSHHostKeys: installSSHHostKeys(sshHostKeysSecret) }
        : {}),
      configureApt: new EC2.InitConfig([
        EC2.InitFile.fromString(
          '/etc/apt/apt.conf.d/90norecommends',
          [
            'APT::Install-Recommends "false";\n',
            'APT::AutoRemove::SuggestsImportant "false";\n',
            'APT::AutoRemove::RecommendsImportant "false";\n',
          ].join(''),
        ),

        // Add K6 repository and key
        EC2.InitFile.fromString(
          '/etc/apt/sources.list.d/k6.list',
          'deb https://dl.k6.io/deb stable main\n',
        ),
        EC2.InitCommand.argvCommand([
          'apt-key',
          'adv',
          '--keyserver',
          'hkp://keyserver.ubuntu.com:80',
          '--recv-keys',
          'C5AD17C747E3415A3642D57D77C6C491D6AC1D69',
        ]),

        // Re-run apt-get update after updating configuration
        EC2.InitCommand.argvCommand(['apt-get', 'update', '-y']),
      ]),
      installPackages: new EC2.InitConfig(
        packages.map((pkg) => EC2.InitPackage.apt(pkg)),
      ),
      installEc2InstanceConnect: new EC2.InitConfig([
        // Old versions of pyOpenSSL aren't compatible with newer versions of
        // `cryptography` which are installed by `ec2instanceconnectcli`, so
        // ensure a new pyOpenSSL is available before installing
        // ec2instanceconnectcli
        EC2.InitCommand.argvCommand([
          'pip3',
          'install',
          '--upgrade',
          'pyOpenSSL',
        ]),
        EC2.InitCommand.argvCommand([
          'pip3',
          'install',
          'ec2instanceconnectcli',
        ]),
      ]),
      installSyncUsers: new EC2.InitConfig([
        EC2.InitFile.fromAsset(
          '/usr/local/sbin/zero-sync-users',
          'dist/scripts/sync-users.cjs',
          {
            mode: '000755',

            // We provide a custom hash, which we calculate from the source TS
            // file rather than the bundle. That's because we don't want to
            // trigger updating this file just because the bundle looks
            // different. This way, only a change to the source TS file will
            // trigger an update.
            assetHashType: AssetHashType.CUSTOM,
            assetHash: createHash('sha256')
              .update(readFileSync('scripts/sync-users.ts'))
              .digest('hex'),
          },
        ),
        EC2.InitFile.fromString(
          '/etc/cron.d/zero-sync-users',
          '0-59/15 * * * * root /usr/local/sbin/zero-sync-users\n',
        ),
      ]),
      addScripts: new EC2.InitConfig([
        EC2.InitFile.fromAsset('/usr/local/bin/cssh', 'config/zero/cssh', {
          mode: '000755',
          owner: 'root',
          group: 'root',
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

  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/IAMReadOnlyAccess',
  });
  instance.role.addManagedPolicy({
    managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });

  waitForInstanceInit(instance);
  enableEc2InstanceConnect(instance);

  // Give zero a static IP address
  const elasticIP = new EC2.CfnEIP(radicalStack(), `EIP-zero`, {
    domain: 'vpc',
    instanceId: instance.instanceId,
  });
  elasticIP.cfnOptions.deletionPolicy = CfnDeletionPolicy.DELETE;

  addToInternalZone(hostname, instance.instancePrivateIp);
  const cordComZone = cordComZones().get(PRIMARY_DOMAIN_NAME);
  if (cordComZone) {
    new Route53.ARecord(cordComZone, hostname, {
      zone: cordComZone,
      recordName: hostname,
      target: Route53.RecordTarget.fromIpAddresses(elasticIP.ref),
      ttl: Duration.minutes(5),
    });
  }

  instance.node.addDependency(zeroHomeFileSystem().mountTargetsAvailable);

  return instance;
});

export const zeroSecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(radicalStack(), 'zero-securityGroup', {
    vpc: defaultVpc(),
    securityGroupName: 'zero',
  });
  sg.addIngressRule(EC2.Peer.anyIpv4(), EC2.Port.tcp(EXPOSE_SSH_PORT));

  return sg;
});

export const mountTargetSecurityGroup = define(() => {
  const sg = new EC2.SecurityGroup(radicalStack(), 'zero-home-mountTarget', {
    vpc: defaultVpc(),
    securityGroupName: 'zero-home-mountTarget',
  });
  sg.addIngressRule(zeroSecurityGroup(), EC2.Port.tcp(2049));

  return sg;
});
