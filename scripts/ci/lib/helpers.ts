import * as child_process from 'child_process';

import * as Slack from '@slack/web-api';
import pg from 'pg';

import env from 'server/src/config/Env.ts';
import sleep from 'common/util/sleep.ts';

/**
 * Run a command line and return the exit code
 */
export function runCommandLine(
  cmd: string,
  args: string[],
  options: child_process.SpawnOptions = {},
  stdin?: string,
): Promise<number | null> {
  console.log(`Executing command:\n  ${cmd} ${args.join(' ')}\n`);
  return new Promise<number | null>((resolve, reject) => {
    const proc = child_process.spawn(cmd, args, {
      stdio: [stdin === undefined ? 'ignore' : 'pipe', 'inherit', 'inherit'],
      ...options,
    });
    if (stdin !== undefined && proc.stdin) {
      const stream = proc.stdin;
      stream.write(stdin, 'utf-8', () => stream.end());
    }
    proc.on('error', reject);
    proc.once('close', (code) => resolve(code));
  });
}

export async function connectToDatabase() {
  const clientConfig: pg.ClientConfig = {
    user: env.POSTGRES_USER,
    host: env.POSTGRES_HOST,
    database: env.POSTGRES_DB,
    password: env.POSTGRES_PASSWORD,
    port:
      env.POSTGRES_PORT !== undefined ? Number(env.POSTGRES_PORT) : undefined,
  };

  const client = new pg.Client(clientConfig);
  await client.connect();
  return client;
}

export async function postMessageFactory(slackChannelID: string | undefined) {
  if (slackChannelID) {
    try {
      const token = env.SLACK_INTERNAL_BOT_TOKEN;
      let prefix = '';

      const {
        GITHUB_REPOSITORY,
        GITHUB_RUN_ID,
        GITHUB_RUN_NUMBER,
        GITHUB_SERVER_URL,
      } = process.env;
      if (
        GITHUB_REPOSITORY &&
        GITHUB_RUN_ID &&
        GITHUB_RUN_NUMBER &&
        GITHUB_SERVER_URL
      ) {
        prefix = `[<${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}|#${GITHUB_RUN_NUMBER}>] `;
      }

      const slackClient = new Slack.WebClient(token);
      return async (text: string) => {
        try {
          await slackClient.chat.postMessage({
            channel: slackChannelID,
            text: prefix + text,
          });
        } catch (err) {
          console.error(`Error posting message to Slack: ${text}`, err);
        }
      };
    } catch (err) {
      console.error('Cannot post messages to Slack:', err);
    }
  }
  return (text: string) => {
    console.log(text);
    return Promise.resolve();
  };
}

export const sleepSeconds = (seconds: number) => sleep(seconds * 1000);
