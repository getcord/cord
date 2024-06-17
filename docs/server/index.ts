import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as url from 'url';

import express from 'express';
import CookieParser from 'cookie-parser';

import cors from 'cors';
import SearchAPI from 'docs/server/routes/_api/SearchAPI.ts';
import navigation from 'docs/server/navigation.tsx';

// Routes
import {
  staticResource,
  staticResourcePathRegexp,
} from 'docs/server/routes/staticResource/index.ts';
import { SSRPage } from 'docs/server/SSRPage.tsx';
import Sitemap from 'docs/server/routes/sitemap/Sitemap.ts';
import Robots from 'docs/server/routes/robots/Robots.ts';
import { SSRMiniApp } from 'docs/server/SSRMiniApp.tsx';
import makeRedirect from 'docs/lib/redirect.ts';
import Env from 'server/src/config/Env.ts';
import { getHostPortion, parseListenPort } from 'server/src/util/port.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import ThreadObserveLocationSummary from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveLocationSummary.tsx';
import ThreadObserveThread from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveThread.tsx';

const redirects = {
  '/additional': '/reference/browser-support',
  '/annotations': '/js-apis-and-hooks/annotations-api',
  '/annotations/reference': '/js-apis-and-hooks/annotations-api',
  '/annotations/sample-code': '/js-apis-and-hooks/annotations-api',
  '/client': '/js-apis-and-hooks',
  '/client/presence': '/js-apis-and-hooks/presence-api',
  '/components/page-presence': '/components/cord-page-presence',
  '/components/cord-selection-comments': '/components',
  '/concepts': '/reference',
  '/customization/css-variables': '/reference/css-variables',
  '/customization/page-titles': '/customization/add-custom-page-title',
  '/customization/redirect-uri': '/customization/redirect-link',
  '/how-to/custom-s3-bucket': '/customization/s3-bucket',
  '/how-to/custom-redirect-link': '/customization/redirect-link',
  '/how-to/css-customization': '/customization/css',
  '/how-to/add-custom-page-title': '/customization/add-custom-page-title',
  '/how-to/translations': '/customization/translations',
  '/how-to/segment-event-logging': '/customization/segment-event-logging',
  '/how-to/threaded-comments-examples':
    '/customization/threaded-comments-examples',
  '/get-started/demo-apps/dashboard-new': '/get-started/demo-apps/dashboard',
  '/get-started/demo-apps/document-new': '/get-started/demo-apps/document',
  '/get-started/demo-apps/canvas': '/get-started/demo-apps/canvas-new',
  '/guides': '/how-to',
  '/guides/engineer.html': '/how-to',
  // eslint-disable-next-line @cspell/spellchecker -- intentional spelling error to redirect away from
  '/how-to/improve-annotation-accurary': '/how-to/improve-annotation-accuracy',
  '/how-to/library-integrations': '/',
  '/how-to/library-integrations/visx': '/',
  '/in-depth': '/reference',
  '/in-depth/authentication': '/reference/authentication',
  '/in-depth/browser-support': '/reference/browser-support',
  '/in-depth/client-code-lifetime': '/',
  '/in-depth/css-customization': '/customization/css',
  '/in-depth/initialization': '/js-apis-and-hooks/initialization',
  '/in-depth/location': '/reference/location',
  '/js-apis-and-hooks/activity-api': ThreadObserveLocationSummary.uri,
  '/js-apis-and-hooks/react-api': '/js-apis-and-hooks/initialization',
  '/js-apis-and-hooks/thread-api/observeThreadSummary': ThreadObserveThread.uri,
  '/js-apis-and-hooks/thread-api/observeThreadData': ThreadObserveThread.uri,
  '/js-apis-and-hooks/thread-api/observeLocationData':
    '/js-apis-and-hooks/thread-api/observeThreads',
  '/js-apis-and-hooks/thread-api/observeLocationSummary':
    '/js-apis-and-hooks/thread-api/observeThreadCounts',
  '/js-apis-and-hooks/notification-api/observeSummary':
    '/js-apis-and-hooks/notification-api/observeNotificationCounts',
  '/js-apis-and-hooks/notification-api/observeData':
    '/js-apis-and-hooks/notification-api/observeNotifications',
  '/organizations': '/groups',
  '/playground': '/get-started/demo-apps',
  '/quick-start': '/get-started/integration-guide',
  '/quick-start-wip': '/get-started/integration-guide',
  '/react': '/js-apis-and-hooks/initialization',
  '/reference/changelog/how-to/improve-annotation-accuracy':
    '/how-to/improve-annotation-accuracy',
  '/reference/client-js': '/js-apis-and-hooks',
  '/reference/client-js/activity': '/js-apis-and-hooks',
  '/reference/client-js/activity-api': ThreadObserveLocationSummary.uri,
  '/reference/client-js/annotations-api': '/js-apis-and-hooks/annotations-api',
  '/reference/client-js/custom-events': '/',
  '/reference/client-js/notification': '/js-apis-and-hooks/annotations-api',
  '/reference/client-js/notification-api':
    '/js-apis-and-hooks/notification-api',
  '/reference/client-js/notifications':
    '/js-apis-and-hooks/notification-api/observeSummary',
  '/reference/client-js/presence': '/js-apis-and-hooks/presence-api',
  '/reference/client-js/presence-api': '/js-apis-and-hooks/presence-api',
  '/reference/client-js/react-api': '/js-apis-and-hooks/initialization',
  '/reference/concepts': '/reference/identifiers',
  '/reference/initialization': '/js-apis-and-hooks/initialization',
  '/rest': '/rest-apis',
  '/rest/errors': '/rest-apis/errors',
  '/rest/organizations': '/rest-apis/groups',
  '/rest/users': '/rest-apis/users',
  '/reference/rest-api': '/rest-apis',
  '/reference/rest-api/authentication': '/rest-apis/authentication',
  '/reference/rest-api/threads': '/rest-apis/threads',
  '/reference/rest-api/messages': '/rest-apis/messages',
  '/reference/rest-api/users': '/rest-apis/users',
  '/reference/rest-api/organizations': '/rest-apis/groups',
  '/reference/rest-api/batch': '/rest-apis/batch',
  '/reference/rest-api/notifications': '/rest-apis/notifications',
  '/reference/rest-api/applications': '/rest-apis/applications',
  '/reference/rest-api/presence': '/rest-apis/presence',
  '/reference/rest-api/errors': '/rest-apis/errors',
  '/rest-apis/applications': '/rest-apis/projects',
  '/server': '/reference/server-libraries',
  '/server/go': '/reference/server-libraries',
  '/server/java': '/reference/server-libraries',
  '/server/node': '/reference/server-libraries',
  '/v2': '/',
  '/v2/components': '/components',
  '/v2/components/cord-inbox': '/components/cord-inbox',
  '/v2/components/cord-inbox-launcher': '/components/cord-inbox-launcher',
  '/v2/components/cord-page-presence': '/components/cord-page-presence',
  '/v2/components/cord-presence-facepile': '/components/cord-presence-facepile',
  '/v2/components/cord-presence-observer': '/components/cord-presence-observer',
  '/v2/components/cord-sidebar': '/components/cord-sidebar',
  '/v2/components/cord-sidebar-launcher': '/components/cord-sidebar-launcher',
  '/v2/components/cord-thread': '/components/cord-thread',
  '/v2/components/cord-thread-list': '/components/cord-thread-list',
  '/v2/demo-pages': '/get-started/demo-apps',
  '/v3/in-depth/authentication': '/reference/authentication',
  '/rest-apis/organizations': '/rest-apis/groups',
  '/js-apis-and-hooks/user-api/observeOrgMembers':
    '/js-apis-and-hooks/user-api/observeGroupMembers',
  '/get-started/integration-guide/authenticate-your-user':
    '/get-started/integration-guide/cord-account',
  '/get-started/integration-guide/create-an-auth-token':
    '/get-started/integration-guide/generate-an-auth-token',
} as const;

async function main() {
  const port = parseListenPort(Env.DOCS_SERVER_PORT);
  if (!port) {
    anonymousLogger().warn(
      'Docs server not started. Add DOCS_SERVER_PORT to .env!',
    );
    return;
  }

  const app = express();

  app.use(cors({ origin: `https://${Env.AUTH0_CUSTOM_LOGIN_DOMAIN}` }));

  app.enable('trust proxy');

  app.get('/health', (_req, response) => {
    response.statusCode = 200;
    response.end();
  });

  const router = express.Router();
  app.use(express.json({ limit: '100kb' }));
  app.use(CookieParser(Env.DOCS_COOKIE_PARSER_SECRET));
  app.use('/', router);

  console.log('Bootstrapping the server...');

  // Pages
  // Special case -- both "/" and "/get-started" should navigate to same place
  router.get('/get-started', SSRPage);
  for (const navItem of navigation) {
    router.get(navItem.linkTo, SSRPage);
    if (navItem.subnav) {
      for (const subNavItem of navItem.subnav) {
        router.get(subNavItem.linkTo, SSRPage);
        if (subNavItem.subnav) {
          for (const subsubNavItem of subNavItem.subnav) {
            router.get(subsubNavItem.linkTo, SSRPage);
          }
        }
      }
    }
  }

  // One-off
  router.get('/clear-token', SSRPage);

  // Mini apps
  router.get('/components/cord-sidebar-mini-app', SSRMiniApp);
  router.get('/components/cord-sidebar-launcher-mini-app', SSRMiniApp);

  // Demo apps
  router.get(
    '/get-started/demo-apps/:app(document|dashboard|canvas-new|video-player)',
    SSRMiniApp,
  );

  router.get('/sitemap.xml', Sitemap);
  router.get('/robots.txt', Robots);

  // Static resources
  router.get(staticResourcePathRegexp, staticResource);

  // 302s
  for (const [src, dest] of Object.entries(redirects)) {
    router.get(src, makeRedirect(dest));
  }

  // Dead pages
  router.get('/migrating-from-embed', (_, res) => {
    res.status(410);
    res.send('');
  });

  // 404 handler
  router.get(
    '*',
    (_, res, next) => {
      res.status(404);
      next();
    },
    SSRPage,
  );

  // Search endpoint
  router.post('/api/search', SearchAPI);

  const httpServer =
    process.env.NODE_ENV === 'development' && !process.env.IS_TEST
      ? https.createServer(
          {
            key: await fs.promises.readFile(
              path.dirname(url.fileURLToPath(import.meta.url)) +
                '/localhost.key',
            ),
            cert: await fs.promises.readFile(
              path.dirname(url.fileURLToPath(import.meta.url)) +
                '/localhost.crt',
            ),
          },
          app,
        )
      : http.createServer(app);

  // Start our server
  await new Promise<void>((resolve, reject) => {
    httpServer.addListener('error', reject);
    httpServer.addListener('close', resolve);
    httpServer.listen(port, () => {
      httpServer.removeListener('error', reject);
      const host = getHostPortion(httpServer.address());
      anonymousLogger().info(`🚀 Docs server ready at https://${host}/`);
    });
  });
}

main().then(
  () => {
    anonymousLogger().info('Docs server process is terminating normally');
    process.exit(0);
  },
  (err: any) => {
    console.error(err);
    anonymousLogger().error(err);
    process.exit(1);
  },
);
