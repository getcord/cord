/** @jsxImportSource @emotion/react */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { composerClassnamesDocs } from 'external/src/components/ui3/composer/Composer.classnames.ts';
import { experimental } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';
import ReplacementsList from 'docs/server/ui/replacementsList/replacementsList.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import { ThreadsLiveDemoExamples } from 'docs/server/routes/components/threads/ThreadsLiveDemoExample.tsx';
import { useThreads } from '@cord-sdk/react/hooks/thread.ts';
import GithubLink from 'docs/server/ui/GithubLink.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { addReplaceProp } from 'docs/server/ui/replacementCard/addReplaceProp.ts';

const components = [
  {
    name: 'ThreadsLayout',
    cordClass: 'cord-threads',
    description: 'The container of all the threads.',
  },
  {
    name: 'InlineThread',
    cordClass: 'cord-inline-thread',
    description: 'Each one of the threads in the list.',
  },
  {
    name: 'InlineThreadCollapsedLayout',
    cordClass: 'cord-inline-thread.cord-collapsed',
    description:
      'The container of a collapsed inline thread. Includes the first message, and a button to expand it.',
  },
  {
    name: 'InlineThreadExpandedLayout',
    cordClass: 'cord-inline-thread.cord-expanded',
    description:
      'The container of an expanded inline thread. Includes the first message, a button to collapse it, the replies if any, and an inline composer.',
  },
  {
    name: 'InlineComposer',
    cordClass: 'cord-inline-composer',
    description: 'The composer to reply to a thread.',
  },
];

export function Threads4() {
  const properties = useMemo(() => {
    return addReplaceProp(
      'threads',
      apiData.react.betaV2.ThreadsProps.properties,
    );
  }, []);

  const threadsByOptionsProperties = useMemo(() => {
    return addReplaceProp(
      'thread',
      apiData.react.betaV2.ThreadsByOptionsProps.properties,
    );
  }, []);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Threads"
      pageSubtitle="See a list of threads, and reply to existing ones"
      showTableOfContents
    >
      <BetaComponentWarning />
      <section>
        <ThreadsLiveDemoExamples />
      </section>
      <section>
        <H2>When to use</H2>
        <p>
          The <code>Threads</code> component renders a collection of threads, to
          which you can reply.
        </p>
      </section>
      <section>
        <H2>How to use</H2>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { betaV2, thread } from "@cord-sdk/react";
  
  function ExampleThreads() {
    const threadsData = thread.useThreads();
    // If you need to modify the list of threads, this is the place to do it

    return <betaV2.Threads
      threadsData={threadsData}
      style={{
        // Recommended so that the component doesn't grow too tall
        maxHeight: "400px", 
        // Recommended so that the component doesn't stretch horizontally 
        // based on their content
        width: "300px",
      }}
    />;
  }`,
            },
          ]}
        />
        <p>
          Alternatively, you can use <code>Thread.ByOptions</code> to render
          threads based on{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreads#options">
            ObserveThreadOptions
          </Link>
          . We'll do the data fetching for you.
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

function ExampleResolvedThreads() {
  return (
    <betaV2.Threads.ByOptions
      options={{ filter: { resolvedStatus: 'resolved' } }}
      style={{
        // Recommended so that the component doesn't grow too tall
        maxHeight: "400px", 
        // Recommended so that the component doesn't stretch horizontally 
        // based on their content
        width: "300px",
      }}
    />
  );
};`,
            },
          ]}
        />
        <p>
          <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/canary/threads/Threads.tsx" />
        </p>
      </section>
      <HR />
      <section>
        <H2>Properties</H2>
        <H3>{`<Threads>`}</H3>
        <SimplePropertiesList level={3} properties={properties} />
        <H3>{`<Threads.ByOptions>`}</H3>
        <SimplePropertiesList
          level={3}
          properties={threadsByOptionsProperties}
        />
      </section>
      <HR />
      <section>
        <H2>Customization with Replacements</H2>
        <ThreadsReplacementCard />
        <p>
          If you want to customize your component, you can customize the CSS
          (see below), but you can also switch parts of the component for your
          own ones with out{' '}
          <a href="/customization/custom-react-components">Replacements API</a>.
        </p>
        <p>
          These are the components you can replace in Threads. Some are better
          understood in context. We suggest inspecting the component with your
          browser's developer tools to find elements with a{' '}
          <code>data-cord-replace</code> attribute.
        </p>
        <ReplacementsList components={components} />
      </section>
      <section>
        <H2>CSS customization</H2>
        <CSSClassNameListExplain />
        <p>
          There are more classes that are best understood in context. We suggest
          inspecting the component with your browser's developer tools to view
          everything. You can target any classes starting with{' '}
          <code>cord-</code>.
        </p>
        <CSSClassNameList classnames={composerClassnamesDocs} />
      </section>
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

function ThreadsReplacementCard({
  hideReplacements,
}: {
  hideReplacements?: boolean;
}) {
  const threadsData = useThreads();

  return (
    <ReplacementCard
      components={components}
      hideReplacements={hideReplacements}
    >
      <experimental.Threads
        threadsData={threadsData}
        style={{
          maxHeight: 400,
          width: 300,
        }}
      />
    </ReplacementCard>
  );
}
