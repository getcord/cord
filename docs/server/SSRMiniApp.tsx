/** @jsxImportSource @emotion/react */

import { StaticRouter } from 'react-router-dom/server.js';

import type { Request, RequestHandler, Response } from 'express';

import { renderPage } from 'docs/server/ui/util.tsx';
import Chrome from 'docs/server/ui/Chrome.tsx';
import { MiniAppHydrationBilge } from 'docs/server/state/HydrationBilge.tsx';
import MiniApp from 'docs/server/MiniApp.tsx';
import Env from 'server/src/config/Env.ts';

export const SSRMiniApp: RequestHandler = (req: Request, res: Response) => {
  // The SSRMiniApp is used for demo apps but also the Sidebar and SidebarLauncher
  // Live Components.  In the latter cases, app will be undefined and so the page
  // title will not be overridden.
  const { app } = req.params;

  res.send(
    renderPage(
      <Chrome title={getTitle(app)} path={req.path} host={Env.DOCS_SERVER_HOST}>
        <div id="react-root">
          <StaticRouter location={req.path}>
            <MiniApp />
          </StaticRouter>
        </div>
        <MiniAppHydrationBilge props={{}} />
      </Chrome>,
    ),
  );
};

function getTitle(app: string) {
  switch (app) {
    case 'document':
      return 'Cord Docs';
    case 'dashboard':
      return 'Cord Dashboard';
    case 'canvas-new':
      return 'Cord Canvas';
    case 'video-player':
      return 'Cord Video Player';
  }

  return undefined;
}
