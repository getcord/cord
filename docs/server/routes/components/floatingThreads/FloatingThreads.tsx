/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { FloatingThreads } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import LiveDemoCardText from 'docs/server/ui/liveDemoCard/LiveDemoCardText.tsx';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';
import { DeprecatedComponentWarning } from 'docs/server/routes/components/Warning/DeprecatedComponentWarning.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordFloatingThreads() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Floating Threads (Deprecated)"
      pageSubtitle={`Leave a comment and start a conversation anywhere on a page`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <DeprecatedComponentWarning componentName="Floating Threads">
          <p>
            To display annotations on a page, we strongly recommend using{' '}
            <Link to="/components/cord-pin">Cord Pins</Link> and{' '}
            <Link to="/components/cord-thread">Cord Threads</Link>.
          </p>
        </DeprecatedComponentWarning>
        <LiveDemoCard>
          <FloatingThreads
            location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveFloatingThreads }}
          />
          <LiveDemoCardText css={{ textAlign: 'center', marginTop: '24px' }}>
            <p>
              Click the button above to enter annotation mode.
              <br />
              Then click anywhere on the page!
            </p>
          </LiveDemoCardText>
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>Floating Threads</code> component allows you to leave a
            comment anywhere on the page. Think of it like the comment mode in
            Figma, for example. It not only provides you with a button to start
            commenting, but also renders all of your existing threads on that
            page.
          </p>
          <p>
            This component renders a single button. Clicking on it will enter
            the comment mode, which allows users to click anywhere on the page
            to add a comment which will stick to that particular element on the
            page. After clicking, a composer will appear right next to where the
            user clicked, allowing them type a message. You can retrieve and
            reply to an existing comment by clicking on the pins on the page.
          </p>
          <p>
            For the best experience with <code>Floating Threads</code>, we
            recommend using the{' '}
            <Link to="/how-to/improve-annotation-accuracy">
              Annotations API
            </Link>
            . This ensures that your users' messages appear in the right place,
            even if other things change on the page. Without using this API, you
            may find that pins disappear.
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
                snippet: `import { FloatingThreads } from "@cord-sdk/react";

export const Example = () => {
  return (
    <FloatingThreads location={{ "page": "index" }} groupId="my-group" />
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<body>
  <div id="header">
    <cord-floating-threads location='{ "page": "index" }' group-id="my-group"></cord-floating-threads>
  </div>
</body>`,
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
                  'groupId',
                  'showButton',
                  'buttonLabel',
                  'iconUrl',
                  'threadName',
                  'showScreenshotPreview',
                  'onStart',
                  'onFinish',
                  'onCancel',
                ],
                required: ['groupId'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) concept for
the floating threads component. It indicates which floating
threads will be rendered on a page, as well as what the
location value of the new floating threads created from that
button will be.

If unset, this field will default to the current URL for
the page.`,
                  },
                  groupId: {
                    type: 'string',
                    description: `The [group](/rest-apis/groups) whose threads the
                  component should load, and in which new threads should be written.`,
                  },
                  showButton: {
                    type: 'boolean',
                    description: `Whether to show the "add comment" button or not.`,
                  },
                  buttonLabel: {
                    type: 'string',
                    description: `The text label on the button. If set to an empty
string, the button will not have a label.

If unset, this value defaults to the string \`Add comment\`.`,
                  },
                  iconUrl: {
                    type: 'string',
                    format: 'url',
                    description: `If provided, changes the URL of the icon. If
set to an empty string or omitted, the button will get the
default comment icon.`,
                  },
                  threadName: {
                    type: 'string',
                    description: `Sets the name of the thread. The thread name is
used in a small number of places where a short name or header
is useful to distinguish the thread; the default value is
nearly always fine. A newly-created thread will have its
title set to this value, but the title of an existing thread
will not be changed.

If this value is not provided, the title of the current page
(\`document.title\`) will be used as a default value.`,
                  },
                  showScreenshotPreview: {
                    type: 'boolean',
                    description: `Toggles whether screenshot previews are shown in the first
message of a Floating Thread. The default setting is set to \`false\`.`,
                  },
                  onStart: {
                    type: 'function',
                    description: `A callback that will be fired when once the page is in comment mode.`,
                  },
                  onFinish: {
                    type: 'function',
                    description: `A callback that will be fired when you leave comment mode with at least one message sent. The callback is passed a single argument of the ID of the created thread.`,
                  },
                  onCancel: {
                    type: 'function',
                    description: `A callback that will be fired when the thread is closed before any message is added.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'location',
                  'group-id',
                  'show-button',
                  'button-label',
                  'icon-url',
                  'thread-name',
                  'show-screenshot-preview',
                  'onstart',
                  'onfinish',
                  'oncancel',
                ],
                required: ['group-id'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) concept for
the floating threads component. It indicates which floating
threads will be rendered on a page, as well as what the
location value of the new floating threads created from that
button will be.

If unset, this field will default to the current URL for
the page.`,
                  },
                  'group-id': {
                    type: 'string',
                    description: `The [group](/rest-apis/groups) whose threads the
                  component should load, and in which new threads should be written.`,
                  },
                  'show-button': {
                    type: 'boolean',
                    description: `Whether to show the "add comment" button or not.`,
                  },
                  'button-label': {
                    type: 'string',
                    description: `The text label on the button. If set to an empty
string, the button will not have a label.

If unset, this value defaults to the string \`Add comment\`.`,
                  },
                  'icon-url': {
                    type: 'string',
                    format: 'url',
                    description: `If provided, changes the URL of the icon. If
set to an empty string or omitted, the button will get the
default comment icon.`,
                  },
                  'thread-name': {
                    type: 'string',
                    description: `Sets the name of the thread. The thread name is
used in a small number of places where a short name or header
is useful to distinguish the thread; the default value is
nearly always fine. A newly-created thread will have its
title set to this value, but the title of an existing thread
will not be changed.

If this value is not provided, the title of the current page
(\`document.title\`) will be used as a default value.`,
                  },
                  'show-screenshot-preview': {
                    type: 'boolean',
                    description: `Toggles whether screenshot previews are shown in the first
message of a Floating Thread. The default setting is set to \`false\`.`,
                  },
                  onstart: {
                    type: 'function',
                    description: `A callback that will be fired when once the page is in comment mode.`,
                  },
                  onfinish: {
                    type: 'function',
                    description: `A callback that will be fired when the thread is closed once it contains at least one message. The callback is passed a single argument of the ID of the created thread.`,
                  },
                  oncancel: {
                    type: 'function',
                    description: `A callback that will be fired when the thread is closed before any message is added.`,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <section>
          <PropertiesList
            headings={{
              [ClientLanguageDisplayNames.REACT]: 'Methods',
              [ClientLanguageDisplayNames.VANILLA_JS]: 'Methods',
            }}
            savePreferenceFor="client"
            properties={{
              [ClientLanguageDisplayNames.REACT]: {
                propertyOrder: ['openThread'],
                required: [],
                properties: {
                  openThread: {
                    type: 'function',
                    description: `This method on the \`<FloatingThreads />\` component
can be used to programmatically open a particular thread.

This function takes one argument, which is an identifier for a thread.

You can use this method by getting a reference to the underlying
\`<cord-floating-threads>\` DOM element:

\`\`\`js
import { useCallback, useRef } from "react";

import {
  CordProvider,
  FloatingThreads,
  ThreadList,
} from "@cord-sdk/react";

const App = () => {
  const floatingThreadsRef = useRef(null);
  const onThreadClickCallback = useCallback(
    (threadID: string, threadSummary: ThreadSummary) => {
      if (!floatingThreadsRef.current) {
        return;
      }

      floatingThreadsRef.current.openThread(threadID);
    },
    []
  );

  return (
    <CordProvider clientAuthToken={cordToken}>
      <ThreadList location={{ page: 'foo' }} onThreadClick={onThreadClickCallback} />
      <FloatingThreads location={{ page: 'foo'}} groupId="my-group" ref={floatingThreadsRef}>
    </CordProvider>
  );
}
\`\`\`
`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: ['openThread'],
                required: [],
                properties: {
                  openThread: {
                    type: 'function',
                    description: `This method on the \`<cord-floating-threads>\` component
can be used to programmatically open a particular thread.

This function takes one argument, which is an identifier for a thread.

You can use this method by getting a reference to the \`<cord-floating-threads>\` DOM element:

\`\`\`js
  <div>
    <cord-thread-list location="{\\"page\\":\\"foo\\"}" id="my-thread-list">
    <cord-floating-threads location="{\\"page\\":\\"foo\\"}" group-id="my-group" id="my-floating-threads">
  </div>

  <script>
    const floatingThreads = document.getElementById('my-floating-threads');
    const threadList = document.getElementById('my-thread-list');
    threadList.addEventListener('cord-thread-list:threadclick', (e) => {
      const threadID = event.detail[0];
      floatingThreads.openThread(threadID);
    });
  </script>
\`\`\`
`,
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
          <NextUpCard
            title="Thread List"
            linkTo={'/components/cord-thread-list'}
          >
            Display a list of threads
          </NextUpCard>
          <NextUpCard
            title="Page Presence"
            linkTo={'/components/cord-page-presence'}
          >
            Let people know who else is on the page
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordFloatingThreads;
