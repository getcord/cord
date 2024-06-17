#!/usr/bin/env -S node --enable-source-maps

import 'dotenv/config.js';
import yargs from 'yargs';
import { getClientAuthToken } from '@cord-sdk/server';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CORD_APPLICATION_ID } from 'common/const/Ids.ts';

async function main() {
  const argv = yargs(process.argv.slice(2)).option({
    app: {
      description: 'application ID to generate the client auth token for',
      type: 'string',
      default: CORD_APPLICATION_ID,
    },
    user: {
      description: 'user ID to generate the client auth token for',
      type: 'string',
      demandOption: true,
    },
    org: {
      description: 'org ID to generate the client auth token for',
      type: 'string',
      default: 'cord',
    },
    expires: {
      description: 'how long the token should be valid for',
      type: 'string',
    },
  }).argv;

  await initSequelize('script');

  const application = await ApplicationEntity.findByPk(argv.app);
  if (!application) {
    throw new Error(`Platform application ${argv.app} not found`);
  }

  const clientAuthToken = getClientAuthToken(
    argv.app,
    application.sharedSecret,
    {
      user_id: argv.user,
      group_id: argv.org,
    },
    { expires: argv.expires },
  );

  console.log(clientAuthToken);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
