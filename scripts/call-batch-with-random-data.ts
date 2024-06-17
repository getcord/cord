#!/usr/bin/env -S node --enable-source-maps

import 'dotenv/config.js';
import yargs from 'yargs';
import * as jsonwebtoken from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { CORD_APPLICATION_ID } from 'common/const/Ids.ts';

async function main() {
  const argv = yargs(process.argv.slice(2)).option({
    host: {
      description: 'API host to use (ex: api.cord.com)',
      type: 'string',
      default: `local.cord.com:8161`,
    },
    organizations: {
      description:
        'the number of organizations to create within the platform app',
      type: 'number',
      default: 1,
    },
    users: {
      description: 'the number of users to create within each organization',
      type: 'number',
      default: 10,
    },
  }).argv;

  const { host, users: userCount, organizations: orgCount } = argv;

  console.time('Got access token');

  const authorizeResponse = await fetch(`https://${host}/v1/authorize`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signed_app_token: jsonwebtoken.sign(
        { app_id: CORD_APPLICATION_ID },
        'cordrulez',
        { expiresIn: '1 min', algorithm: 'HS512' },
      ),
    }),
  });

  const { access_token } = await authorizeResponse.json();

  console.timeEnd('Got access token');

  console.time('Generated data');

  const users = Array.from({ length: userCount * orgCount }).map(
    (_, index) => ({
      id: uuid(),
      name: `user ${index}`,
      email: `user-${index}@cord.com`,
      first_name: `user`,
      last_name: `${index}`,
    }),
  );

  const organizations = Array.from({ length: orgCount }).map((_, index) => ({
    id: uuid(),
    name: `organization ${index}`,
    members: users
      .slice(index * userCount, (index + 1) * userCount)
      .map(({ id }) => id),
  }));

  console.timeEnd('Generated data');

  console.time('POST batch data');
  const batchResponse = await fetch(`https://${host}/v1/batch`, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users, organizations }),
  });

  console.timeEnd('POST batch data');

  const text = await batchResponse.text();

  console.log(text);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
