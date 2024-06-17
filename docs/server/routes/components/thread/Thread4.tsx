/** @jsxImportSource @emotion/react */

import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { betaV2 } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import { LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { addReplaceProp } from 'docs/server/ui/replacementCard/addReplaceProp.ts';
import ReplacementsList from 'docs/server/ui/replacementsList/replacementsList.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import { ThreadLiveDemoExamples } from 'docs/server/routes/components/thread/ThreadLiveDemoExamples.tsx';
import GithubLink from 'docs/server/ui/GithubLink.tsx';

function Thread4() {
  const properties = useMemo(() => {
    return addReplaceProp(
      'thread',
      apiData.react.betaV2.ThreadProps.properties,
    );
  }, []);

  const threadByIDProperties = useMemo(() => {
    return addReplaceProp(
      'thread',
      apiData.react.betaV2.ThreadByIDProps.properties,
    );
  }, []);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Thread"
      pageSubtitle={`Display conversations anywhere in your product`}
      showTableOfContents={true}
    >
      <BetaComponentWarning />
      <section>
        <ThreadLiveDemoExamples />
      </section>
      <section>
        <H2>When to use</H2>
        <p>
          The <code>Thread</code> component renders a single conversation
          thread, or a message composer to create a new thread. Threads contain
          everything your users need to have a conversation.
        </p>
        <p>
          <strong>This component pairs well with:</strong>
        </p>
        <ul>
          <li>
            <Link to="/components/cord-thread-list">Thread List</Link> →
          </li>
          <li>
            <Link to="/components/cord-page-presence">Page Presence</Link> →
          </li>
          <li>
            <Link to="/components/cord-inbox-launcher">Inbox Launcher</Link> →
          </li>
        </ul>
      </section>
      <HR />
      <section>
        <H2>How to use</H2>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { betaV2, thread } from "@cord-sdk/react";
  
  function ExampleThread({threadID}) {
    const threadData = thread.useThread(threadID);
    // If you need to modify some info from your thread, this is the place to do it

    return <betaV2.Thread
      thread={threadData}
      showHeader
      style={{
        // Recommended so that long threads scroll instead 
        //of disappearing off-screen
        maxHeight: "400px", 
        // Recommended so that threads don't stretch horizontally 
        // based on their content
        width: "300px",
      }}
    />;
  }`,
            },
          ]}
        />
        <p>
          Alternatively, you can use <code>Thread.ByID</code> to render a thread
          given its ID. We'll do the data fetching for you.
        </p>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { betaV2 } from "@cord-sdk/react";
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

function ExampleThread({threadID}) {
  return (
    <betaV2.Thread.ByID
      threadID={threadID}
    />
  );
};`,
            },
          ]}
        />
        <p>
          <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/canary/thread/Thread.tsx" />
        </p>
      </section>
      <HR />
      <section>
        <H2>Properties</H2>
        <H3>{`<Thread>`}</H3>
        <SimplePropertiesList level={3} properties={properties} />
        <H3>{`<Thread.ByID>`}</H3>
        <SimplePropertiesList level={3} properties={threadByIDProperties} />
      </section>
      <HR />
      <section>
        <H2>Customization with Replacements</H2>
        <ThreadReplacementCard />
        <p>
          If you want to customize your component, you can customize the CSS
          (see below), but you can also switch parts of the component for your
          own ones with out{' '}
          <a href="/customization/custom-react-components">Replacements API</a>.
        </p>
        <p>
          These are the components you can replace in the message. Some are
          better understood in context. We suggest inspecting the component with
          your browser's developer tools to find elements with a{' '}
          <code>data-cord-replace</code> attribute.
        </p>
        <ReplacementsList components={components} />
        <p>
          If you want to customize the composer, please refer to the section on
          customizing the{' '}
          <Link to="/components/cord-composer#Customization-with-Replacements">
            <code>{`<Composer/>`}</code>
          </Link>
          . If you want to customize the messages shown, see the details in{' '}
          <Link to="/components/cord-message#Customization-with-Replacements">
            <code>{`<Message/>`}</code>
          </Link>
          .
        </p>
      </section>
      <HR />
      <section>
        <H2>CSS customization</H2>
        <p>
          If you want to customize this component, you can target some classes
          with the <code>cord-</code> prefix in your app's CSS. These are
          guaranteed to be stable.
        </p>
        <p>
          These classes are best understood in context. We suggest inspecting
          the component with your browser's developer tools to view everything.
          You can target any classes starting with the prefix <code>cord-</code>
          .
        </p>
      </section>
      <HR />
      <NextUp>
        <NextUpCard title="Composer" linkTo={'/components/cord-composer'}>
          Send messages
        </NextUpCard>
        <NextUpCard title="Thread API" linkTo={'/js-apis-and-hooks/thread-api'}>
          Fetch data for a particular location or thread ID
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Thread4;

const components = [
  {
    name: 'ThreadLayout',
    cordClass: 'cord-thread',
    description: 'The container with all the elements related to a thread.',
  },
  {
    name: 'Message',
    cordClass: 'cord-message',
    description: 'Each one of the messages in the thread.',
  },
  {
    name: 'Composer',
    cordClass: 'cord-composer',
    description: 'The composer to send a message.',
  },
  {
    name: 'Header',
    cordClass: 'cord-thread-header-container',
    description: 'The header of the thread.',
  },
  {
    name: 'ThreadSeenBy',
    cordClass: 'cord-thread-seen-by-container',
    description: 'The list of users who have seen the thread.',
  },
];

function ThreadReplacementCard({
  hideReplacements,
}: {
  hideReplacements?: boolean;
}) {
  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX}${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  if (!threadID) {
    return null;
  }

  return (
    <ReplacementCard
      components={components}
      hideReplacements={hideReplacements}
    >
      <betaV2.Thread.ByID
        showHeader
        threadID={threadID}
        style={{
          maxHeight: 400,
          width: 300,
        }}
      />
    </ReplacementCard>
  );
}
