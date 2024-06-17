import 'source-map-support/register.js';

// Import all stacks. (A side effect of importing is that `define` is called
// with functions returning all resource definitions. The code at the end of
// this file makes sure that all those functions are invoked.
//
// eslint-disable-next-line no-restricted-imports
import './src/**/*.ts';
import { invokeAllDefinitions } from 'ops/aws/src/common.ts';

async function main() {
  await invokeAllDefinitions();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
