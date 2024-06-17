#!/usr/bin/env -S node --enable-source-maps --no-deprecation

import 'dotenv/config.js';
import yargs from 'yargs';
import { getApplicationManagementAuthToken } from '@cord-sdk/server';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { CORD_CUSTOMER_ID } from 'common/const/Ids.ts';

async function main() {
  const argv = yargs(process.argv.slice(2)).option({
    customerID: {
      description: 'customer ID to generate the auth token for',
      type: 'string',
      default: CORD_CUSTOMER_ID,
    },
  }).argv;

  await initSequelize('script');

  const customer = await CustomerEntity.findByPk(argv.customerID);
  if (!customer) {
    throw new Error(`Platform customer ${argv.customerID} not found`);
  }

  const customerAuthToken = getApplicationManagementAuthToken(
    customer.id,
    customer.sharedSecret,
  );

  console.log(customerAuthToken);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
