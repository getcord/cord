/** @jsxImportSource @emotion/react */

import { useContext } from 'react';

import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { Message3 } from 'docs/server/routes/components/Message/Message3.tsx';
import { Message4 } from 'docs/server/routes/components/Message/Message4.tsx';
import { VersionContext } from 'docs/server/App.tsx';

export default function CordMessage() {
  const { version } = useContext(VersionContext);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Message"
      pageSubtitle={`Put messages wherever you want. Don't worry, we'll handle reactions, as well as deleted, editing and unread states for you!`}
      showTableOfContents={true}
    >
      {version === '2.0' ? <Message4 /> : <Message3 />}
      <HR />
      <NextUp>
        <NextUpCard title="Thread" linkTo={'/components/cord-thread'}>
          Render a single conversation thread
        </NextUpCard>
        <NextUpCard title="Thread API" linkTo={'/js-apis-and-hooks/thread-api'}>
          Fetch data for a particular location or thread ID
        </NextUpCard>
      </NextUp>
    </Page>
  );
}
