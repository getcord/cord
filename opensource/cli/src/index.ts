#!/usr/bin/env node

import { inspect } from 'util';
import chalk from 'chalk';
import yargs from 'yargs';
import { threadCommand } from 'src/commands/thread';
import { userCommand } from 'src/commands/user';
import { groupCommand } from 'src/commands/group';
import { projectCommand } from 'src/commands/application';
import { notificationCommand } from 'src/commands/notification';
import { messageCommand } from 'src/commands/message';
import { fileCommand } from 'src/commands/file';
import { initCommand } from 'src/commands/init';
import { checkVersion } from 'src/checkVersion';
import packageData from 'package.json';
import { permissionCommand } from 'src/commands/permission';
import { clientAuthTokenCommand } from 'src/commands/clientAuthToken';
import { curlCommand } from 'src/commands/curl';

async function main(): Promise<void> {
  await checkVersion();
  await yargs(process.argv.slice(2))
    .scriptName('cord')
    .usage('$0 <cmd> [args]')
    .strict()
    .demand(1)
    .command(initCommand)
    .command(groupCommand)
    .command(threadCommand)
    .command(userCommand)
    .command(projectCommand)
    .command(notificationCommand)
    .command(messageCommand)
    .command(fileCommand)
    .command(permissionCommand)
    .command(clientAuthTokenCommand)
    .command(curlCommand)
    .fail((msg, err, yargs) => {
      yargs.showHelp();
      console.error(chalk.red(`\n${msg ?? inspect(err)}`));
      process.exit(1);
    })
    .version(packageData.version)
    .wrap(yargs().terminalWidth())
    .help().argv;

  // The OS might refuse a write to stdout, such as if it's a pipe and the pipe
  // is full. If that happens, node will buffer writes for us, but we need to
  // wait until it's had a chance to flush that buffer before we exit. So do a
  // dummy write and exit when that dummy write is flushed so that we know that
  // everything before it has been flushed too and we don't truncate our output.
  process.stdout.write('', () => {
    process.exit(0);
  });
}

void main();
