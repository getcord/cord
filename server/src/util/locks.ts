import { getRedlock } from 'server/src/redis/index.ts';
import type { ThreadMirrorType, UUID } from 'common/types/index.ts';

const LOCK_TTL_MS = 5000;
type CheckAborted = () => void;

/**
 * Execute some asynchronous code non-concurrently by holding a lock.
 *
 * @param lockName the name of the lock that shall be held while executing the
 * given function. Can be a single string or an array of string if multiple
 * locks need to be held.
 * @returns a function that can be called with a single argument `func`. `func`
 * is the function to execute while holding the lock. The `func` may take a
 * single argument named `checkAborted` of type `() => void`. Calling
 * `checkAborted` within `func` will throw an exception if the lock has expired
 * and could not be extended in time. This is a complication due to the
 * distributed nature of the locks. In theory, after any `await` within `func`,
 * the lock may have expired. This is unlikely to happen, as the redlock library
 * will attempt to extend the lock in time before it expires, but this may fail.
 * Following any `await` within `func` you should call this `checkAborted` if
 * you would rather throw an exception at this point in time the lock is no
 * longer held. Often times, though, it may be preferrably to just continue and
 * finish whatever operation is going on, so `checkAborted` should not be
 * called. If, on the other hand, you encapsulate all your database operations
 * inside a transaction, calling `checkAborted` is unproblematic, as throwing an
 * exception will simply roll back the transaction.
 * @returns the return value of the `func`
 */
export function withLock(lockName: string | string[]) {
  const locks: string[] = typeof lockName === 'string' ? [lockName] : lockName;

  return <ReturnType>(
    func: (checkAborted: CheckAborted) => Promise<ReturnType>,
  ) =>
    getRedlock().using(locks, LOCK_TTL_MS, (signal) =>
      func(() => {
        if (signal.aborted) {
          throw signal.error;
        }
      }),
    );
}

export const withSlackMirroredThreadLock = (
  threadID: UUID,
  mirrorType: ThreadMirrorType,
) => withLock(`SlackMirroredThread:${threadID}:${mirrorType}`);
