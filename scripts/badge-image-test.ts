#!/usr/bin/env -S node --enable-source-maps

import 'dotenv/config.js';
import yargs from 'yargs';

import { initSequelize } from 'server/src/entity/sequelize.ts';
import { getBadgedImageURL } from 'server/src/image_processing/badge.ts';

const argv = yargs(process.argv.slice(2))
  .option('size', {
    type: 'number',
    description: 'size (width and height) of output image',
  })
  .option('inputUrl', {
    type: 'string',
    demandOption: true,
    description: 'URL of input image',
  })
  .option('badgeUrl', {
    type: 'string',
    demandOption: true,
    description: 'URL of badge image',
  })
  .strict()
  .help()
  .alias('help', 'h').argv;

const { size, inputUrl, badgeUrl } = argv;

async function main() {
  await initSequelize('script');

  const output = await getBadgedImageURL(inputUrl, badgeUrl, { size });
  console.log(output);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
