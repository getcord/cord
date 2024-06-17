/** @jsxImportSource @emotion/react */

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { App } from 'docs/server/routes/getStarted/liveCSSEditor/App.tsx';

function LiveCSSEditor() {
  return (
    <Page
      pretitle="Get started"
      pretitleLinkTo="/get-started"
      title="Live CSS Editor"
      pageSubtitle="Try interacting with our live thread. Customize the CSS
        variables to match the theme of your app."
    >
      <EmphasisCard>
        <div css={{ display: 'flex', gap: 16 }}>
          <img src="/static/images/figma-logo.svg" alt="Figma's logo" />
          <p>
            <a href="https://www.figma.com/community/file/1123189365180813478">
              Clone our Figma templates
            </a>{' '}
            to use our components in your designs
          </p>
        </div>
      </EmphasisCard>

      <App />
    </Page>
  );
}

export default LiveCSSEditor;
