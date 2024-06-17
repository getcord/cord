#!/usr/bin/env -S node --enable-source-maps

import 'dotenv/config.js';
import yargs from 'yargs';

import { initSequelize } from 'server/src/entity/sequelize.ts';
import { getResizedImageURL } from 'server/src/image_processing/resizeOnly.ts';

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
  .strict()
  .help()
  .alias('help', 'h').argv;

const { size, inputUrl } = argv;

async function main() {
  await initSequelize('script');

  const output = await getResizedImageURL(inputUrl, { size });
  console.log(output);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
