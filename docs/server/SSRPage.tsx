/** @jsxImportSource @emotion/react */

import { StaticRouter } from 'react-router-dom/server.js';
import type { Request, RequestHandler, Response } from 'express';

import { renderPage } from 'docs/server/ui/util.tsx';
import Chrome from 'docs/server/ui/Chrome.tsx';
import App from 'docs/server/App.tsx';
import HydrationBilge from 'docs/server/state/HydrationBilge.tsx';
import Env from 'server/src/config/Env.ts';
import EmbeddingModeContextProvider from 'docs/server/state/EmbeddingModeProvider.tsx';

// This is used for both the server-side rendering and for generating
// OpenAI embeddings that we use for docs search.
export const renderDown = ({
  path,
  embeddingMode = false,
  queryParams,
}: {
  path: string;
  embeddingMode?: boolean;
  queryParams?: any;
}) => {
  return renderPage(
    <EmbeddingModeContextProvider embeddingMode={embeddingMode}>
      <Chrome title="Cord Docs" path={path} host={Env.DOCS_SERVER_HOST}>
        <div id="react-root">
          <StaticRouter location={path}>
            <App
              showFooter={!embeddingMode}
              showNav={!embeddingMode}
              queryParams={queryParams}
            />
          </StaticRouter>
        </div>
        <HydrationBilge props={{}} />
      </Chrome>
    </EmbeddingModeContextProvider>,
    embeddingMode,
  );
};

export const SSRPage: RequestHandler = (req: Request, res: Response) => {
  res.send(renderDown({ path: req.path, queryParams: req.query }));
};
