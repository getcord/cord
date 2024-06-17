import type { BrowserOptions } from '@sentry/browser';

// Our build process replaces `BUILDCONSTANTS.sentryDSN` with either `undefined`
// or a string value for a Sentry DSN
declare const BUILDCONSTANTS: { sentryDSN: undefined | string };

const environment = process.env.SENTRY_ENVIRONMENT;
const release = process.env.SENTRY_RELEASE;
const tracesSampleRate = process.env.SENTRY_TRACE_SAMPLE_RATE;
const dsn = BUILDCONSTANTS.sentryDSN;

export function initSentryImpl(init: any, options: BrowserOptions = {}) {
  if (environment && dsn) {
    init({
      dsn,
      environment,
      release,
      tracesSampleRate: parseFloat(tracesSampleRate ?? '0'),
      normalizeDepth: 10,
      ...options,
    });
  }
}
