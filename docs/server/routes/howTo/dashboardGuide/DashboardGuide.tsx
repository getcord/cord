/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import addCommentButtonSnippet from 'docs/server/routes/howTo/dashboardGuide/addCommentButtonSnippet.txt';
import chartMetadataSnippet from 'docs/server/routes/howTo/dashboardGuide/chartMetadataSnippet.txt';
import chartPinWithThreadSnippet from 'docs/server/routes/howTo/dashboardGuide/chartPinWithThreadSnippet.txt';
import chartPinsSnippet from 'docs/server/routes/howTo/dashboardGuide/chartPinsSnippet.txt';
import chartRequestThreadSnippet from 'docs/server/routes/howTo/dashboardGuide/chartRequestThreadSnippet.txt';
import closeThreadOnClickSnippet from 'docs/server/routes/howTo/dashboardGuide/closeThreadOnClickSnippet.txt';
import gridCellRendererSnippet from 'docs/server/routes/howTo/dashboardGuide/gridCellRendererSnippet.txt';
import gridMetadataSnippet from 'docs/server/routes/howTo/dashboardGuide/gridMetadataSnippet.txt';
import gridRequestThreadSnippet from 'docs/server/routes/howTo/dashboardGuide/gridRequestThreadSnippet.txt';
import stopThreadModeSnippet from 'docs/server/routes/howTo/dashboardGuide/stopThreadModeSnippet.txt';
import threadListSnippet from 'docs/server/routes/howTo/dashboardGuide/threadListSnippet.txt';
import threadWrapperSnippet from 'docs/server/routes/howTo/dashboardGuide/threadWrapperSnippet.txt';
import threadsContextSnippet from 'docs/server/routes/howTo/dashboardGuide/threadsContextSnippet.txt';
import threadsProviderSnippet from 'docs/server/routes/howTo/dashboardGuide/threadsProviderSnippet.txt';
import HR from 'docs/server/ui/hr/HR.tsx';

// base url for links to the opensourced dashboard code
const GITHUB_CODE =
  'https://github.com/getcord/demo-apps/tree/42df7b6c2c37c1156679d5aa96117d737d4b0e07/dashboard';

function DashboardGuide() {
  return (
    <Page
      pretitle="How to"
      pretitleLinkTo="/how-to"
      title="Build a dashboard with comments"
      pageSubtitle={{
        metaDescription:
          'Cord allows you to add inline comments to your charts and tables.  This guide will walk you through building our Dashboard sample app.',
        element: (
          <>
            Cord allows you to add inline comments to your charts and tables.
            This guide will walk you through building our{' '}
            <a href="/get-started/demo-apps/dashboard">Dashboard sample app</a>.
          </>
        ),
      }}
      showTableOfContents={true}
    >
      <section>
        <H3>Overview</H3>
        <p>
          This guide will show you how you can use Cord to build a dashboard on
          which users can leave comments. You can play with the final result{' '}
          <a href="/get-started/demo-apps/dashboard">here</a> and find the
          entire code on <a href={GITHUB_CODE}>GitHub</a>. The dashboard was
          built with <a href="https://www.highcharts.com/">Highcharts</a> and{' '}
          <a href="https://www.ag-grid.com/">AG Grid</a> libraries for charts
          and tables, but this guide will focus on Cord related code, providing
          simplified code examples with links to the actual implementation.
        </p>
        <p>
          The dashboard demo app that this guide goes over consists of one chart
          and one table. Users can leave comments on chart's data points or on
          individual cells of the table. The core of this experience is the{' '}
          <Link to="/components/cord-thread">Thread</Link> component that is
          used to start and reply to conversations and the{' '}
          <Link to="/components/cord-pin">Pin</Link> component used to mark
          where these conversations are taking place. The code leverages the{' '}
          <code>metadata</code> field on{' '}
          <Link to="/components/cord-thread">Thread</Link> to store additional
          custom information. In particular, this information identifies the
          point on a chart or cell of a table that each thread belongs. Pins can
          then be placed and clicked on by users to open up the corresponding
          thread.
        </p>
        <p>
          The guide will first go through the code setup that is common for both
          the chart and the table implementation. Then it will talk about the
          code specific to the chart and then the table.
        </p>
      </section>

      <section>
        <H3> Prerequisites </H3>
        <p>
          This guide assumes that you already know how to{' '}
          <Link to="/js-apis-and-hooks/initialization#Installation">
            install
          </Link>{' '}
          and{' '}
          <Link to="/js-apis-and-hooks/initialization#Initialization">
            initialize
          </Link>{' '}
          Cord on your page. It uses React,{' '}
          <a href="https://www.highcharts.com/">Highcharts</a> and{' '}
          <a href="https://www.ag-grid.com/">AG Grid</a> but the concepts
          explained here should be useful even if you use a different framework
          or libraries.
        </p>
      </section>
      <HR />
      <section>
        <H3> General setup </H3>

        <StepByStepGuide>
          <GuideStep>
            <H4> Setup a React context for all thread related information </H4>
            <p>
              We create a context to make the React state related to commenting
              easily available to components that should support the commenting
              functionality. This context stores information such as what
              threads are visible on the current page, which thread is open or
              whether user can start new conversation threads.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: threadsContextSnippet,
                },
              ]}
            />
            <p>
              The corresponding React context provider has code{' '}
              <a href={`${GITHUB_CODE}/src/ThreadsContext.tsx#L77`}>here</a>. It
              mostly consists of basic React <code>useState</code> hooks. The
              main thing to pay attention to is Cord's{' '}
              <Link to="/js-apis-and-hooks/thread-api/observeThreads">
                <code>thread.useLocationData(LOCATION)</code>
              </Link>{' '}
              which fetches threads that exist on <code>LOCATION</code> (current
              page) and also updates in real time when new threads are created.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: threadsProviderSnippet,
                },
              ]}
            />
          </GuideStep>
          <GuideStep>
            <H4> Put a Thread List on the page </H4>
            <p>
              A <Link to="/components/cord-thread-list">ThreadList</Link> shows
              previews of all threads that exist on the page. It is useful for
              users to see all conversations in one place and to quickly
              navigate to them by clicking on the previews.
            </p>
            <p>
              The{' '}
              <a
                href={`${GITHUB_CODE}/src/components/ThreadListButton.tsx#L51`}
              >
                ThreadList in the dashboard app
              </a>{' '}
              highlights the preview of the currently open thread. Also, upon
              clicking one of the previews it updates{' '}
              <code>ThreadsContext.requestToOpenThread</code> to ask the page to
              show the clicked thread.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: threadListSnippet,
                },
              ]}
            />
          </GuideStep>
          <GuideStep>
            <H4>Let user choose when they want to leave comments</H4>
            <p>
              In our dashboard app, clicking on a table cell or chart point
              should only start a conversation if the user is in comment mode.
              Let's{' '}
              <a href={`${GITHUB_CODE}/src/components/Dashboard.tsx#L92`}>
                {' '}
                add a button
              </a>{' '}
              that will toggle whether clicks will leave comments or not.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: addCommentButtonSnippet,
                },
              ]}
            />
            <p>
              It is common to press <code>ESC</code> key when users are done
              leaving new comments on the page. If the user has a conversation
              open, the <code>ESC</code> key press should also close the
              conversation.{' '}
              <a href={`${GITHUB_CODE}/src/components/Dashboard.tsx#L47-L56`}>
                Here is a React effect
              </a>{' '}
              that does both of these things.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: stopThreadModeSnippet,
                },
              ]}
            />
          </GuideStep>
          <GuideStep>
            <H4> Close conversation thread when user clicks elsewhere </H4>
            <p>
              We want a conversation thread to close when the user clicks
              outside of it. This is achieved with a single{' '}
              <code>useEffect</code> hook. You might not need or want this
              behavior so feel free to take it out{' '}
              <a href={`${GITHUB_CODE}/src/components/Dashboard.tsx#L59-L79`}>
                here!
              </a>{' '}
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: closeThreadOnClickSnippet,
                },
              ]}
            />
          </GuideStep>
          <GuideStep>
            <H4> Remove empty conversation threads </H4>
            <p>
              Sometimes users click on a chart or a table cell to start a new
              conversation thread, only to immediately close it without sending
              a message. We{' '}
              <a
                href={`${GITHUB_CODE}/src/components/ThreadWrapper.tsx#L28-L40`}
              >
                remove such threads from the page
              </a>{' '}
              since empty threads only clutter the user experience.
            </p>
            <p>
              You can tell how many messages a thread has using the{' '}
              <Link to="/js-apis-and-hooks/thread-api/observeThreadSummary">
                Thread SDK
              </Link>{' '}
              or <Link to="/components/cord-thread">Thread's</Link>{' '}
              <code>onThreadInfoChange</code> prop.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: threadWrapperSnippet,
                },
              ]}
            />
          </GuideStep>
        </StepByStepGuide>
      </section>
      <HR />
      <section>
        <H3> Adding comments to a chart </H3>
        <p>
          In this section we go over the process of adding commenting
          functionality to a chart. We only show high-level code snippets here,
          but the full code can be found{' '}
          <a href={`${GITHUB_CODE}/src/components/HighchartsExample.tsx`}>
            on Github
          </a>
          . The high-level summary of the code is:
        </p>
        <div>
          <ul>
            <li>
              start new (or open an existing) conversations when user clicks on
              a point on a chart
            </li>
            <li>
              remember the point's x and y coordinates in{' '}
              <Link to="/components/cord-thread">Thread's</Link> metadata
            </li>
            <li>
              position <Link to="/components/cord-pin">Pin</Link> elements over
              the chart based on each{' '}
              <Link to="/components/cord-thread">Thread's</Link> metadata
            </li>
          </ul>
        </div>
        <p>&nbsp;</p>
        <StepByStepGuide>
          <GuideStep>
            <H4> Decide what metadata you need per conversation thread </H4>
            <p>
              Every Cord <Link to="/components/cord-thread">Thread</Link> can
              store additional <code>metadata</code>. We will use this to store
              information that will tell us where to place each each on the
              chart. Our dashboard app allows users to only have conversations
              on individual chart's points and so we store in the metadata:
            </p>
            <div>
              <ul>
                <li> ID of the chart</li>
                <li> ID of the line series</li>
                <li> x-coordinate of the point</li>
                <li> y-coordinate of the point</li>
              </ul>
            </div>
            <p>&nbsp;</p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.TYPESCRIPT,
                  snippet: chartMetadataSnippet,
                },
              ]}
            />
            <p>
              This of course requires that each chart and each line series have
              a unique and stable ID. It does not matter what the IDs are (they
              could be autogenerated UUIDs) as long as they don't change over
              time.
            </p>
          </GuideStep>
          <GuideStep>
            <H4> Choose how you generate Thread IDs</H4>
            <p>
              Every <Link to="/components/cord-thread">Thread</Link> has an ID
              that has to be unique across all your Cord{' '}
              <Link to="/components/cord-thread">Threads</Link>. In the
              dashboard app we want to allow only 1 conversation thread per
              chart point. This can be easily achieved by generating thread IDs
              based on the point they "belong" to. This way even if two users
              start a conversation on the same chart point at the same time,
              their comments will end up in the same thread.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet:
                    'const threadId = `${groupId}_${metadata.chartId}_${metadata.seriesId}_${metadata.x}_${metadata.y}`;',
                },
              ]}
            />
            <p>
              We included <code>group ID</code> in the thread ID in case the
              same chart can be shown to users in different{' '}
              <Link to="/rest-apis/groups">groups</Link>.
            </p>
          </GuideStep>
          <GuideStep>
            <H4> Place conversation Pins over the chart </H4>
            <p>
              With the thread metadata and ID defined, we can finally place
              conversation threads over the chart. We use{' '}
              <Link to="/components/cord-pin">Pin</Link> as a marker where
              conversations have been started. From the{' '}
              <code>ThreadsContext</code> we know the IDs and metadata for all
              threads on the page. Using the metadata and{' '}
              <a href="https://api.highcharts.com/class-reference/Highcharts.Axis#toPixels">
                Highcharts API
              </a>{' '}
              we can use CSS <code>position: absolute</code> to position each
              pin over the chart.
            </p>
            <p>
              Because the chart can change (e.g. axes ranges change) we
              re-render all pins by adding a{' '}
              <a
                href={`${GITHUB_CODE}/src/components/HighchartsExample.tsx#L216`}
              >
                handler for the chart's redraw event
              </a>
              .
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: chartPinsSnippet,
                },
              ]}
            />
            <p>
              Some pins need to be hidden because the chart point they
              correspond to is not visible at the moment. But because Highcharts
              API tells us what series are visible and what the axes' ranges
              are, it is not hard to{' '}
              <a
                href={`${GITHUB_CODE}/src/components/HighchartsExample.tsx#L354`}
              >
                check if a point is displayed
              </a>
              .
            </p>
            <p>
              Finally, when a user clicks on a pin, we show its thread below it
              with absolute positioning, but you can use a library such as{' '}
              <a href="https://floating-ui.com/">floating-ui</a> for more
              complex use cases.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: chartPinWithThreadSnippet,
                },
              ]}
            />
          </GuideStep>
          <GuideStep>
            <H4> Adding new threads </H4>
            <p>
              To start a new thread, we need to register click handlers on the
              elements that users can leave comments on. In our case, when user
              is in commenting mode clicking on a point should start a thread
              (or open an existing thread) on that point. Highcharts API lets us
              register a handler for clicks on a point and all we need to do is
              update the <code>ThreadsContext</code> when that happens. The code
              for this is{' '}
              <a
                href={`${GITHUB_CODE}/src/components/HighchartsExample.tsx#L153`}
              >
                here
              </a>
              .
            </p>
          </GuideStep>
          <GuideStep>
            <H4>Handle requests to open a comment</H4>
            <p>
              Sometimes users want to open a comment in a way other than by
              clicking directly on the pin. One of those ways is by clicking on
              thread previews in{' '}
              <Link to="/components/cord-thread-list">ThreadList</Link>. For
              these cases, the <code>requestToOpenThread</code> variable in{' '}
              <code>ThreadsContext</code> is used. When this variable is set, we
              need to adjust the page to make it possible to show the requested
              thread. The actual code is{' '}
              <a
                href={`${GITHUB_CODE}/src/components/HighchartsExample.tsx#L52`}
              >
                here
              </a>
              , but below is what the code does on a high-level.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: chartRequestThreadSnippet,
                },
              ]}
            />
          </GuideStep>
        </StepByStepGuide>
      </section>
      <HR />
      <section>
        <H3> Adding comments to a table </H3>
        <p>
          In this section we show high-level code needed to add commenting
          functionality to a table. The full code can be found{' '}
          <a href={`${GITHUB_CODE}/src/components/AGGridExample.tsx`}>here</a>,
          but the code boils down to:
        </p>
        <div>
          <ul>
            <li>
              start new (or open an existing) conversation when user clicks on a
              table cell
            </li>
            <li>
              store the cell's row and column IDs in the{' '}
              <Link to="/components/cord-thread">Thread's</Link> metadata
            </li>
            <li>
              add a visual indicator to cells with row and column IDs matching
              the metadata of one of the existing threads
            </li>
          </ul>
        </div>
        <p>&nbsp;</p>
        <StepByStepGuide>
          <GuideStep>
            <H4> Decide what metadata you need per conversation thread </H4>
            <p>
              Every Cord <Link to="/components/cord-thread">Thread</Link> can
              store additional <code>metadata</code>. We will use this to store
              information that will tell us to which cell each thread belongs.
              Our dashboard app allows users to only have conversations on each
              table cell. When a user starts a new conversation on one of the
              cells it is enough to store:
            </p>
            <div>
              <ul>
                <li> ID of the table</li>
                <li> ID of the cell's row</li>
                <li> ID of the cell's column</li>
              </ul>
            </div>
            <p>&nbsp;</p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.TYPESCRIPT,
                  snippet: gridMetadataSnippet,
                },
              ]}
            />
            <p>
              This of course requires that each table row has a unique ID and
              that each column has a unique ID. For example, if your table shows
              a list of customers, then the ID of each row could be the ID of
              the customer and the ID of each column could be the name of the
              displayed customer field (assuming those cannot be renamed).
            </p>
          </GuideStep>
          <GuideStep>
            <H4> Choose how you generate Thread IDs</H4>
            <p>
              Every <Link to="/components/cord-thread">Thread</Link> has an ID
              that has to be unique across all your Cord{' '}
              <Link to="/components/cord-thread">Threads</Link>. In the
              dashboard app we want to allow only 1 conversation thread per each
              table cell. This can be easily achieved by generating thread IDs
              based on the cell they "belong" to. This way even if two users
              start a conversation on the same cell at the same time, their
              comments will end up in the same thread.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet:
                    'const threadId = `{groupId}_${metadata.gridId}_${metadata.rowId}_${metadata.colId}`;',
                },
              ]}
            />
            <p>
              We included <code>group ID</code> in the thread ID in case the
              same table can be shown to users in different{' '}
              <Link to="/rest-apis/groups">groups</Link>.
            </p>
          </GuideStep>
          <GuideStep>
            <H4>Add UI to indicate conversations</H4>
            <p>
              The table library we used in the dashboard, AG Grid, supports
              custom table cell renderers. We use that to add a visual indicator
              to cells that have conversations. We can easily tell which cell
              has a conversation because we know what the thread ID of the
              thread would be if the cell had a conversation.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: gridCellRendererSnippet,
                },
              ]}
            />
            <p>
              The{' '}
              <a href={`${GITHUB_CODE}/src/components/AGGridExample.tsx#L209`}>
                actual code
              </a>{' '}
              also uses{' '}
              <Link to="/components/cord-presence-observer">
                PresenceObserver
              </Link>{' '}
              and{' '}
              <Link to="/components/cord-presence-facepile">
                PresenceFacepile
              </Link>
              . Together they show in real time where each user is pointing
              their cursor which further improves the collaboration experience.
            </p>
            <p>
              When user clicks on a cell with a conversation on it, the
              dashboard opens the corresponding thread. We position the thread
              next to the cell using the common{' '}
              <a href="https://floating-ui.com/">floating-ui</a> library. The
              only extra work we had to handle is{' '}
              <a
                href={`${GITHUB_CODE}/src/components/AGGridExample.tsx#L169-L177`}
              >
                hiding the thread
              </a>{' '}
              when the cell is scrolled out of the view of the table.
            </p>
          </GuideStep>
          <GuideStep>
            <H4> Adding new threads </H4>
            <p>
              To start a new thread, we need to register click handlers on the
              elements that users can leave comments on. In our case, when user
              is in commenting mode clicking on a table cell should start a
              thread (or open existing thread) on that cell. AG Grid API lets us
              register a handler for clicks on cells and all we need to do is
              update the <code>ThreadsContext</code> when that happens. The code
              for this is{' '}
              <a
                href={`${GITHUB_CODE}/src/components/AGGridExample.tsx#L178-L202`}
              >
                here
              </a>
              .
            </p>
          </GuideStep>
          <GuideStep>
            <H4>Handle requests to open a comment</H4>
            <p>
              Sometimes users want to open a comment in a way other than by
              clicking directly on a table cell. One of those ways is by
              clicking on thread previews in{' '}
              <Link to="/components/cord-thread-list">ThreadList</Link>. For
              these cases, the <code>requestToOpenThread</code> variable in{' '}
              <code>ThreadsContext</code> is used. When this variable is set, we
              need to adjust the page to make it possible to show the requested
              thread. The actual code is{' '}
              <a href={`${GITHUB_CODE}/src/components/AGGridExample.tsx#L58`}>
                here
              </a>
              , but below is what the code does on a high-level.
            </p>
            <CodeBlock
              clip={true}
              snippetList={[
                {
                  language: 'tsx',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: gridRequestThreadSnippet,
                },
              ]}
            />
          </GuideStep>
        </StepByStepGuide>
      </section>
    </Page>
  );
}

export default DashboardGuide;
