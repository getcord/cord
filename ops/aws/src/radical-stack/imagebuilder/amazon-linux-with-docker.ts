import {
  aws_ec2 as EC2,
  aws_imagebuilder as ImageBuilder,
  CfnDeletionPolicy,
} from 'aws-cdk-lib';
import * as yaml from 'js-yaml';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import {
  imageBuilderInstanceProfile,
  imagebuilderLogBucket,
} from 'ops/aws/src/radical-stack/imagebuilder/imagebuilder.ts';
import { DOCKER_PORT } from 'ops/aws/src/Constants.ts';
import * as Config from 'ops/aws/src/radical-stack/Config.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';

const infrastructureConfiguration = define(() => {
  const conf = new ImageBuilder.CfnInfrastructureConfiguration(
    radicalStack(),
    'amazon-linux-with-docker-infraconf',
    {
      name: 'amazon-linux-with-docker',
      instanceProfileName: imageBuilderInstanceProfile().ref,
      logging: {
        s3Logs: {
          s3BucketName: imagebuilderLogBucket().bucketName,
          s3KeyPrefix: 'amazon-linux-with-docker',
        },
      },
      instanceTypes: ['t2.xlarge'],
      terminateInstanceOnFailure: true,
    },
  );
  conf.cfnOptions.deletionPolicy = CfnDeletionPolicy.DELETE;
  conf.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.DELETE;

  return conf;
});

const customComponent = define(() => {
  const comp = new ImageBuilder.CfnComponent(
    radicalStack(),
    'amazon-linux-with-docker-component',
    {
      name: 'amazon-linux-with-docker-component',
      version: '0.0.13',
      platform: 'Linux',
      data: yaml.dump(componentData),
    },
  );
  return comp;
});

const recipe = define(() => {
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  const recipe = new ImageBuilder.CfnImageRecipe(
    radicalStack(),
    'amazon-linux-with-docker-recipe',
    {
      name: 'amazon-linux-with-docker',
      version: '1.0.22',
      parentImage:
        // You can find this ARN on
        // https://eu-west-2.console.aws.amazon.com/imagebuilder/home?region=eu-west-2#/images
        // Search for "Amazon Linux 2023 x86" and select "Amazon-managed", "Linux", "AMI"
        `arn:aws:imagebuilder:${Config.AWS_REGION}:aws:image/amazon-linux-2023-x86/2024.4.1`,
      components: [
        // You can find these ARNs on
        // https://eu-west-2.console.aws.amazon.com/imagebuilder/home?region=eu-west-2#/components
        // Select "Quick start (Amazon-managed)" and "Linux"
        {
          // Updates Linux with the latest security updates.
          componentArn: `arn:aws:imagebuilder:${Config.AWS_REGION}:aws:component/update-linux/x.x.x`,
        },
        {
          componentArn: `arn:aws:imagebuilder:${Config.AWS_REGION}:aws:component/aws-cli-version-2-linux/x.x.x`,
        },
        {
          componentArn: `arn:aws:imagebuilder:${Config.AWS_REGION}:aws:component/amazon-cloudwatch-agent-linux/1.0.1`,
        },
        { componentArn: customComponent().ref },
      ],
      workingDirectory: '/tmp',
    },
  );
  recipe.cfnOptions.deletionPolicy = CfnDeletionPolicy.DELETE;
  recipe.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.DELETE;

  return recipe;
});

export const amazonLinuxWithDockerImage = define(() => {
  const image = new ImageBuilder.CfnImage(
    radicalStack(),
    'amazon-linux-with-docker-image-v3',
    {
      infrastructureConfigurationArn: infrastructureConfiguration().ref,
      imageRecipeArn: recipe().ref,
    },
  );
  image.cfnOptions.deletionPolicy = CfnDeletionPolicy.DELETE;
  image.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.DELETE;

  return image;
});

// We don't seem to need an ImagePipeline at all. If we need one in the future,
// this is how it can be declared:
//
// export const amazonLinuxWithDockerPipeline = define(() =>
//   new ImageBuilder.CfnImagePipeline(
//     radicalStack(),
//     'amazon-linux-with-docker-pipeline',
//     {
//       name: 'amazon-linux-with-docker',
//       infrastructureConfigurationArn: infrastructureConfiguration().ref,
//       imageRecipeArn: recipe().ref,
//     },
//   ));

const componentData = {
  name: 'amazon-linux-with-docker-component',
  description: 'Custom setup for our amazon-linux-with-docker image',
  schemaVersion: '1.0',
  phases: [
    {
      name: 'build',
      steps: [
        {
          name: 'InitialUpgrade',
          action: 'ExecuteBash',
          inputs: { commands: ['sudo yum upgrade --security -y'] },
        },
        {
          name: 'InstallDocker',
          action: 'ExecuteBash',
          inputs: {
            commands: [
              'sudo yum -y install docker',
              'sudo systemctl enable docker',
              'sudo usermod -aG docker ec2-user',
            ],
          },
        },
        {
          name: 'InstallPackages',
          action: 'ExecuteBash',
          inputs: {
            commands: [
              'sudo yum -y install htop amazon-ecr-credential-helper cronie',
              // Prevent cronie from being uninstalled, cf.
              // https://github.com/amazonlinux/amazon-linux-2023/issues/300#issuecomment-1531056938
              'sudo rm -f /tmp/imagebuilder_service/crontab_installed',
            ],
          },
        },
        {
          name: 'ConfigureDockerCredHelper',
          action: 'CreateFile',
          inputs: [
            {
              path: '/home/ec2-user/.docker/config.json',
              content: JSON.stringify({
                credHelpers: {
                  'public.ecr.aws': 'ecr-login',
                  [`${AWS_ACCOUNT}.dkr.ecr.${Config.AWS_REGION}.amazonaws.com`]:
                    'ecr-login',
                },
              }),
              permissions: '0644',
              overwrite: true,
            },
          ],
        },
        {
          name: 'ConfigureRootDockerCredHelper',
          action: 'CreateFile',
          inputs: [
            {
              path: '/root/.docker/config.json',
              content: JSON.stringify({
                credHelpers: {
                  'public.ecr.aws': 'ecr-login',
                  [`${AWS_ACCOUNT}.dkr.ecr.${Config.AWS_REGION}.amazonaws.com`]:
                    'ecr-login',
                },
              }),
              permissions: '0644',
              overwrite: true,
            },
          ],
        },
        {
          name: 'DockerTCPListen',
          action: 'ExecuteBash',
          inputs: {
            commands: [
              `sudo sed --in-place 's|^OPTIONS="|OPTIONS="-H tcp://[::]:${DOCKER_PORT} |' /etc/sysconfig/docker`,
              'sudo systemctl restart docker',
            ],
          },
        },
        {
          name: 'DockerConfigFile',
          action: 'CreateFile',
          inputs: [
            {
              path: '/etc/docker/daemon.json',
              content: JSON.stringify(
                {
                  'log-opts': { 'max-size': '1000m', 'max-file': '15' },
                },
                null,
                2,
              ),
              permissions: '0644',
              overwrite: true,
            },
          ],
        },
        {
          name: 'SecurityUpdatesCronJob',
          action: 'CreateFile',
          inputs: [
            {
              path: '/etc/cron.hourly/yum-upgrade-security',
              content:
                '#!/bin/sh\n\n' +
                'yum upgrade --releasever=latest --security -y\n',
              permissions: '0755',
              overwrite: true,
            },
          ],
        },
        {
          name: 'YumUpgradeOnBootService',
          action: 'CreateFile',
          inputs: [
            {
              path: '/etc/systemd/system/yum-upgrade.service',
              content: `
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/yum upgrade --releasever=latest --security -y

[Unit]
After=network-online.target
Wants=network-online.target

[Install]
WantedBy=multi-user.target
`,
              permissions: '0644',
              overwrite: true,
            },
          ],
        },
        {
          name: 'EnableYumUpgradeOnBoot',
          action: 'ExecuteBash',
          inputs: {
            commands: ['systemctl enable yum-upgrade.service'],
          },
        },
      ],
    },
  ],
};

export const amazonLinuxWithDockerMachineImage = define(() =>
  EC2.MachineImage.genericLinux({
    [Config.AWS_REGION]: amazonLinuxWithDockerImage().attrImageId,
  }),
);
