/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { Helmet } from 'react-helmet';

import { EmbeddingModeContext } from 'docs/server/state/EmbeddingModeProvider.tsx';

interface ChromeProps {
  children: React.ReactNode;
  host: string;
  path: string;
  title?: string;
}

const Chrome = ({ children, path, host, title }: ChromeProps): JSX.Element => {
  const embeddingModeContext = useContext(EmbeddingModeContext);

  const isDevEnv = host.includes('local.cord.com');

  return (
    <html lang="en">
      <head>
        {!embeddingModeContext.embeddingMode && (
          <>
            <Helmet>{title && <title>{title}</title>}</Helmet>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={`${host}${path}`} />
            <meta
              property="og:image"
              content={`${host}/static/images/Docs_OG_Image.jpg`}
            />
            <meta property="og:image:alt" content="Cord Developer Docs" />
            <meta property="og:image:type" content="image/jpeg" />
            <meta property="og:image:height" content="2160" />
            <meta property="og:image:width" content="3840" />
            <link
              rel="apple-touch-icon"
              sizes="152x152"
              href="/static/images/Cord_Icon_purple.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="32x32"
              href="/static/images/Cord_Icon_purple.png"
            />
            <link
              href="/static/css/reset.css"
              rel="stylesheet"
              type="text/css"
            />
            <link
              href="/static/css/chrome.css"
              rel="stylesheet"
              type="text/css"
            />
            {!isDevEnv && <script src="/static/js/analytics.js"></script>}
          </>
        )}
      </head>
      <body className="prevent-scrollbar-hidden">{children}</body>
    </html>
  );
};

export default Chrome;
