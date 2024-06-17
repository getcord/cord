import { exec } from 'child_process';
import { quote } from 'shell-quote';
import {
  getApplicationManagementAuthToken,
  getServerAuthToken,
} from '@cord-sdk/server';
import type { Argv } from 'yargs';
import { getEnvVariables } from 'src/utils';
import { prettyPrint } from 'src/prettyPrint';

// Returns the handler passing through the authentication type.
// This implementation is so that we don't have to have two separate
// handlers for the same logic, and we don't have to pass it in as an
// option through the command.
function curlTypeHandler(type: 'general' | 'project') {
  return async function (argv: any) {
    const env = await getEnvVariables().catch(() => {
      /*no-op. probably just doesn't exist yet*/
    });
    if (!env || !env.CORD_PROJECT_ID || !env.CORD_PROJECT_SECRET) {
      throw new Error('Please initialize cord first. Run cord init.');
    }

    let authToken = '';
    if (type === 'general') {
      authToken = getServerAuthToken(
        env.CORD_PROJECT_ID,
        env.CORD_PROJECT_SECRET,
      );
    } else if (type === 'project') {
      if (!env.CORD_CUSTOMER_ID || !env.CORD_CUSTOMER_SECRET) {
        throw new Error(
          'Missing CORD_CUSTOMER_ID or CORD_CUSTOMER_SECRET, please run "cord init" and add these values.',
        );
      }
      authToken = getApplicationManagementAuthToken(
        env.CORD_CUSTOMER_ID,
        env.CORD_CUSTOMER_SECRET,
      );
    }

    // removes the first one or two command calls
    // ie. 'general' args will start with ['cord']
    // 'project' args will start with ['cord', 'project']
    const requestOptions =
      type === 'general' ? argv._.slice(1) : argv._.slice(2);
    const requestString = quote(requestOptions);

    await new Promise<void>((res, rej) => {
      exec(
        `curl --oauth2-bearer ${authToken} ${requestString}`,
        (err, stdout) => {
          try {
            prettyPrint(JSON.parse(stdout));
          } catch (e) {
            prettyPrint(stdout);
          }
          if (err) {
            rej(err);
          }
          res();
        },
      );
    });
  };
}

export const curlCommand = {
  command: 'curl',
  describe:
    'Make a curl request without needing to pass an authentication token',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        '$0',
        'cord authorized curl request. Prefix request with --. E.g. cord curl -- https://api.cord.com/v1/groups',
        (yargs) => yargs,
        curlTypeHandler('general'),
      )
      .command(
        ['project', 'app', 'application'],
        'cord authorized curl project level request. Prefix request with --. E.g. cord curl project -- https://api.cord.com/v1/projects',
        (yargs) => yargs,
        curlTypeHandler('project'),
      )
      .parserConfiguration({
        'unknown-options-as-args': true,
      });
  },
  handler: (_: unknown) => {},
};
