#!/usr/bin/env -S node --enable-source-maps

// This script lets you try to figure out who signed a token by attempting to
// verify the token against each application's shared secret in the DB.  Pass
// the token in the --token flag.
//
// You probably want to run this against the production database by doing
// something like:
//
// $ npm run db-ssh-tunnel
// $ POSTGRES_PORT=15432 POSTGRES_USER=ChuckNorris POSTGRES_PASSWORD="$(aws secretsmanager get-secret-value --secret-id database-prod-1 | jq -r '.SecretString | fromjson | .password')" ./dist/scripts/find-token-signer.js --token <TOKEN>

import 'dotenv/config.js';
import yargs from 'yargs';
import { verify } from 'jsonwebtoken';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

async function main() {
  const argv = yargs(process.argv.slice(2))
    .option({
      token: {
        description: 'token',
        type: 'string',
      },
    })
    .demandOption('token').argv;

  await initSequelize('script');

  const apps = await ApplicationEntity.findAll();

  let found = false;

  for (const app of apps) {
    try {
      verify(argv.token, app.sharedSecret, {
        algorithms: ['HS256', 'HS512'],
        ignoreExpiration: true,
      });
      found = true;
      console.log(`Verified with shared secret of ${app.name} - ${app.id}`);
    } catch (e) {
      // Go to next one
    }
  }
  if (!found) {
    console.log('No matching app found');
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
