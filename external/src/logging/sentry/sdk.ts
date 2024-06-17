import * as Sentry from '@sentry/react';

import { initSentryImpl } from 'external/src/logging/sentry/common.ts';

export const initSentry = () =>
  initSentryImpl(Sentry.init, {
    integrations: function (integrations) {
      // Eliminate these default Sentry integrations, all of which wrap
      // browser APIs to log their calls to sentry.  We don't want to do that,
      // as they will catch customer calls to those functions and make them
      // lose their stack traces, etc.
      return integrations.filter(
        (integration) =>
          // Wraps console, XHR, fetch, history, etc.
          integration.name !== 'Breadcrumbs' &&
          // Registers global onError and onUnhandledRejectionHandler
          integration.name !== 'GlobalHandlers' &&
          // Wraps setTimeout, setInterval, and many event handler-related
          // objects
          integration.name !== 'TryCatch',
      );
    },
  });
