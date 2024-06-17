#!/usr/bin/env -S node --enable-source-maps

import { inspect, promisify } from 'util';

import 'dotenv/config.js';
import * as fs from 'fs/promises';
import * as zlib from 'zlib';
import * as autoscaling from '@aws-sdk/client-auto-scaling';
import * as cloudfront from '@aws-sdk/client-cloudfront';
import * as ec2 from '@aws-sdk/client-ec2';
import * as ecr from '@aws-sdk/client-ecr';
import * as elbv2 from '@aws-sdk/client-elastic-load-balancing-v2';
import Docker from 'dockerode';
import { decode } from 'js-base64';
import type * as pg from 'pg';
import yargs from 'yargs';

import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';
import env from 'server/src/config/Env.ts';
import {
  runCommandLine,
  connectToDatabase,
  postMessageFactory,
  sleepSeconds,
} from 'scripts/ci/lib/helpers.ts';

function log(...stuff: any[]): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...stuff);
}

function logError(...stuff: any[]) {
  log('ERROR:', ...stuff);
}

// This script may return these exit codes:
// 0: success! Deployment complete.
// 1: error!
// 2: deployment skipped (`automaticDeploy` switched off and `--force` option
// wasn't given)

// No easy way to retrieve these AWS ids, so they are defined here as constants,
// as looked up on the AWS console.
const CONFIG = {
  prod: {
    targetGroups: {
      api: 'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/prodServerAPITargetGroup/372ac2f0bcb95756',
      console:
        'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/prodServerConsoleTargetGroup/4ba4279d4c45284b',
      docs: 'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/prodServerDocsTargetGroup/f993310fd5f1062e',
      admin:
        'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/prodServerAdminTargetGroup/7f29f18a9aa7f7f2',
    },
    cloudFrontDistributionID: 'E2P1Z0TBFUA575',
  },
  staging: {
    targetGroups: {
      api: 'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/stagingServerAPITargetGroup/8819231831fc0427',
      console:
        'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/stagingServerConsoleTargetGroup/0fab9fe8f850d0ac',
      docs: 'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/stagingServerDocsTargetGroup/562c2760e4255468',
      admin:
        'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/stagingServerAdminTargetGroup/dde44005f9f01b4c',
    },
    cloudFrontDistributionID: 'E2EZOYZW0TRYBC',
  },
  loadtest: {
    targetGroups: {
      api: 'arn:aws:elasticloadbalancing:eu-west-2:869934154475:targetgroup/loadtestServerAPITargetGroup/7c337619a9e59828',
    },
    cloudFrontDistributionID: 'E32RS03NTNGW0X',
  },
};

const argv = yargs(process.argv.slice(2))
  .option('pullImage', {
    type: 'string',
    description: 'Docker image to pull and deploy',
    default: '869934154475.dkr.ecr.eu-west-2.amazonaws.com/server:latest',
  })
  .option('pushOnSuccess', {
    type: 'string',
    description: 'Docker tag to push after successful deploy',
  })
  .option('force', {
    type: 'boolean',
    description: 'deploy even if "automaticDeploy" is off',
  })
  .option('unattended', {
    type: 'boolean',
    description:
      'flag that the script is executed unattendedly (by a build plan or cron job), results in posting extra messages to Slack',
  })
  .help()
  .alias('help', 'h').argv;

async function main(): Promise<number> {
  const { CORD_TIER: tier } = env;

  if (tier !== 'staging' && tier !== 'prod' && tier !== 'loadtest') {
    throw new Error('tier must be prod, staging, or loadtest');
  }

  // Connect to the database for a few bits and pieces
  const db = await connectToDatabase();

  // Get the contents of the heimdall table as one JavaScript object
  const opsConfig: Record<string, any> =
    (
      await db.query(
        `SELECT json_object_agg(key, value) AS config
         FROM cord.heimdall WHERE tier=$1;`,
        [tier],
      )
    )?.rows[0]?.config ?? {};

  // Get us a function to post error messages to the Slack ops channel
  const postErrorMessage = await postMessageFactory(
    env.CORD_OPS_SLACK_CHANNEL_ID,
  );

  const postInfoMessage = await postMessageFactory(
    env.PROD_CHANGES_SLACK_CHANNEL_ID,
  );

  try {
    const exitCode = await deployTier(
      tier,
      postErrorMessage,
      postInfoMessage,
      opsConfig,
      db,
    );
    return exitCode;
  } catch (err) {
    await postErrorMessage(`ERROR: push to ${tier} failed with an error
\`\`\`
${inspect(err, false, 10, false)}
\`\`\``);
    throw err;
  }
}

async function deployTier(
  tier: 'prod' | 'staging' | 'loadtest',
  postErrorMessage: (text: string) => Promise<void>,
  postInfoMessage: (text: string) => Promise<void>,
  opsConfig: Record<string, any>,
  db: pg.Client,
) {
  log(`Deploying to ${tier} tier`);
  log(`Arguments: ${JSON.stringify(argv, null, 2)}`);

  const asClient = new autoscaling.AutoScalingClient({ region: AWS_REGION });
  const ec2Client = new ec2.EC2Client({ region: AWS_REGION });
  const ecrClient = new ecr.ECRClient({ region: AWS_REGION });
  const elbv2Client = new elbv2.ElasticLoadBalancingV2Client({
    region: AWS_REGION,
  });
  // API client for local Docker (the one on the machine running this script)
  const localDocker = new Docker();

  // Get a login token we can use for docker pull/push operations
  const ecrAuth = await getEcrAuth(ecrClient);

  // Pull the image we want to deploy. In automatic deploys this should be a
  // no-op, because we would have built this image on the same machine as the
  // script is running on. However, when running manually, we might need to pull
  // first.
  await dockerPull(localDocker, argv.pullImage, ecrAuth);

  // Now that we have pulled the image, we *should* have a repo digest, i.e. an
  // identifier for this specific image that keeps referring to the image even
  // if the tag (e.g. "latest") is updated. If Docker doesn't give us a repo
  // digest here, we just continue with the image identifier that we got from
  // the command line.
  const imageInfo = await localDocker.getImage(argv.pullImage).inspect();
  const imageName = imageInfo.RepoDigests[0] ?? argv.pullImage;
  const imageLabels: Record<string, string | undefined> =
    imageInfo.Config.Labels;
  const gitCommitHash = imageLabels['com.cord.git-commit-hash'];
  const gitCommitTitle = imageLabels['com.cord.git-commit-title'];
  const packageVersion = imageLabels['com.cord.version'];
  log(
    `Using Docker image ${imageName} - git commit hash ${gitCommitHash} - package version ${packageVersion}`,
  );

  // We have obtained information on the image we are about to deploy, but stop
  // here if automatic deployments are switched off and this script wasn't
  // passed the `--force` option.
  if (!argv.force && !opsConfig.automaticDeploy) {
    log(
      "Automatic deploys are switched off. Use '--force' to deploy nonetheless.",
    );
    if (argv.unattended) {
      await postErrorMessage(`*NOT* redeploying ${tier} because automatic deployment is switched off
• Git commit: ${
        gitCommitHash
          ? `<https://github.com/getcord/monorepo/commit/${gitCommitHash}|${gitCommitHash.substr(
              0,
              10,
            )}>`
          : 'unknown'
      } ${gitCommitTitle || ''}
• Package version: ${packageVersion}
• Image: \`${imageName}\`
• Activate automatic deploys: https://${env.ADMIN_SERVER_HOST}/heimdall
• Manual deploy: \`scripts/manual-deploy.sh ${tier} '${imageName}'\``);
    }
    return 2;
  }

  // We are going ahead with the deploy. At this point we create a row in the
  // cord.deploys table.
  const {
    rows: [{ id: deployID }],
  } = await db.query<{ id: string }>(
    `INSERT INTO cord.deploys ("tier", "gitCommitHash", "dockerImage", "packageVersion")
     VALUES ($1,$2,$3,$4)
     RETURNING id;`,
    [tier, gitCommitHash ?? null, imageName, packageVersion ?? null],
  );
  log(`Added deploy '${deployID}' to cord.deploys table`);

  await (async () => {
    // Retrieve a list of EC2 instances in the autoscaling group. Those are the
    // ones we are going to deploy to.
    const instances = await getAutoscalingGroupInstances(
      `${tier}-server`,
      asClient,
      ec2Client,
    );

    log('EC2 instances:');
    for (const i of instances) {
      log(`  * ${i.InstanceId} (${i.PrivateDnsName})`);
    }

    // Pull the Docker container on all instances
    await Promise.all(
      instances.map(async (instance) => {
        log(`docker pull on ${instance.InstanceId}`);
        const remoteDocker = new Docker({
          host: instance.PrivateDnsName!,
          port: 2375,
          protocol: 'http',
        });
        log(`docker prune on ${instance.InstanceId}`);
        // Clean up old images
        await remoteDocker
          .pruneImages({
            filters: JSON.stringify({
              until: { '3h': true },
              dangling: { false: true },
            }),
          })
          .catch(log);
        log(`docker pull image ${imageName} on ${instance.InstanceId}`);
        await dockerPull(remoteDocker, imageName, ecrAuth);
        if (argv.pullImage !== imageName) {
          log(`docker tag ${imageName} as ${argv.pullImage}`);

          // `argv.pullImage` is the image name passed to this script. We
          // resolve that into a repo digest above, which we use on each
          // instance to make extra sure we're deploying the same image
          // everywhere. The two may be the same (if the script was started with
          // a repo digest in the first place), but if they are not, we tag the
          // image we pulled (by repo disgest) with the name that was passed to
          // the script. For example: if the script is started with a image name
          // like '.../server:latest`, then we resolve it to a concrete repo
          // digest once above, we pull that image by digest here on each
          // instance, and then tag it with given name to update the tag
          // ('latest' in this example) on the instance.
          // We could also just pull 'latest' on each instance, but this way
          // it's just that little bit safer (e.g. if the 'latest' tag get
          // updated while this script is running)
          await dockerTag(remoteDocker, imageName, argv.pullImage);
        }

        log(`finished docker pull on ${instance.InstanceId}`);
      }),
    );

    // Now it's time to redeploy all instances

    for (const instance of instances) {
      log(`\n\nInstance: ${instance.InstanceId} (${instance.PrivateDnsName})`);

      // Check the instance health (according to the load balancer)
      let instanceHealth = (
        await getInstanceHealth(CONFIG[tier].targetGroups.api, elbv2Client)
      )[instance.InstanceId!];

      if (instanceHealth !== 'healthy') {
        // If we are not healthy to begin with, we better not touch this instance
        log(`Skipping - instance health is ${instanceHealth}`);
        void postErrorMessage(`During deployment to ${tier}, skipping an instance due to its health status
\`\`\`
Instance ID: ${instance.InstanceId}
Host name: ${instance.PrivateDnsName}
Health status: ${instanceHealth}
\`\`\`
`);
        continue;
      }

      // Deregister this instance from the load balancer.
      for (const [name, arn] of Object.entries(CONFIG[tier].targetGroups)) {
        do {
          log(`Deregistering from load balancer ${name} target group...`);
          await elbv2Client.send(
            new elbv2.DeregisterTargetsCommand({
              TargetGroupArn: arn,
              Targets: [{ Id: instance.InstanceId! }],
            }),
          );

          // Wait one second before checking instance health again
          await sleepSeconds(1);

          instanceHealth = (await getInstanceHealth(arn, elbv2Client))[
            instance.InstanceId!
          ];
          log(`Instance health is now: ${instanceHealth}`);
        } while (instanceHealth === 'healthy');
      }

      // Despite the above checks, we still see that requests to our API can
      // fail with an error 502 during deployment. Adding an extra delay between
      // removing an instance from the load balancer and shutting down the
      // instance seems to solve this reliably.

      if (process.env.ACCELERATE_DEPLOY === 'true') {
        log('Skipping 30 second pause because ACCELERATE_DEPLOY is true');
      } else {
        log('Pausing for 30 seconds to help settle load balancer state');
        await sleepSeconds(30);
        log('Continuing...');
      }

      // Connect to Docker on the instance, stop and remove the current `server`
      // container
      const remoteDocker = new Docker({
        host: instance.PrivateDnsName!,
        port: 2375,
        protocol: 'http',
      });

      try {
        await remoteDocker
          .getContainer('server')
          .update({ RestartPolicy: { Name: '' } });
      } catch (err) {
        log(
          'Updating the restart policy of the existing server container failed:',
          err,
        );
      }

      await drainServer(instance.PrivateDnsName!);

      try {
        await remoteDocker.getContainer('server').stop();
        await remoteDocker.getContainer('server').remove();
      } catch (err) {
        // If we cannot stop/remove the container, it might just be because it
        // wasn't running. If that's the case we can still go ahead and start
        // the server on this instance.

        log(`Could not stop/remove existing container on instance:`, err);
      }

      // Create and then start the new server container
      const container = await remoteDocker.createContainer({
        Image: imageName,
        name: 'server',
        AttachStdin: false,
        AttachStdout: false,
        AttachStderr: false,
        Env: [`CORD_TIER=${tier}`],
        HostConfig: {
          NetworkMode: 'host',
          RestartPolicy: { Name: 'always' },
        },
      });
      await container.start();

      // Wait for the server to be up and running and ready to serve requests
      await waitForServerInit(instance.PrivateDnsName!);

      // Register this instance with the load balancer
      await Promise.all(
        Object.values(CONFIG[tier].targetGroups).map((arn) =>
          elbv2Client.send(
            new elbv2.RegisterTargetsCommand({
              TargetGroupArn: arn,
              Targets: [{ Id: instance.InstanceId! }],
            }),
          ),
        ),
      );

      // Wait for this instance to successfully register with the load balancer
      // before moving on to refreshing the next instance
      for (;;) {
        await sleepSeconds(3);
        instanceHealth = (
          await getInstanceHealth(CONFIG[tier].targetGroups.api, elbv2Client)
        )[instance.InstanceId!];

        log(`Instance health: ${instanceHealth}`);

        // Instance health should be 'initial' while it's registering and
        // 'healthy' when it's registered It may enter another state e.g. if at
        // that moment the scaling group decides to cut the instance In which
        // case, move on to the next instance to avoid getting stuck on the dying
        // instance
        if (instanceHealth === 'healthy') {
          log('Instance is back online!');
          break;
        } else if (instanceHealth !== 'initial') {
          log(
            `Instance is in an unexpected state (${instanceHealth}) - moving on to next instance`,
          );
          void postErrorMessage(`During deployment to ${tier}, instance in unexpected health state after server restart
\`\`\`
Instance ID: ${instance.InstanceId}
Host name: ${instance.PrivateDnsName}
Health status: ${instanceHealth}
\`\`\`
`);
          break;
        }
      }
    }

    // Job done. Let's post about it!
    let msg = `Redeployed ${tier}: ${gitCommitTitle || ''}${
      gitCommitHash
        ? ` (<https://github.com/getcord/monorepo/commit/${gitCommitHash}|${gitCommitHash.substr(
            0,
            10,
          )}>)`
        : ''
    }
• Package version: ${packageVersion}
• Image: \`${imageName}\``;

    try {
      const compress = promisify(zlib.brotliCompress);
      const sdk = await fs.readFile(
        `dist/${tier}/external/sdk/v1/sdk.latest.js`,
      );
      const compressed = await compress(sdk);

      const sdkBytes = sdk.length;
      const sdkCompressedBytes = compressed.length;

      await db.query(
        'UPDATE cord.deploys SET "sdkBytes"=$1, "sdkCompressedBytes"=$2 WHERE id=$3',
        [sdkBytes, sdkCompressedBytes, deployID],
      );
      msg += `
• SDK size: ${sdkBytes} bytes, ${sdkCompressedBytes} bytes compressed`;
    } catch (err) {
      log('Failed to estimate sdk size', err);
    }

    await postInfoMessage(msg);
    // We should catch any exceptions thrown by the following code, because if
    // we don't we will post the generic "push failed" error message to Slack.

    // Finally, upload static content to S3 and tell CloudFront to invalidate its
    // caches.
    try {
      log('Upload static content to S3');
      await Promise.all([
        runCommandLine('aws', [
          's3',
          'cp',
          '--recursive',
          '--exclude',
          '*.js',
          `dist/${tier}/external/`,
          `s3://${env.APP_SERVER_HOST}/`,
        ]),
        runCommandLine('aws', [
          's3',
          'cp',
          '--recursive',
          '--exclude',
          '*',
          '--include',
          '*.js',
          '--content-type',
          'application/javascript; charset=utf-8',
          `dist/${tier}/external/`,
          `s3://${env.APP_SERVER_HOST}/`,
        ]),
      ]).then((codes) => {
        if (codes[0] !== 0 || codes[1] !== 0) {
          throw new Error(`'aws s3 cp' failed with exit code ${codes}`);
        }
      });
    } catch (err) {
      await postErrorMessage(`Publishing assets on S3 failed with error
\`\`\`
${inspect(err, false, 10, false)}
\`\`\``);
    }

    // Invalidate S3 CloudFront
    log('Invalidate S3 CloudFront');

    try {
      await retryOnError(
        'Invalidating S3 CloudFront',
        async () => {
          const cloudfrontClient = new cloudfront.CloudFrontClient({
            region: AWS_REGION,
          });

          const invalidation = await cloudfrontClient.send(
            new cloudfront.CreateInvalidationCommand({
              DistributionId: CONFIG[tier].cloudFrontDistributionID,
              InvalidationBatch: {
                Paths: { Quantity: 1, Items: ['/*'] },
                CallerReference: `deploy-${Date.now()}`,
              },
            }),
          );
          log(
            `Created CloudFront invalidation (id: ${invalidation.Invalidation?.Id})`,
          );
        },
        {
          retries: 10,
          retryIf: (err) => err.Code === 'ServiceUnavailable',
        },
      );
    } catch (err) {
      await postErrorMessage(`Invalidating S3 CloudFront failed
\`\`\`
${inspect(err, false, 10, false)}
\`\`\``);
      // Continue the script anyway, this isn't a major problem
    }

    // If requested on the command line, tag the deployed image. This is useful,
    // e.g. when we are deploying to staging to keep updating the "staging" tag in
    // the Docker registry to point to the latest image that got successfully
    // deployed to staging.
    if (argv.pushOnSuccess) {
      try {
        await dockerTag(localDocker, imageName, argv.pushOnSuccess);

        await localDocker
          .getImage(argv.pushOnSuccess)
          .push({ authconfig: ecrAuth } as any);
      } catch (err) {
        await postErrorMessage(`Updating the Docker tag '${
          argv.pushOnSuccess
        }' failed
  \`\`\`
  ${inspect(err, false, 10, false)}
  \`\`\``);
      }
    }

    await postInfoMessage('Deployment procedure finished');
  })().then(
    () =>
      db.query(
        `UPDATE cord.deploys SET "deployFinishTime"=NOW(), success=TRUE WHERE id=$1;`,
        [deployID],
      ),
    async (error) => {
      let errorString = '';
      try {
        errorString = inspect(error);
      } catch (_) {
        errorString = `${error}`;
      }
      await db.query(
        `UPDATE cord.deploys SET "deployFinishTime"=NOW(), success=FALSE, error=$1 WHERE id=$2;`,
        [errorString, deployID],
      );
      return await Promise.reject(error);
    },
  );

  // Finally, just do an instance refresh for the async worker, to get it
  // replaced with the current version. (Before triggering an instance refresh,
  // cancel any ongoing ones.)
  await asClient
    .send(
      new autoscaling.CancelInstanceRefreshCommand({
        AutoScalingGroupName: `${tier}-asyncWorker`,
      }),
    )
    // Ignore ActiveInstanceRefreshNotFound errors
    .catch((err) =>
      err.Error?.Code === 'ActiveInstanceRefreshNotFound'
        ? null
        : Promise.reject(err),
    );

  await asClient.send(
    new autoscaling.StartInstanceRefreshCommand({
      AutoScalingGroupName: `${tier}-asyncWorker`,
    }),
  );

  return 0;
}

/**
 * Obtain a list of ec2.Instance objects for a given autoscaling group name
 */
async function getAutoscalingGroupInstances(
  autoScalingGroupName: string,
  asClient: autoscaling.AutoScalingClient,
  ec2Client: ec2.EC2Client,
) {
  const { AutoScalingInstances: asInstances } = await asClient.send(
    new autoscaling.DescribeAutoScalingInstancesCommand({}),
  );
  const instanceIDs = (asInstances ?? [])
    .filter(
      (instance) =>
        instance.AutoScalingGroupName === autoScalingGroupName &&
        instance.LifecycleState === 'InService',
    )
    .map((instance) => instance.InstanceId)
    .filter((x?: string): x is string => x !== undefined);

  const response = await ec2Client.send(
    new ec2.DescribeInstancesCommand({ InstanceIds: instanceIDs }),
  );

  return (
    (response.Reservations ?? [])
      .map((reservation) => reservation.Instances ?? [])
      .flat()
      // only return instances that have these fields
      .filter(({ InstanceId, PrivateDnsName }) => InstanceId && PrivateDnsName)
  );
}

/**
 * Obtain auth object for Docker pull
 */
async function getEcrAuth(ecrClient: ecr.ECRClient) {
  const ecrAuthToken = await ecrClient.send(
    new ecr.GetAuthorizationTokenCommand({}),
  );
  const token = ecrAuthToken.authorizationData?.[0].authorizationToken;

  if (!token) {
    throw new Error('Could not obtain ECR login credentials');
  }

  const f = decode(token).split(':');

  if (f.length !== 2) {
    throw new Error('Invalid ECR login credentials');
  }

  return { username: f[0], password: f[1] };
}

/**
 * Pull an image from a remote Docker repository
 *
 * The Dockerode API is a bit awkward here: since we want to pass authentication
 * details, we must provide a callback instead of getting a promise returned.
 * This function wraps that awkward API to reduce code clutter.
 */
function dockerPull(
  docker: Docker,
  repoTag: string,
  auth: { username: string; password: string },
): Promise<void> {
  return retryOnError(
    'dockerPull',
    () =>
      new Promise<void>((resolve, reject) =>
        docker.pull(
          repoTag,
          {},
          (err, stream: NodeJS.ReadableStream | undefined) => {
            if (stream && !err) {
              let error: any = undefined;

              // Discard all data. If we don't register this event handler, the
              // stream just blocks.
              stream.on('data', (data: Buffer) => {
                if (error === undefined) {
                  try {
                    const parsed = JSON.parse(data.toString('utf-8'));
                    if (parsed.error) {
                      error = new Error(parsed.error);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
                  } catch (err: any) {
                    error = err;
                  }
                }
              });
              stream.once('end', () => {
                if (error !== undefined) {
                  reject(error);
                } else {
                  resolve();
                }
              });
            } else {
              reject(err);
            }
          },
          auth,
        ),
      ),
    {
      retryIf: (err) => err.statusCode === 404,
    },
  );
}

/**
 * Tag a Docker image
 */
async function dockerTag(
  docker: Docker,
  existingImage: string,
  newTag: string,
) {
  // If "newTag" is not of the form "repo:tag", then we can't add that tag. We
  // can just silently ignore this case here.

  const match = /^(?<repo>.*):(?<tag>.*)$/.exec(newTag);
  if (match && match.groups) {
    const { repo, tag } = match.groups;
    await docker.getImage(existingImage).tag({ repo, tag });
  }
}

async function getInstanceHealth(
  targetGroupArn: string,
  elbv2Client: elbv2.ElasticLoadBalancingV2Client,
) {
  const response = await elbv2Client.send(
    new elbv2.DescribeTargetHealthCommand({
      TargetGroupArn: targetGroupArn,
    }),
  );
  return Object.fromEntries<string>(
    (response.TargetHealthDescriptions ?? [])
      .map((hd) => [hd.Target?.Id, hd.TargetHealth?.State])
      .filter((x: any): x is [string, string] => x[0] && x[1]),
  );
}

async function drainServer(hostname: string) {
  const port = Number(env.STATUS_SERVER_PORT);

  if (!Number.isNaN(port)) {
    log('Contacting instance and requesting graceful shutdown');
    const response = await fetch(
      `http://${hostname}:${env.STATUS_SERVER_PORT}/drain-and-wait`,
      {
        method: 'POST',
        // Don't wait longer than one minute here!
        signal: AbortSignal.timeout(60 * 1000),
      },
    ).catch((err) => {
      logError(err);
      return null;
    });

    if (
      response &&
      response.status === 200 &&
      (await response.text()) === 'terminating'
    ) {
      // All is well, we can return immediately
      log('Server terminated gracefully');
      return;
    }
  }

  // We couldn't connect to the server, or requesting the draining somehow
  // failed (or timed out). Let's wait another 10s and hope for the best.
  log(`Could not trigger graceful shutdown of ${hostname} - waiting 10s`);
  await sleepSeconds(10);
}

async function waitForServerInit(hostname: string) {
  const port = Number(env.STATUS_SERVER_PORT);

  if (Number.isNaN(port)) {
    log(
      `Server status port not configured - cannot check for initialisation - waiting 10s and hoping for the best`,
    );
    return await sleepSeconds(10);
  }

  // Contact the newly started server's status port and request
  // `/wait-for-init`. This might fail because the server is still starting up
  // and is not listening on that port yet. In that case we wait 2 seconds and
  // retry, up to 10 times. If it fails for another reason, we also retry
  // after 2 seconds. Once we get the 'ok' from the server, we return from
  // this function. If that doesn't happen after 10 attempts, we throw an
  // error. At this point it looks like the new server version doesn't work -
  // abort the deploy!
  await retryOnError(
    'Wait for init',
    async () => {
      const response = await fetch(
        `http://${hostname}:${env.STATUS_SERVER_PORT}/wait-for-init`,
        {
          // Once we can connect to the server, the start-up is usually super
          // quick, so we don't expect to have to wait for a long time. Don't wait
          // longer than ten seconds here!
          signal: AbortSignal.timeout(10 * 1000),
        },
      );
      if (
        !(
          response &&
          response.status === 200 &&
          (await response.text()) === 'ok'
        )
      ) {
        throw new Error('Received bad response from server');
      }
    },
    {
      retries: 10,
      retryDelaySeconds: 2,
    },
  );
}

type RetryOptions = {
  retries?: number;
  retryIf?: (err: any) => boolean;
  retryDelaySeconds?: number;
};

async function retryOnError<T>(
  operationName: string,
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const opts: Required<RetryOptions> = {
    retries: 3,
    retryIf: (_) => true,
    retryDelaySeconds: 5,
    ...options,
  };
  try {
    return await operation();
  } catch (err) {
    if (opts.retries > 0 && opts.retryIf(err)) {
      log(`${operationName} failed, retrying (retries=${opts.retries})`);
      await sleepSeconds(opts.retryDelaySeconds);
      return await retryOnError(operationName, operation, {
        ...opts,
        retries: opts.retries - 1,
      });
    } else {
      log(`${operationName} failed:`, inspect(err, false, 10, false));
      throw err;
    }
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    logError(err);
    process.exit(1);
  },
);
