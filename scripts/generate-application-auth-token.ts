#!/usr/bin/env -S node --enable-source-maps --no-deprecation

import 'dotenv/config.js';
import yargs from 'yargs';
import { getServerAuthToken } from '@cord-sdk/server';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CORD_APPLICATION_ID } from 'common/const/Ids.ts';

// This script uses the getServerAuthToken library to generate an
// application-level auth token used by most of our REST APIs (except
// the applications api which uses a customer-level auth token which can
// be generated using the `generate-customer-auth-token` script).

async function main() {
  const argv = yargs(process.argv.slice(2)).option({
    app: {
      description: 'application ID to generate the server auth token for',
      type: 'string',
      default: CORD_APPLICATION_ID,
    },
    secret: {
      description: 'application secret to use for signing',
      type: 'string',
    },
  }).argv;

  if (!argv.secret) {
    await initSequelize('script');

    const application = await ApplicationEntity.findByPk(argv.app);
    if (!application) {
      throw new Error(`Platform application ${argv.app} not found`);
    }
    argv.secret = application.sharedSecret;
  }

  const applicationAuthToken = getServerAuthToken(argv.app, argv.secret);

  console.log(applicationAuthToken);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
