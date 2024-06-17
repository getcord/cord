import type {
  aws_autoscaling as autoScaling,
  aws_secretsmanager as SecretsManager,
} from 'aws-cdk-lib';
import { aws_ec2 as EC2 } from 'aws-cdk-lib';
import { getAsgResource } from 'ops/aws/src/radical-stack/ec2/autoScalingGroup.ts';

export const installCfnHupConfig = (
  instance: EC2.Instance | autoScaling.AutoScalingGroup,
  ...configNames: string[]
) => installCfnHupConfigImpl(instance, false, ...configNames);

export const installCfnHupConfigOnUbuntu = (
  instance: EC2.Instance | autoScaling.AutoScalingGroup,
  ...configNames: string[]
) => installCfnHupConfigImpl(instance, true, ...configNames);

function installCfnHupConfigImpl(
  instance: EC2.Instance | autoScaling.AutoScalingGroup,
  isUbuntu: boolean,
  ...configNames: string[]
) {
  const { stack } = instance;
  const logicalId =
    'instance' in instance
      ? instance.instance.logicalId
      : getAsgResource(instance).logicalId;
  const cfnHupServiceHandle = new EC2.InitServiceRestartHandle();

  return new EC2.InitConfig([
    EC2.InitFile.fromString(
      '/etc/cfn/cfn-hup.conf',
      [
        '[main]',
        `stack=${stack.stackId}`,
        `region=${stack.region}`,
        `interval=5`,
      ].join('\n') + '\n',
      { serviceRestartHandles: [cfnHupServiceHandle] },
    ),
    EC2.InitFile.fromString(
      '/etc/cfn/hooks.d/cfn-auto-reloader.conf',
      [
        '[cfn-auto-reloader-hook]',
        'triggers=post.update',
        `path=Resources.${logicalId}.Metadata.AWS::CloudFormation::Init`,
        `action=/opt/aws/bin/cfn-init -v -c ${configNames.join(',')} --region ${
          stack.region
        } --stack ${stack.stackName} --resource ${logicalId}`,
        'runas=root',
      ].join('\n') + '\n',
      { serviceRestartHandles: [cfnHupServiceHandle] },
    ),
    ...(isUbuntu
      ? [
          EC2.InitFile.fromString(
            '/lib/systemd/system/cfn-hup.service',
            [
              '[Unit]\n',
              'Description=cfn-hup daemon\n\n',
              '[Service]\n',
              'Type=simple\n',
              'ExecStart=/opt/aws/bin/cfn-hup\n',
              'Restart=always\n\n',
              '[Install]\n',
              'WantedBy=multi-user.target',
            ].join(''),
          ),
          EC2.InitCommand.argvCommand(['systemctl', 'enable', 'cfn-hup']),
          EC2.InitCommand.argvCommand(['systemctl', 'restart', 'cfn-hup']),
        ]
      : [
          EC2.InitService.enable('cfn-hup', {
            enabled: true,
            ensureRunning: true,
            serviceRestartHandle: cfnHupServiceHandle,
          }),
        ]),
  ]);
}

export function configureSSH(additionalSshPort: number) {
  return new EC2.InitConfig([
    EC2.InitCommand.shellCommand(
      `grep -q '^Port 22$' /etc/ssh/sshd_config || echo 'Port 22' >>/etc/ssh/sshd_config`,
    ),
    EC2.InitCommand.shellCommand(
      `grep -q '^Port ${additionalSshPort}$' /etc/ssh/sshd_config || echo 'Port ${additionalSshPort}' >>/etc/ssh/sshd_config`,
    ),
    EC2.InitCommand.shellCommand('systemctl reload sshd'),
  ]);
}

export function installSSHHostKeys(secret: SecretsManager.Secret) {
  return new EC2.InitConfig([
    EC2.InitFile.fromAsset(
      '/usr/local/sbin/cord-install-ssh-hostkeys',
      'scripts/install-ssh-hostkeys.py',
      { mode: '000755' },
    ),
    EC2.InitCommand.shellCommand(
      `/usr/local/sbin/cord-install-ssh-hostkeys --secret-id ${secret.secretName}`,
    ),
  ]);
}
