#!/usr/bin/env node

// This script converts a client-side GraphQL query from a .graphql query file
// into a JSON object that's appropriate to send to the /gql endpoint to issue
// that query.  This is handy for testing the performance of a query,
// particularly if you want to compare different implementations.

// Known limitations:
// * No variables

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

function parseGraphQL(f) {
  const contents = fs.readFileSync(f, 'utf-8');
  return contents
    .split('\n')
    .map((line) => (line.startsWith('#import') ? replaceImport(f, line) : line))
    .join('\n');
}

function replaceImport(f, line) {
  const importedPath = line.substring('#import '.length).trim();
  return parseGraphQL(path.resolve(path.dirname(f), importedPath));
}

function main() {
  yargs()
    .command(
      '* <graphql_file>',
      false,
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (yargs) => {
        return yargs.check((argv) => {
          if (!argv.graphql_file.toLowerCase().endsWith('.graphql')) {
            throw new Error(`graphql_file must be a .graphql file`);
          }
          return true;
        });
      },
      (argv) => {
        const query = parseGraphQL(argv.graphql_file);
        console.log(
          JSON.stringify({
            variables: {},
            query,
          }),
        );
      },
    )
    .showHelpOnFail(false)
    .parse(process.argv.slice(2));
}

main();
