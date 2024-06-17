#!/usr/bin/env -S node -r dotenv/config

// Copy the line above into your `tools/*.ts` files to make the build output
// executable. This example tool can thus be invoked by simply calling
// `dist/tools/example.js` from your terminal.
// Thanks to the `-r dotenv/config` option above, this tool will parse your
// `.env` file. Any module using the environment configuration will work
// normally.

// Our esbuild process will expose the name of the script as
// `BUILDCONSTANTS.loggingProcessName`. The following line declares the
// availability of that constant to TypeScript, so TypeScript won't throw
// errors if you use it.
declare const BUILDCONSTANTS: { loggingProcessName: string };

// Importing modules from the server code base works just as expected.
import env from 'server/src/config/Env.ts';

console.log('This is an example tool.');

// `BUILDCONSTANTS.loggingProcessName` will evaluate as `tools/example`
console.log(
  `BUILDCONSTANTS.loggingProcessName = ${BUILDCONSTANTS.loggingProcessName}`,
);

// Print out the `env` object
console.log('env =', env);
