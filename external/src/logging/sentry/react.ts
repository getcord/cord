import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

import { initSentryImpl } from 'external/src/logging/sentry/common.ts';

export const initSentry = () =>
  initSentryImpl(Sentry.init, {
    integrations: [new BrowserTracing()],
  });
