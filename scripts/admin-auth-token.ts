#!/usr/bin/env -S node --enable-source-maps

/*
 * This script fetches a usable auth token from the admin tool and outputs it on
 * stdout.  It requires that you're already authenticated in your web browser,
 * and then uses that browser session to produce the token.  This may cause your
 * browser to come to the foreground.
 *
 * Options:
 *   --withBearer - Output a "Bearer" prefix before the token
 *   --tier - Which tier to produce a token for (default prod)
 */

import 'dotenv/config.js';
import yargs from 'yargs';
import { fetchAuthToken } from 'scripts/lib/auth.ts';

async function main() {
  const { argv } = yargs(process.argv.slice(2))
    .option('withBearer', {
      type: 'boolean',
      description: 'Include "Bearer" prefix in the output',
      default: false,
    })
    .option('tier', {
      type: 'string',
      description: 'Which tier to fetch a token for',
      choices: ['prod', 'staging'],
      default: 'prod',
    })
    .help();
  const authToken = await fetchAuthToken(argv.tier as 'prod' | 'staging');
  if (authToken) {
    console.log(`${argv.withBearer ? 'Bearer ' : ''}${authToken}`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
