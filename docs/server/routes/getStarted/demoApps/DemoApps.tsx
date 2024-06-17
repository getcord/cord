/** @jsxImportSource @emotion/react */

import Page from 'docs/server/ui/page/Page.tsx';
import {
  DemoAppCard,
  DemoAppCardSubtitle,
  DemoAppCardTitle,
} from 'docs/server/routes/getStarted/demoApps/DemoAppCard.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

function DemoApps() {
  return (
    <Page
      pretitle="Get started"
      pretitleLinkTo="/get-started"
      title="Demo apps"
      pageSubtitle={`
        We integrated Cord components in a few common application types. Click
        on the cards below to see how we have added collaboration in these
        example use cases.`}
    >
      <div
        css={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gap: 24,
          [breakpoints.mobile]: { gridTemplateColumns: 'auto' },
        }}
      >
        <DemoAppCard href="/get-started/demo-apps/document">
          <img
            src="/static/images/document-demo-app-thumbnail.png"
            alt="A colorful representation of a document-based web application"
          />
          <DemoAppCardTitle>Document</DemoAppCardTitle>
          <DemoAppCardSubtitle>
            Comment and annotate anywhere in a document
          </DemoAppCardSubtitle>
        </DemoAppCard>
        <DemoAppCard href="/get-started/demo-apps/dashboard">
          <img
            src="/static/images/dashboard-demo-app-thumbnail.png"
            alt="A colorful representation of a data dashboard web application"
          />
          <DemoAppCardTitle>Dashboard</DemoAppCardTitle>
          <DemoAppCardSubtitle>
            Comment and annotate charts, graphs and cells
          </DemoAppCardSubtitle>
        </DemoAppCard>
        <DemoAppCard href="/get-started/demo-apps/canvas-new">
          <img
            src="/static/images/canvas-demo-app-thumbnail.png"
            alt="A colorful representation of a canvas web application"
          />
          <DemoAppCardTitle>Interactive Canvas</DemoAppCardTitle>
          <DemoAppCardSubtitle>
            Comment and annotate anywhere in your canvas
          </DemoAppCardSubtitle>
        </DemoAppCard>
        <DemoAppCard href="/get-started/demo-apps/video-player">
          <img
            src="/static/images/video-player-demo-app-thumbnail.png"
            alt="A colorful representation of a video player"
          />
          <DemoAppCardTitle>Video player</DemoAppCardTitle>
          <DemoAppCardSubtitle>
            Comment and annotate on a video
          </DemoAppCardSubtitle>
        </DemoAppCard>
      </div>
      <H4>Put a Cord thread on any page!</H4>
      <p>
        To very quickly see how the Cord thread looks on any page,{' '}
        <strong>open your browser's JavaScript console</strong> and paste in the
        following code:
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'javascript',
            languageDisplayName: 'JavaScript',
            snippet: `// Add Cord SDK to the page
const script = document.createElement('script');
script.src = 'https://app.cord.com/sdk/v1/sdk.latest.js';
// Wait for the script to load to initialize Cord
script.addEventListener('load', () => {
  window.CordSDK.init({
    client_auth_token: '<CLIENT_AUTH_TOKEN>',
  });
  // Create a cord-thread and add it to the page
  const thread = document.createElement('cord-thread');
  thread.setAttribute('thread-id', \`my-awesome-thread-id-\${crypto.randomUUID()}\`);
  thread.setAttribute('group-id', 'my-first-group');
  // Use the new version of Cord components, which are fully CSS customizable
  thread.setAttribute('use-shadow-root', false);
  // Style the cord-thread, to make it always visible on the page
  thread.style.position = 'fixed'; 
  thread.style.top = '45%'; 
  thread.style.left = '10%'; 
  thread.style.width = '350px';
  thread.style.zIndex = 2;
  document.body.appendChild(thread);
});
document.body.appendChild(script);`,
          },
        ]}
      />
      <HR />
      <NextUp>
        <NextUpCard
          title="Live CSS editor"
          linkTo="/get-started/live-css-editor"
        >
          Wondering how our components would look in your app styles?"
        </NextUpCard>
        <NextUpCard
          title="Build your integration"
          linkTo="/get-started/integration-guide"
        >
          Integrate Cord components with your app
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default DemoApps;
