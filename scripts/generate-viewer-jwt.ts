#!/usr/bin/env -S node --enable-source-maps

import 'dotenv/config.js';
import yargs from 'yargs';
import * as jsonwebtoken from 'jsonwebtoken';
import env from 'server/src/config/Env.ts';

async function main() {
  const argv = yargs(process.argv.slice(2)).option({
    app: {
      description: 'application ID to include in the viewer object (optional)',
      type: 'string',
    },
    user: {
      description: 'user ID',
      type: 'string',
      demandOption: true,
    },
    org: {
      description: 'org ID',
      type: 'string',
      demandOption: true,
    },
  }).argv;

  const token = jsonwebtoken.sign(
    {
      viewer: {
        platformApplicationID: argv.app,
        userID: argv.user,
        orgID: argv.org,
      },
    },
    env.JWT_SIGNING_SECRET,
    { expiresIn: '60 min', algorithm: 'HS512' },
  );

  console.log(`Bearer ${token}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
