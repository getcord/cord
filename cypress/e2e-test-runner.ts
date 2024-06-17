import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as s3 from '@aws-sdk/client-s3';
import * as secretsManager from '@aws-sdk/client-secrets-manager';
import * as cypress from 'cypress';
import * as fse from 'fs-extra';
import { merge } from 'mochawesome-merge';
import { create as generator } from 'mochawesome-report-generator';
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import Yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { GIT_COMMIT_HASH } = process.env;
const CYPRESS_RUN_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const SECRETS_MANAGER_TIMEOUT_MS = 1 * 60 * 1000; // 1 minute
const RUNTEST_OUTER_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes

/**
 * This is the number of times a test is retried when it fails before we send
 * failure notifications to Slack and continue with the next test run.
 */
const RETRY_LIMIT = 1;

const {
  'aws-region': awsRegion,
  's3-bucket': s3Bucket,
  'secret-name': secretName,
  'log-group-name': logGroupName,
  'app-secret': appSecret,
} = Yargs()
  .option('aws-region', {
    type: 'string',
    default: 'eu-west-2',
  })
  .option('s3-bucket', {
    type: 'string',
    description: 'name of S3 bucket for uploading artifacts',
  })
  .option('secret-name', {
    type: 'string',
    description:
      'name of AWS SecretsManager secret which contains app secret and ' +
      'callback URLs',
  })
  .option('log-group-name', {
    type: 'string',
    description:
      'name of AWS CloudWatch log group name for logging results and errors',
  })
  .option('app-secret', {
    type: 'string',
    description:
      'shared secret used for producing auth token (overrides the one in ' +
      'the secret, if one is used)',
  })
  .help()
  .parseSync(hideBin(process.argv));

// ---------------------------------------------------------------------------
// Set up logging (to console and CloudWatch)

const processUuid = crypto.randomUUID();

const logger = winston.createLogger({
  defaultMeta: {
    process: 'e2e-test-runner',
    serverGitCommit: GIT_COMMIT_HASH,
    serverHost: os.hostname(),
    processUuid,
  },
});

logger.add(
  new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    format: winston.format.prettyPrint({ colorize: true, depth: 999 }),
  }),
);

// Add logging to CloudWatch if the --log-group-name option was set
const winstonCloudWatch = logGroupName
  ? new WinstonCloudWatch({
      // "name" is optional with default value "CloudWatch" but the
      // typedefinition has name as required. See
      // https://githubmemory.com/repo/lazywithclass/winston-cloudwatch/issues/155
      name: 'CloudWatch',
      level: 'info',
      logGroupName: logGroupName,
      logStreamName: `${new Date()
        .toISOString()
        .replace(/:/g, '.')} ${os.hostname()}(${process.pid})`,
      awsRegion: awsRegion,
      jsonMessage: true,
    })
  : null;

if (winstonCloudWatch) {
  logger.add(winstonCloudWatch);
}

/**
 * Wait for winstonCloudWatch to finish sending logs, but don't wait longer
 * than 10 seconds
 */
const waitForCloudWatchToComplete = () =>
  Promise.race([
    winstonCloudWatch
      ? new Promise<void>((resolve, reject) =>
          winstonCloudWatch.kthxbye((err) => (err ? reject(err) : resolve())),
        ).catch(console.error)
      : Promise.resolve(),
    new Promise<void>((resolve) =>
      setTimeout(
        resolve,
        10 * 1000, // 10 seconds
      ),
    ),
  ]);

// ---------------------------------------------------------------------------

async function main() {
  let run = 0;
  const summary: string[] = [];
  let someTestHasFailed = false;

  // This is for grouping output together when this script is run in a GitHub workflow
  console.log('::group::Detailed output');

  for (const browser of ['chrome', 'firefox', 'edge'] as const) {
    for (const tier of ['prod', 'staging'] as const) {
      ++run;

      // We don't want to run more than one test per minute in each tier. If
      // tests are failing fast, we want to throttle the rate at which we run
      // them.
      // Start a 30s timer now, and wait for it to expire (if it hasn't already)
      // after the test.
      const timerPromise = new Promise<void>((resolve) =>
        setTimeout(
          resolve,
          // 30 seconds
          30 * 1000,
        ),
      );

      const success = await Promise.race([
        runTest(run, tier, browser).then(
          () => true,
          (err) => {
            logger.error(`runTest failed: ${err}`, { run, browser, tier });
            return false;
          },
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(
              new Error(
                'The call to runTest did not complete within the timeout',
              ),
            );
          }, RUNTEST_OUTER_TIMEOUT_MS),
        ),
      ]).catch((err) => {
        logger.error(`${err}`, {
          run,
          browser,
          tier,
          RUNTEST_OUTER_TIMEOUT_MS,
        });
        throw err;
      });

      logger.info(`runTest returned success=${success}`, {
        run,
        browser,
        tier,
        success,
      });

      if (!success) {
        someTestHasFailed = true;
      }

      summary.push(`${success ? '✅' : '❌'} ${browser} against ${tier}`);

      await timerPromise;
    }
  }

  console.log('::endgroup::');

  console.log('\n\n\nSummary:\n' + summary.join('\n'));

  // If any test has failed, we want to end the process with a non-zero status
  // code to indicate failure. (E.g. this makes the GitHub workflow fail.)
  // Throwing an exception here will do just fine.
  if (someTestHasFailed) {
    logger.error('Some test failed');
    throw new Error('Some test failed');
  }
}

async function runTest(
  run: number,
  tier: 'prod' | 'staging',
  browser: 'chrome' | 'firefox' | 'edge',
  retry = 0,
): Promise<void> {
  const runLogger = logger.child({ run, tier, browser, retry });
  runLogger.info('starting run');

  const [e2eSecret] = await Promise.all([
    getSecret(secretName),
    fse.remove('mochawesome-report'),
    fse.remove('cypress/videos'),
    fse.remove('cypress/screenshots'),
  ]);

  const timeoutPromise = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), CYPRESS_RUN_TIMEOUT_MS),
  );

  const cypressResultPromise = cypress.run({
    browser,
    reporter: 'mochawesome',
    reporterOptions: { overwrite: false, html: false, json: true },
    env: {
      TEST_APP_SECRET: appSecret ?? e2eSecret.testApplicationSharedSecret,
      HOST:
        tier === 'prod'
          ? 'https://admin.cord.com'
          : 'https://admin.staging.cord.com',
    },
  });

  const result:
    | 'timeout'
    | CypressCommandLine.CypressRunResult
    | CypressCommandLine.CypressFailedRunResult = await Promise.race([
    timeoutPromise,
    cypressResultPromise,
  ]);

  if (result === 'timeout') {
    return await abortProcessDueToTimeout();
  }

  // The type of `result` is now `CypressRunResult | CypressFailedRunResult`

  redactResult(result);
  const meta: Record<string, string | string[] | undefined> = {};

  /**
   * Tracks the success of this invokation of Cypress and the tests run
   *
   * A value of false means that we failed to run the tests, or any of the tests
   * run failed.
   *
   * A value of true means that we ran all tests and they all passed.
   *
   * A value of null means that Cypress ran but returned no test runs.
   */
  let success: boolean | null = null;

  // This will be set to true if the test fails and the number of retries is
  // under the limit
  let willRetry = false;

  try {
    const s3Prefix = `${(Date.now() / 1000) | 0}_${processUuid}_${run}/`;
    const subject = `Test run on ${tier} using ${browser}${
      retry > 0 ? ` (retry ${retry})` : ''
    }`;

    let message = '';

    if (s3Bucket) {
      meta.resultLink = await uploadFile({
        s3Bucket,
        filename: 'result.json',
        keyPrefix: s3Prefix,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(result, undefined, 2),
      });
      message += `<${meta.resultLink}|[Cypress result (JSON)]>`;
    }

    if (result.status !== 'finished') {
      success = false;
      message += `\n❌❌❌ Failed to launch test\n\`\`\`${result.message}\n\`\`\``;
    } else if (!result.runs || result.runs.length === 0) {
      success = false;
      message += `\n❌❌❌ No test runs`;
    } else {
      // Test runs have happened - we have results

      if (s3Bucket) {
        // Generate HTML report to upload to S3

        // merge mochawesome reports into one
        const jsonReport = await merge().catch(() => undefined);

        if (jsonReport) {
          try {
            await generator(jsonReport, {
              reportFilename: 'report.html',
              cdn: true,
              reportPageTitle: 'e2e Test Report',
            });

            meta.reportLink = await uploadFile({
              s3Bucket,
              cwd: 'mochawesome-report',
              filename: 'report.html',
              keyPrefix: s3Prefix,
              contentType: 'text/html; charset=utf-8',
            });

            message += ` <${meta.reportLink}|[Test report (HTML)]>`;
          } catch (err) {
            runLogger.error(`mochawesome-report-generator failed: ${err}`);
          }
        }
      }
      message += '\n\n';
      meta.videoLinks = [];
      meta.screenshotLinks = [];

      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      for (const run of result.runs) {
        if (run.error) {
          success = false;
          message += `❌❌ Run error:\n`;
          if (run.error.length > 500) {
            message += `\`\`\`${run.error.substring(
              0,
              500,
            )}\n\`\`\`\n(truncated)`;
          } else {
            message += `\`\`\`${run.error}\n\`\`\`\n`;
          }
          continue;
        }
        const runSuccess = !!run.stats.tests && !run.stats.failures;
        success = runSuccess && success !== false;
        message += `${runSuccess ? '✅' : '❌'} (${(
          run.stats.duration / 1000
        ).toFixed(1)}s) `;

        if (GIT_COMMIT_HASH) {
          message += `<https://github.com/getcord/monorepo/blob/${GIT_COMMIT_HASH}/cypress/${run.spec.relative}|${run.spec.name}>`;
        } else {
          message += run.spec.name;
        }

        if (s3Bucket) {
          // add video
          if (run.shouldUploadVideo && run.video) {
            const videoLink = await uploadFile({
              s3Bucket,
              cwd: 'cypress',
              filename: run.video,
              keyPrefix: s3Prefix,
              contentType: 'video/mp4',
            });
            message += ` <${videoLink}|[video]>`;
            meta.videoLinks.push(videoLink);
          }

          // add screenshots
          for (const test of run.tests || []) {
            for (const attempt of test.attempts || []) {
              for (const screenshot of attempt.screenshots || []) {
                const screenshotLink = await uploadFile({
                  s3Bucket,
                  cwd: 'cypress',
                  filename: screenshot.path,
                  keyPrefix: s3Prefix,
                  contentType: 'image/png',
                });
                message += ` <${screenshotLink}|[screenshot]>`;
                meta.screenshotLinks.push(screenshotLink);
              }
            }
          }
        }

        message += '\n';

        // List tests
        for (const test of run.tests || []) {
          (test.title || []).forEach((line, index) => {
            message += `${'\u2003'.repeat(index)}• ${line}\n`;
          });
        }

        message += `<https://admin${
          tier === 'staging' ? '.staging' : ''
        }.cord.com/tests_token|[Try manual repro in admin]>`;
      }
    }

    console.log(`\n\n${subject}\n\n${message}\n\n`);

    const waitForPromises: Promise<any>[] = [];

    // The configuration (in the secret) may contain URLs for heartbeats. We
    // make a GET request to those in case a test run succeeds.
    // We use this to report SDK health to BetterUptime.
    if (success) {
      for (const browserSuffix of ['', `-${browser}`]) {
        const heartBeatUrl = e2eSecret[`heartbeat-${tier}${browserSuffix}`];
        if (heartBeatUrl) {
          waitForPromises.push(fetch(heartBeatUrl));
        }
      }
    }

    if (!success && retry < RETRY_LIMIT) {
      // The test has failed and the limit of retries hasn't been exhausted
      willRetry = true;
    }

    const slackMessage = {
      text: subject,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: subject,
            emoji: true,
          },
        },
        message && {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'divider',
        },
      ].filter(Boolean),
    };

    const prefixes = [''];
    if (success) {
      // The test has passed. Post in channels for passed tests notifications.
      prefixes.push('passed-');
    } else if (!willRetry) {
      // The test has failed and we will not retry it. Post in channels for
      // failed test notifications.
      prefixes.push('failed-');
    }

    for (const prefix of prefixes) {
      for (const suffix of ['all', tier]) {
        const key = `slack-webhook-${prefix}${suffix}`;
        const slackWebhookUrl = e2eSecret[key];
        if (slackWebhookUrl) {
          waitForPromises.push(
            fetch(slackWebhookUrl, {
              method: 'POST',
              body: JSON.stringify(slackMessage),
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            }).then(async (response) => {
              if (!response.ok) {
                runLogger.error(
                  `Posting to Slack webhook returned status ${response.status}`,
                  {
                    status: response.status,
                    body: await response
                      .text()
                      .catch((err) => `ERROR LOADING RESPONSE BODY: ${err}`),
                    key,
                    slackWebhookUrl,
                    slackMessage,
                  },
                );
              }
            }),
          );
        }
      }
    }

    await Promise.all(
      waitForPromises.map((promise) =>
        promise.catch((error) => console.error(error)),
      ),
    );
  } finally {
    runLogger.info('finished run', { result, success, ...meta });
  }

  if (willRetry) {
    return await runTest(run, tier, browser, retry + 1);
  } else if (!success) {
    throw new Error('test failed');
  }
}

async function abortProcessDueToTimeout(): Promise<never> {
  try {
    // Log this timeout
    logger.error(
      'Aborting e2e-test-runner process due to Cypress test run hitting timeout',
    );

    // Sent message to Slack, if there is a Slack webhook for this configured for
    // this in the secret
    const e2eSecret = await getSecret(secretName);
    const slackWebhookUrl = e2eSecret['slack-webhook-error'];
    if (slackWebhookUrl) {
      const slackMessage = {
        text:
          '❌❌❌ e2e-test-runner error: Cypress process did not complete in time\n' +
          '(The e2e-test-runner is restarting now, which should fix the problem. ' +
          'However, if this message appears repeatedly, then something is wrong. Also ' +
          'please check that you see reports of successful runs following this message ' +
          'within a minute or two.)',
      };
      await fetch(slackWebhookUrl, {
        method: 'POST',
        body: JSON.stringify(slackMessage),
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // If we are logging to CloudWatch, we want to wait for the submission of
    // the log line above has completed
    await waitForCloudWatchToComplete();
  } finally {
    console.log('Terminating now...');
    process.exit(1);
  }
}

function redactResult(data: any) {
  // Remove the TEST_APP_SECRET from this json object

  if (!data || typeof data !== 'object') {
    return;
  }
  if ('TEST_APP_SECRET' in data) {
    data.TEST_APP_SECRET = '[redacted]';
  }
  if (Array.isArray(data)) {
    data.forEach(redactResult);
  } else {
    Object.values(data).forEach(redactResult);
  }
}

export async function uploadFile(opts: {
  s3Bucket: string;
  cwd?: string;
  filename: string;
  keyPrefix: string;
  contentType?: string;
  body?: string | Buffer | fs.ReadStream;
}) {
  const { cwd = '.', filename, keyPrefix, contentType, body } = opts;

  const s3Client = new s3.S3Client({ region: awsRegion });
  const absolutePath = path.resolve(cwd, filename);
  const key = `${keyPrefix}${path
    .relative(cwd, absolutePath)
    .replace(/^(..\/)+/, '')}`;

  await s3Client.send(
    new s3.PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: body ?? fs.createReadStream(absolutePath),
      ContentType: contentType,
    }),
  );
  return `https://admin.cord.com/s3/${s3Bucket}/${key}`;
}

async function getSecret(
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  secretName: string | null | undefined,
): Promise<Record<string, string | undefined>> {
  if (!secretName) {
    return {};
  }

  const client = new secretsManager.SecretsManagerClient({
    region: awsRegion,
  });
  const response = await Promise.race([
    client.send(
      new secretsManager.GetSecretValueCommand({ SecretId: secretName }),
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(
          new Error(
            'secretsManager.GetSecretValueCommand did not return within the timeout',
          ),
        );
      }, SECRETS_MANAGER_TIMEOUT_MS),
    ),
  ]).catch((err) => {
    logger.error(`${err}`, { SECRETS_MANAGER_TIMEOUT_MS });
    throw err;
  });

  const secretString = response.SecretString;
  if (secretString) {
    const secret = JSON.parse(secretString);

    if (secret && typeof secret === 'object' && !Array.isArray(secret)) {
      // secret is a JSON object. Only return entries whose value is a string.

      return Object.fromEntries(
        Object.entries(secret).filter(
          (x: [string, unknown]): x is [string, string] =>
            typeof x[1] === 'string',
        ),
      );
    }
  }
  return {};
}

main()
  .then(
    () => 0,
    (err) => {
      console.error(err);
      return 1;
    },
  )
  .then(
    async (exitCode) => {
      await waitForCloudWatchToComplete();
      process.exit(exitCode);
    },
    (_e) => process.exit(2), // Should be impossible!
  );
