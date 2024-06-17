#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';
import yargs from 'yargs';

async function main() {
  await yargs()
    .command(
      '* <results_file>',
      false,
      () => {},
      async (argv) => {
        const inputStream = fs.createReadStream(argv.results_file, 'utf-8');
        const rl = readline.createInterface({
          input: inputStream,
          crlfDelay: Infinity,
        });
        const time_until_data_ms = new Map();
        for await (const line of rl) {
          const point = JSON.parse(line);
          if (point.type === 'Point' && point.metric === 'time_until_data_ms') {
            const tag = point.data.tags.operationName;
            if (tag) {
              if (!time_until_data_ms.has(tag)) {
                time_until_data_ms.set(tag, []);
              }
              time_until_data_ms.get(tag).push(point.data.value);
            }
          }
        }

        const points = [];
        for (const op of time_until_data_ms.keys()) {
          points.push([
            op,
            Math.round(
              time_until_data_ms.get(op).reduce((a, b) => a + b, 0) /
                time_until_data_ms.get(op).length,
            ),
            time_until_data_ms.get(op).length,
          ]);
        }
        points.sort((a, b) => b[1] - a[1]);
        for (const point of points) {
          console.log(`${point[0]}: ${point[1]} (${point[2]})`);
        }
      },
    )
    .parse(process.argv.slice(2));
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
