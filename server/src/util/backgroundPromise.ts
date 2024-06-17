import type { Logger } from 'server/src/logging/Logger.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

const backgroundPromises = new Set<Promise<unknown>>();

/**
 * Track a promise that we don't need to immediately await on, but do want to
 * make sure *eventually* finishes before server shutdown or test end or
 * similar. Calling `waitForEmptyBackground` will make sure that all of these
 * promises, as well as any that they (recursively) call into this function
 * with, are resolved.
 *
 * Generally prefer this to just a floating promise, so we at least have *some*
 * mechanism to keep track of it!
 */
export function backgroundPromise(p: Promise<unknown>, _logger?: Logger) {
  backgroundPromises.add(p);
  p.catch((e) => {
    const logger = _logger ?? anonymousLogger();
    logger.logException(`Error resolving background promise`, e);
  }).finally(() => {
    backgroundPromises.delete(p);
  });
}

/**
 * Wait until all promises added to `backgroundPromise` are resolved, as well as
 * any that they add (recursively).
 */
export async function waitForEmptyBackground() {
  while (backgroundPromises.size > 0) {
    await Promise.all(backgroundPromises);

    // Give the `.then` above a chance to run and remove the promise from the
    // set. Empirically this doesn't seem to be necessary, but not sure if that
    // is accidentally relying on non-contractual behaviour of `.then`, and this
    // is simple and can't hurt.
    await new Promise(process.nextTick);
  }
}
