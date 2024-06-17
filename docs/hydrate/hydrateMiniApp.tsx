/** @jsxImportSource @emotion/react */

import * as ReactDOMClient from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

import MiniApp from 'docs/server/MiniApp.tsx';

const rr = document.getElementById('react-root');
if (!rr) {
  throw new Error('Could not find React root element)');
}
const bilge = document.getElementById('hydration-bilge');
if (!bilge) {
  throw new Error('Could not find React bilge element)');
}
let props = JSON.parse(bilge.dataset.hydrationState || '');
if (!props || typeof props !== 'object') {
  props = {};
}
const cache = createCache({ key: 'cord' });
ReactDOMClient.hydrateRoot(
  rr,
  <CacheProvider value={cache}>
    <BrowserRouter>
      <MiniApp />
    </BrowserRouter>
  </CacheProvider>,
);
