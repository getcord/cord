/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ThreadList } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordThreadList() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Thread List"
      pageSubtitle="Display all the threads in a given location"
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          <ThreadList
            location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveThreadList }}
            style={{ width: 300 }}
          />
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>ThreadList</code> component renders the list of threads
            created with a given location (see the <code>location</code>{' '}
            property in the <code>Thread</code>
            component). It provides a quick way for users to view multiple
            conversations.
          </p>
          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-thread">Thread</Link> →
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
                snippet: `import { ThreadList } from "@cord-sdk/react";

export const Example = () => {
  return (
    <ThreadList
      location={{ "page": "index" }}
      onThreadClick={(threadId, threadSummary) =>
        console.log("user clicked on thread:", threadId, threadSummary)
      }
      style={{ width: "300px" }}
    />
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-thread-list location='{ "page": "index" }' style="width: 300px;"></cord-thread-list>
              `,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <PropertiesList
            savePreferenceFor="client"
            properties={{
              [ClientLanguageDisplayNames.REACT]: {
                propertyOrder: [
                  'location',
                  'showScreenshotPreviewInMessage',
                  'showPlaceholder',
                  'highlightOpenFloatingThread',
                  'highlightThreadId',
                  'filter',
                  'partialMatch',
                  'onThreadClick',
                  'onLoading',
                  'onRender',
                  'onThreadMouseEnter',
                  'onThreadMouseLeave',
                  'onThreadResolve',
                  'onThreadReopen',
                ],
                required: [],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) of a Thread
List controls which threads it should show.

If unset, this field will default to the current URL for
the page.`,
                  },
                  showScreenshotPreviewInMessage: {
                    type: 'boolean',
                    description: `Toggles whether screenshot previews are shown in
  messages in the Thread List. The default setting is set to \`true\`.`,
                  },
                  showPlaceholder: {
                    type: 'boolean',
                    description: `If \`false\`, when the thread list has no threads, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of threads a user will see.

The default value is \`true\`.`,
                  },
                  highlightOpenFloatingThread: {
                    type: 'boolean',
                    description: `Toggles whether, if there is a FloatingThread component at the same location, opening a thread should highlight that thread in the ThreadList.  The color of the highlight is configurable with CSS.  The default setting is set to \`true\`.
                  If <code>highlightThreadId</code> is passed in, it will disable
                  <code>highlightOpenFloatingThread</code>.`,
                  },
                  highlightThreadId: {
                    type: 'string',
                    description: `Passing a thread id will highlight that thread in the ThreadList if it exists. The color of the highlight is configurable with CSS. If <code>highlightThreadId</code> is used,
                  it will disable <code>highlightOpenFloatingThread</code>.`,
                  },
                  filter: {
                    type: 'ThreadListFilter',
                    description: `A serialized JSON object that can be used to filter the threads in the <code>ThreadList</code>.`,
                    properties: {
                      metadata: {
                        description:
                          'The value for a `metadata` entry should be an object representing the metadata key/value to filter on.  For example, to show only threads with the metadata key of `"category"` set to `"sales"`, set the filter to `{ metadata: { category: "sales" } }`.',
                        type: 'EntityMetadata',
                      },
                      groupID: {
                        description:
                          'Only load threads from a specified group.',
                        type: 'string',
                      },
                    },
                    propertyOrder: ['metadata', 'groupID'],
                    required: [],
                  },
                  partialMatch: {
                    type: 'boolean',
                    description: `If \`false\`, only threads that exactly match the provided [location](/reference/location) are shown. If \`true\`, threads in any [partially matching location](/reference/location#Partial-Matching) are also shown. 

The default value is \`false\`. `,
                  },
                  onThreadClick: {
                    type: 'function',
                    description: `Callback invoked when one of the threads in the list is clicked. The callback is passed two arguments: the ID of the thread which was clicked, and the [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread which was clicked. For example, you could use this event to scroll the clicked thread into view.`,
                  },
                  onLoading: {
                    type: 'function',
                    description: `Callback invoked when the component begins
loading. Use \`onRender\` to determine when loading is complete.`,
                  },
                  onRender: {
                    type: 'function',
                    description: `Callback invoked when the component has finished
rendering. Use \`onLoading\` to determine when a component begins loading.`,
                  },
                  onThreadMouseEnter: {
                    type: 'function',
                    description: `Callback invoked when one of the threads fires a \`mouseenter\` event.
                  The callback is passed two arguments: the threadID of the thread and an object of type \`{thread: ThreadSummary}\` containing the thread [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).
                  For example, you could use this event to highlight the section of a webpage being discussed in the hovered thread.`,
                  },
                  onThreadMouseLeave: {
                    type: 'function',
                    description: `Callback invoked when the cursor leaves one of the threads.
                  The callback is passed two arguments: the threadID of the thread and an object of type \`{thread: ThreadSummary}\` containing the thread [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).
                  For example, you could use this event to terminate the special behavior initiated with \`onThreadMouseEnter\`.`,
                  },
                  onThreadResolve: {
                    type: 'function',
                    description: `Callback invoked when one of the threads fires a \`resolved\` event.
                  The callback is passed an object of type \`{threadID: string; thread: ThreadSummary}\` containing the thread's ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).
                  For example, you could use this event to remove the visibility of a thread when it's marked as resolved`,
                  },
                  onThreadReopen: {
                    type: 'function',
                    description: `Callback invoked when the cursor leaves one of the threads.
                  The callback is passed an object of type \`{threadID: string; thread: ThreadSummary}\` containing the thread's ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).
                  For example, you could use this event to terminate the special behavior initiated with \`onThreadResolve\`.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'location',
                  'show-screenshot-preview-in-message',
                  'show-placeholder',
                  'highlight-open-floating-thread',
                  'highlight-thread-id',
                  'filter',
                  'partial-match',
                  'cord-thread-list:threadclick',
                  'cord-thread-list:loading',
                  'cord-thread-list:render',
                  'cord-thread-list:threadmouseenter',
                  'cord-thread-list:threadmouseleave',
                  'cord-thread-list:threadresolve',
                  'cord-thread-list:threadreopen',
                ],
                required: [],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) of a Thread
List controls which threads it should show.

If unset, this field will default to the current URL for
the page.`,
                  },
                  'show-screenshot-preview-in-message': {
                    type: 'boolean',
                    description: `Toggles whether screenshot previews are shown in
                messages in the Thread List. The default setting is set to \`true\`.`,
                  },
                  'show-placeholder': {
                    type: 'boolean',
                    description: `If \`false\`, when the thread list has no threads, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of threads a user will see.

The default value is \`true\`.`,
                  },
                  'highlight-open-floating-thread': {
                    type: 'boolean',
                    description: `Toggles whether, if there is a FloatingThread component at the same location, opening a thread should highlight that thread in the ThreadList.  The color of the highlight is configurable with CSS.  The default setting is set to \`true\`.`,
                  },
                  'highlight-thread-id': {
                    type: 'string',
                    description: `Passing a thread id will highlight that thread in the ThreadList if it exists. The color of the highlight is configurable with CSS. If <code>highlight-thread-id</code> is used,
                  it will disable <code>highlight-open-floating-thread</code>.`,
                  },
                  filter: {
                    type: 'ThreadListFilter',
                    description: `A serialized JSON object that can be used to filter the threads in the <code>ThreadList</code>.`,
                    properties: {
                      metadata: {
                        description:
                          'The value for a `metadata` entry should be an object representing the metadata key/value to filter on.  For example, to show only threads with the metadata key of `"category"` set to `"sales"`, set the filter to `{ metadata: { category: "sales" } }`.',
                        type: 'EntityMetadata',
                      },
                      groupID: {
                        description:
                          'Only load threads from a specified group.',
                        type: 'string',
                      },
                    },
                    propertyOrder: ['metadata', 'groupID'],
                    required: [],
                  },
                  'partial-match': {
                    type: 'boolean',
                    description: `If \`false\`, only threads that exactly match the provided [location](/reference/location) are shown. If \`true\`, threads in any [partially matching location](/reference/location#Partial-Matching) are also shown. 

The default value is \`false\`. `,
                  },
                  'cord-thread-list:threadclick': {
                    type: 'event',
                    description: `This event is fired when one of the threads in
the list is clicked. The event.detail[0] is the thread-id of the clicked thread,
and event.detail[1] is its [thread summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).
For example, you could use this event to scroll into view of the clicked thread.`,
                  },
                  'cord-thread-list:loading': {
                    type: 'event',
                    description: `This event is fired when the component begins
loading. Listen for \`cord-thread-list:render\` to determine when loading is complete.`,
                  },
                  'cord-thread-list:render': {
                    type: 'event',
                    description: `This event is fired when the component has
finished rendering. Listen for \`cord-thread-list:loading\` to determine when a
component begins loading.`,
                  },
                  'cord-thread-list:threadmouseenter': {
                    type: 'event',
                    description: `This event is fired when one of the threads in
the list fires a \`mouseenter\` event. The \`event.detail[0]\` is the \`thread-id\`
of the hovered thread and \`event.detail[1]\` is an object containing the thread [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) \`{thread: ThreadSummary}\`.
For example, you could use this event to highlight the section of a webpage being discussed in the hovered thread.`,
                  },
                  'cord-thread-list:threadmouseleave': {
                    type: 'event',
                    description: `This event is fired when one of the threads in
the list fires a \`mouseleave\` event. The \`event.detail[0]\` is the \`thread-id\`
of the hovered thread and \`event.detail[1]\` is an object containing the thread [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) \`{thread: ThreadSummary}\`.
For example, you could use this event to terminate the special behavior initiated with \`cord-thread-list:threadmouseenter\`.`,
                  },
                  'cord-thread-list:threadresolve': {
                    type: 'event',
                    description: `This event is fired when a user resolves one of the threads in the list. 
                  The \`event.detail[0]\` is an object of type \`{threadID: string; thread: ThreadSummary}\` which contains the thread's ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) `,
                  },
                  'cord-thread-list:threadreopen': {
                    type: 'event',
                    description: `This event is fired when a user reopens one of the resolved threads in the list. 
                  The \`event.detail[0]\` is an object of type \`{threadID: string; thread: ThreadSummary}\` which contains the thread's ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) `,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <CSSCustomizationLinkCard />
        <HR />
        <NextUp>
          <NextUpCard title="Thread" linkTo="/components/cord-thread">
            Display a conversation anywhere on your page
          </NextUpCard>
          <NextUpCard title="Inbox" linkTo="/components/cord-inbox">
            Find all messages relevant to you, in one handy place
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordThreadList;
