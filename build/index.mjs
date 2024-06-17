#!/usr/bin/env node

import chokidar from 'chokidar';
import { glob } from 'glob';
import 'dotenv/config.js';
import { argv } from './argv.mjs'; // eslint-disable-line no-restricted-imports
import { refreshVersion } from './util.mjs'; // eslint-disable-line no-restricted-imports
import external from './targets/external.mjs'; // eslint-disable-line no-restricted-imports
import server from './targets/server.mjs'; // eslint-disable-line no-restricted-imports
import asyncWorker from './targets/asyncWorker.mjs'; // eslint-disable-line no-restricted-imports
import admin from './targets/admin.mjs'; // eslint-disable-line no-restricted-imports
import consoleReactApp from './targets/consoleReactApp.mjs'; // eslint-disable-line no-restricted-imports
import repl from './targets/repl.mjs'; // eslint-disable-line no-restricted-imports
import makeScriptTarget from './targets/scripts.mjs'; // eslint-disable-line no-restricted-imports
import docsClient from './targets/docsClient.mjs'; // eslint-disable-line no-restricted-imports
import docsServer from './targets/docsServer.mjs'; // eslint-disable-line no-restricted-imports

async function main() {
  const TARGETS = {
    external,
    server,
    asyncWorker,
    admin,
    consoleReactApp,
    repl,
    docsClient,
    docsServer,
    scripts: [],
  };

  // Add targets for TypeScript files in scripts directory
  const tsScriptGlobs = [
    'scripts/*.ts',
    'scripts/ci/*.ts',
    'scripts/load_test/*.ts',
    'scripts/one_offs/*.ts',
  ];
  const tsScripts = (
    await Promise.all(tsScriptGlobs.map((x) => glob(x, { posix: true })))
  ).flat();
  tsScripts.forEach((path) => {
    const target = makeScriptTarget(path);
    TARGETS[path] = target;
    TARGETS.scripts.push(target);
  });
  const targetNames = argv.target
    ? argv.target
        .split(',')
        .map((target) => target.trim())
        .filter((target) => {
          const exists = target in TARGETS;
          if (!exists) {
            console.warn(`Target ${target} is not defined`);
          }
          return exists;
        })
    : Object.keys(TARGETS).filter((key) => key !== 'scripts');
  const { mode, watch, clean } = argv;

  console.log('Targets:', targetNames);
  console.log('Mode:', mode);

  await Promise.all(
    targetNames.map((name) =>
      buildTarget({ name, target: TARGETS[name], watch, clean }),
    ),
  );
}

async function buildTarget({ name, target, watch, clean }) {
  if (Array.isArray(target)) {
    return Promise.all(
      target.map((t, index) =>
        buildTarget({
          name: `${name}[${index}]`,
          target: t,
          watch,
          clean,
        }),
      ),
    );
  }

  if (clean) {
    await target.clean();
  }

  const label = `Build ${name}${target.name ? ` (${target.name})` : ''}`;

  const build = async () => {
    refreshVersion();
    console.time(label);
    try {
      await target.build();
    } catch (e) {
      console.error(e);
      if (!watch) {
        process.exit(1);
      }
    }
    console.timeEnd(label);
  };

  if (!watch) {
    // watch is false, so we just build once and are done
    return build();
  }

  // We are running in watch-mode!

  // track whether a build is in progress right now
  let building = false;
  // track whether we got notified about a source file change while a build is
  // ongoing
  let changed = false;

  function triggerBuild() {
    if (building) {
      // Build is happening right now. Set changed to true, so when the build
      // has finished, we do another one right away.
      changed = true;
    } else {
      // Start a build
      building = true;

      // ...actually, wait 50ms before we start the build. That's to prevent
      // double builds when we receive several change notifications. If the
      // first starts a build immediately, then the second one would set
      // changed to true, meaning that we'd start a second build right after
      // this one finishes. What we want is when a file change is reported,
      // wait 50ms for any further notifications to come in and then start the
      // build. If a notification comes more than 50ms after the first: fine,
      // then we'll have to a second build immediately after this one
      // finishes.

      new Promise((resolve) => setTimeout(resolve, 50))
        .then(() => {
          changed = false;
          return build();
        })
        .catch(console.error)
        .finally(() => {
          // Build has finished
          building = false;
          // Start another build if sources got changed in the meantime
          if (changed) {
            triggerBuild();
          }
        });
    }
  }

  chokidar.watch(target.watch, { ignoreInitial: true }).on('all', triggerBuild);

  if (!argv.skipInitialBuild) {
    // When in `--watch` mode, the `--skipInitialBuild` option means that we
    // don't build at build script start-up, but only after we detected the
    // first file changes.
    triggerBuild();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
