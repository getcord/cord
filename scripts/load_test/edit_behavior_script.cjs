#!/usr/bin/env node

// This script edits a loadtest behavior script in various ways.

const fs = require('fs');
const yargs = require('yargs');

function main() {
  const argv = yargs()
    .option('r', {
      alias: 'remove',
      type: 'array',
      desc: 'IDs of messages to remove',
      default: [],
      coerce: (x) =>
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        x.flatMap((x) =>
          x
            .toString()
            .split(',')
            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            .filter((x) => !!x),
        ),
    })
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    .check((argv) => {
      if (argv._.length > 1) {
        throw new Error('Cannot specify more than one input file');
      }
      if (argv._.length && !argv._[0].toLowerCase().endsWith('.json')) {
        throw new Error('Input file must be a .json file');
      }
      if (argv.remove.includes(NaN)) {
        throw new Error('Only numbers can be used for removal IDs');
      }
      return true;
    })
    .showHelpOnFail(false)
    .parse(process.argv.slice(2));

  // Read the specified file, or stdin (fd 0) if none
  let data = JSON.parse(
    fs.readFileSync(argv._.length ? argv._[0] : 0, 'utf-8'),
  );
  data = data.filter((x) => !argv.remove.includes(x.dataParsed.id));
  let nextId = 1;
  const idMap = new Map();
  for (const message of data) {
    if (!message.dataParsed.id) {
      continue;
    }
    if (!idMap.has(message.dataParsed.id)) {
      idMap.set(message.dataParsed.id, nextId.toString());
      nextId++;
    }
    message.dataParsed.id = idMap.get(message.dataParsed.id);
  }

  console.log(JSON.stringify(data, null, 2));
}

main();
