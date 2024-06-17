/** @jsxImportSource @emotion/react */

import type { ReactElement } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';
import { Helmet } from 'react-helmet';
import type { HelmetData } from 'react-helmet';

export const renderPage = (comp: ReactElement, embeddingMode = false) => {
  const key = 'cord';
  const cache = createCache({ key });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer.default(cache);

  let html = ReactDOMServer.renderToString(
    <CacheProvider value={cache}>{comp}</CacheProvider>,
  );

  if (!embeddingMode) {
    const chunks = extractCriticalToChunks(html);
    const styles = constructStyleTagsFromChunks(chunks);
    html = html.replace('</head>', styles + '</head>');
  }

  const head = Helmet.renderStatic();
  let itemName: keyof HelmetData;
  const headBits: string[] = [];
  for (itemName in head) {
    headBits.push(head[itemName].toString());
  }
  if (headBits.length) {
    html = html.replace('</head>', headBits.join('') + '</head>');
  }

  return `<!DOCTYPE html>${html}`;
};
