#!/usr/bin/env -S node -r dotenv/config

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as s3 from '@aws-sdk/client-s3';
import { bundleCSS } from './bundle-CSS.mjs'; // eslint-disable-line no-restricted-imports

const argv = yargs(hideBin(process.argv)).strict().option('bucket', {
  type: 'string',
  description: 'Which s3 bucket to upload the file to',
  demandOption: true,
  default: 'app.cord.com',
}).argv;

const cssBundle = await bundleCSS();
const pathToFile = `sdk/css/${cssBundle.pkgVersion}/react-${cssBundle.pkgVersion}.css`;

const s3Client = new s3.S3Client();
const command = new s3.PutObjectCommand({
  Bucket: argv.bucket,
  Key: pathToFile,
  Body: cssBundle.css,
  ContentType: 'text/css',
});

try {
  const response = await s3Client.send(command);
  console.log('Uploaded CSS: ', response);
} catch (err) {
  console.error('Failed to upload CSS', err);
}
