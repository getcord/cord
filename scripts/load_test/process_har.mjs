#!/usr/bin/env node

import fs from 'fs';
import yargs from 'yargs';
/* eslint-disable no-restricted-imports -- easier for scripts to load them relatively */
import { loadWebsocketMessages, rewriteConnectionInit } from './util.mjs';

function main() {
  yargs()
    .command(
      '* <input_file> <output_file>',
      false,
      (yargs) => {
        return yargs.check((argv) => {
          if (!argv.input_file.toLowerCase().endsWith('.har')) {
            throw new Error(`input_file must be a HAR file`);
          }
          return true;
        });
      },
      (argv) => {
        const messages = rewriteConnectionInit(
          loadWebsocketMessages(fs.readFileSync(argv.input_file)),
          '--REDACTED--',
          '--REDACTED--',
        );

        fs.writeFileSync(argv.output_file, JSON.stringify(messages, null, 2));
      },
    )
    .parse(process.argv.slice(2));
}

main();
