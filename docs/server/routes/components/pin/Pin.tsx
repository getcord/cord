/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { pinClassnamesDocs } from '@cord-sdk/react/components/Pin.classnames.ts';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import PinLiveDemo from 'docs/server/routes/components/pin/PinLiveDemo.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';
function CordPin() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Pin"
      pageSubtitle={`Building block for conversations pinned to a place`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <PinLiveDemo />
        <section>
          <H2>When to use</H2>
          <p>
            The <code>Pin</code> component is a building block for creating
            conversations pinned to a particular place on your page. This
            component lets you create features similar to{' '}
            <code>
              <Link to="/components/cord-floating-threads">
                Floating Threads
              </Link>
            </code>
            . Compared to <code>Floating threads</code> the
            <code>Pin</code> component is a lower-level primitive that offers
            more flexibility in customizability and functionality.
          </p>
          <p>
            Every <code>Pin</code> corresponds to a single conversation thread
            like the{' '}
            <Link to="/components/cord-thread">
              <code>Thread</code>
            </Link>{' '}
            component. The <code>Pin</code> shows the avatar of the user who
            created the thread. It also changes color based on whether the
            conversation contains unread messages.
          </p>
          <p>
            Most commonly, the <code>Thread</code> component is rendered next to
            the <code>Pin</code>, opening and closing the <code>Thread</code>{' '}
            when user clicks the <code>Pin</code>. See example below.
          </p>
          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-thread">Thread</Link> →
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
                snippet: `import { Thread } from "@cord-sdk/react";
export const Example = () => {
  const [open, setOpen] = useState(false);
  return (
    <Pin
      location={{ page: "index" }}
      threadId={"<threadId>"}
      onClick={() => setOpen((x) => !x)}
    >
      <Thread
        location={{ page: "index" }}
        threadId={"<threadId>"}
        style={{ left: '0px', 
                 position: 'absolute', 
                 top: '100%', 
                 visibility: open ? "visible" : "hidden",
              }}
      />
    </Pin>
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-pin id="pin" thread-id="<threadId>" location='{ "page": "index" }'>
    <cord-thread id="thread" thread-id="<threadId>" location='{ "page": "index" }'></cord-thread>
</cord-pin>

<script>
  const pin = document.getElementById('pin');
  const thread = document.getElementById('thread');
  let open = true;
  pin.addEventListener('cord-pin:click', () => {
    open = !open;
    thread.style.visibility = open ? 'visible' : 'hidden';
  });
</script>`,
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
                  'threadId',
                  'location',
                  'onClick',
                  'onResolve',
                  'onMouseEnter',
                  'onMouseLeave',
                ],
                required: ['threadId'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) concept for
the Pin component. Just like for [Thread](/components/cord-thread), if
\`threadId\` is for a new thread, this will associate the thread with this
location. For existing threads, the location is ignored.

If unset, this field will default to the current URL for
the page.`,
                  },
                  threadId: {
                    type: 'string',
                    description: `This is the id of the conversation thread for
                  which the Pin shows information. For more information about
                  \`threadId\` see the documentation for
                  [Thread](/components/cord-thread) component.`,
                  },
                  onClick: {
                    type: 'function',
                    description: `Callback invoked when user clicks the pin.
                    The argument to this callback will be of type
                    [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary)
                  (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                  onResolve: {
                    type: 'function',
                    description: `Callback invoked when the thread with id \`threadId\` is resolved.
                    The argument to this callback will be of type
                    [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary)
                  (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                  onMouseEnter: {
                    type: 'function',
                    description: `Callback invoked when user's mouse enters the pin element.
                    The argument to this callback will be of type
                    [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary)
                  (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                  onMouseLeave: {
                    type: 'function',
                    description: `Callback invoked when user's mouse leaves the pin element.
                    The argument to this callback will be of type
                    [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary)
                  (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'thread-id',
                  'location',
                  'cord-pin:click',
                  'cord-pin:resolve',
                  'cord-pin:mouseenter',
                  'cord-pin:mouseleave',
                ],
                required: ['thread-id'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) concept for
the Pin component. Just like for [Thread](/components/cord-thread), if
\`thread-id\` is for a new thread, this will associate the thread with this
location. For existing threads, the location is ignored.

If unset, this field will default to the current URL for
the page.`,
                  },
                  'thread-id': {
                    type: 'string',
                    description: `This is the id of the conversation thread for
                  which the Pin shows information. For more information about
                  \`thread-id\` see the documentation for
                  [Thread](/components/cord-thread) component.`,
                  },
                  'cord-pin:click': {
                    type: 'event',
                    description: `This event is fired when user clicks the pin.
                    The \`event.detail[0]\` contains thread information of type [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary) (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                  'cord-pin:resolve': {
                    type: 'event',
                    description: `This event is fired when the thread with id \`thread-id\` is resolved.
                    The \`event.detail[0]\` contains thread information of type [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary) (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                  'cord-pin:mouseenter': {
                    type: 'event',
                    description: `This event is fired when user's mouse enters the pin element.
                    The \`event.detail[0]\` contains thread information of type [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary) (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                  'cord-pin:mouseleave': {
                    type: 'event',
                    description: `This event is fired when user's mouse leaves the pin element.
                    The \`event.detail[0]\` contains thread information of type [\`ThreadSummary\`](/js-apis-and-hooks/thread-api/observeThreadSummary) (or \`null\` in the rare case of the event happening before
                  the thread information is loaded).`,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <section>
          <H2>CSS customization</H2>
          <CSSClassNameListExplain />
          <p>
            This component itself makes use of the{' '}
            <Link to="/components/cord-avatar#CSS-customization">Avatar</Link>{' '}
            component. Take a look at its documentation for what classes are
            available to target within it.
          </p>
          <CSSClassNameList classnames={pinClassnamesDocs} />
        </section>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordPin;
