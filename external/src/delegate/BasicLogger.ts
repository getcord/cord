import type { JsonObject } from 'common/types/index.ts';
import type { LogEventFn } from 'external/src/lib/analytics.ts';

type BasicLogFn = (type: string, payload?: JsonObject) => unknown;

/**
A weaker-typed, slimlined version of useLogger. Useful for logic that needs to
run in cross-domain iframes, where logs are passed back to the Delegate before
being sent to the DB.
To make the types work better we do two things:
- Exclude unnecessary log functions, leaving only fns with the same type
- Return Promise unknown, as useLogger fns return response from the mutation
  whereas our pass-back functions return void
 */
export type BasicLogger = {
  logError: BasicLogFn;
  logWarning: BasicLogFn;
  logEvent: LogEventFn;
};
