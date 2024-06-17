#!/usr/bin/env node

const fs = require('fs').promises;
const dotenv = require('dotenv');
const yargs = require('yargs');

const { replaceSecretsInObject } = require('./lib/secrets.cjs');

async function main() {
  const {
    input: inputFileName,
    output: outputFileName,
    'fail-quietly': failQuietly,
  } = yargs
    .option('input', {
      type: 'string',
      description: 'path to the input configuration file',
      default: '.env',
    })
    .option('output', {
      type: 'string',
      description: 'path to the .env file to be generated',
      default: '.env',
    })
    .option('fail-quietly', {
      description:
        'if replacing the placeholders with secrets fails, do not print an ' +
        'error message, and always exit with status 0',
    })
    .help().argv;

  try {
    const configFromFile = dotenv.parse(await fs.readFile(inputFileName));

    const configAfterApplyingOverrides = Object.fromEntries(
      Object.entries(configFromFile).map(([key, value]) => {
        const overrideKey = `CORD_OVERRIDE_${key}`;
        const overrideValue = process.env[overrideKey];

        return [key, overrideValue != null ? overrideValue : value];
      }),
    );

    const configWithSecrets = await replaceSecretsInObject(
      configAfterApplyingOverrides,
    );

    await fs.writeFile(
      outputFileName,
      Object.entries(configWithSecrets)
        .map(([key, value]) => {
          return `${key}=${shellEscape(value)}\n`;
        })
        .join(''),
    );
  } catch (err) {
    if (failQuietly) {
      // do nothing
    } else {
      throw err;
    }
  }
}

function shellEscape(x) {
  return "'" + x.toString().replace(/'/g, "'\\''") + "'";
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(`${err}`);
    process.exit(1);
  },
);
