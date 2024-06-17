import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import { Message } from '@cord-sdk/react';
import { LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { messageClassnamesDocs } from 'external/src/components/2/MessageImpl.css.ts';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

export function Message3() {
  const { organizationID } = useContext(AuthContext);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadId(
      `${LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX}${organizationID}`,
    );
  }, [organizationID, setThreadId]);

  return (
    <>
      <section>
        <LiveDemoCard>
          <div
            style={{
              height: '100%',
              margin: '50px 0',
              width: '600px',
            }}
          >
            {threadId && <Message threadId={threadId} />}
          </div>
        </LiveDemoCard>
        <H2>When to use</H2>
        <p>
          The{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: '<Message />',
              [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-message>',
            }}
          />{' '}
          component renders a fully baked message. It gives your users an
          intuitive commenting UI that matches the experience of using a
          well-crafted chat in tools like Slack or Figma. You don't have to
          worry about how users add reactions, how they edit a message, how they
          delete one, or whether it is seen or unseen by the current user. We've
          got you covered! It will even handle timestamps that update live on
          the page while you're chatting.
        </p>
        <p>
          This component starts you off with a 10/10 of message experience that
          you can customize as you need.
        </p>
        <p>
          You can change the background and even the structure of the component.
          We built the component using{' '}
          <Link to="https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas">
            <code>grid-template-areas</code>
          </Link>
          , so feel free to inspect the example message above and play around
          with the <code>grid-area</code>.
        </p>
        <p>
          Do you want to build a chat? Maybe Slack-like threads? Or even a
          thread preview? Pair this component with our{' '}
          <Link to="/js-apis-and-hooks/thread-api">Thread API</Link> to access
          the data you need and create the experiences you want! Specifically,
          check out the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreads">
            get threads API
          </Link>{' '}
          and the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThread">
            get thread API
          </Link>{' '}
          to fetch relevant thread IDs and message IDs for a particular location
          or thread respectively.
        </p>
        <EmphasisCard>
          <p>
            <strong>Looking for the message data format?</strong>
          </p>
          <p>
            Check out the{' '}
            <Link to="/how-to/create-cord-messages">
              how-to guide for examples of the Cord message data format
            </Link>
          </p>
        </EmphasisCard>
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
              snippet: `import { Message } from "@cord-sdk/react";

export const Example = () => (
  <Message
    threadId={'my-awesome-thread-id'}
    messageId={'my-awesome-message-id'}
    onMessageClick={({threadID, messageID}) =>
      console.log("user clicked on message:", messageID, threadID)
    }
  />
);`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `
<cord-message thread-id="my-awesome-thread-id" message-id="my-awesome-message-id">
</cord-message>
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
                'threadId',
                'messageId',
                'markAsSeen',
                'isEditing',
                'onClick',
                'onLoading',
                'onRender',
                'onMouseEnter',
                'onMouseLeave',
                'onEditStart',
                'onEditEnd',
                'onThreadResolve',
                'onThreadReopen',
              ],
              required: ['threadId'],
              properties: {
                threadId: {
                  type: 'string',
                  description: `The [thread ID](/reference/identifiers)
containing the message you want to render.`,
                },
                messageId: {
                  type: 'string',
                  description: `The [message ID](/reference/identifiers)
for the message you want to render. This ID has to be one of the messages
included in the thread you have provided.

If you do not provide the messageId,  the message component will render the
first message of this thread.`,
                },
                markAsSeen: {
                  type: 'boolean',
                  description: (
                    <>
                      <p>
                        If <code>true</code>, then this message and its
                        containing thread will automatically be marked as seen
                        when they have been visible in the browser for about one
                        second. If <code>false</code>, this behavior is
                        disabled.
                      </p>
                      <p>
                        The default is <code>true</code>.
                      </p>
                    </>
                  ),
                },
                isEditing: {
                  type: 'boolean',
                  description: (
                    <>
                      <p>
                        If <code>true</code>, then this message component will
                        render a Composer that can be used to edit the message
                        content. This can be used together with the{' '}
                        <code>onMessageEditEnd</code> callback to create a
                        custom edit button instead of the default one in message
                        options.
                      </p>
                      <p>
                        The default is <code>false</code>.
                      </p>
                    </>
                  ),
                },
                onClick: {
                  type: 'function',
                  description: `Callback invoked when a user clicks anywhere on
the message, but not on the reactions or options menu. 

The callback is passed is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message which was clicked as an argument.`,
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
                onMouseEnter: {
                  type: 'function',
                  description: `Callback invoked when the cursor enters a message.
The message area consists of the avatar, the name, the message content,
the options menu and the reactions.

The callback is passed is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the hovered message.
`,
                },
                onMouseLeave: {
                  type: 'function',
                  description: `Callback invoked when the cursor leaves a message.
The message area consists of the avatar, the name, the message content,
the options menu and the reactions.

The callback is passed is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the hovered message.
`,
                },
                onEditStart: {
                  type: 'function',
                  description: `Callback invoked when a user starts editing a message.
The callback is passed is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message being edited.

Use \`onEditEnd\` to determine when editing is complete.`,
                },
                onEditEnd: {
                  type: 'function',
                  description: `Callback invoked when a user completes editing a message.
The callback is passed is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message being edited.

Use \`onEditStart\` to determine when editing begins.`,
                },
                onThreadResolve: {
                  type: 'function',
                  description: `Callback invoked when a user resolves a thread.
The callback is passed is an object of type \`{thread: ThreadSummary}\` containing the [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread being resolved.

Note: This action is only available from the first message of each thread.`,
                },
                onThreadReopen: {
                  type: 'function',
                  description: `Callback invoked when a user reopens a thread. 
The callback is passed is an object of type \`{thread: ThreadSummary}\` containing the [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread being reopened.

Note: This action is only available from the first message of each thread.`,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: [
                'thread-id',
                'message-id',
                'mark-as-seen',
                'is-editing',
                'cord-message:click',
                'cord-message:loading',
                'cord-message:render',
                'cord-message:mouseenter',
                'cord-message:mouseleave',
                'cord-message:editstart',
                'cord-message:editend',
                'cord-message:threadresolve',
                'cord-message:threadreopen',
              ],
              required: ['thread-id'],
              properties: {
                ['thread-id']: {
                  type: 'string',
                  description: `The [thread ID](/reference/identifiers)
containing the message you want to render.`,
                },
                ['message-id']: {
                  type: 'string',
                  description: `The [message ID](/reference/identifiers)
for the message you want to render. This ID has to be one of the messages
included in the thread you have provided.

If you do not provide the messageId, the message component will render the
first message of this thread.`,
                },
                ['mark-as-seen']: {
                  type: 'boolean',
                  description: (
                    <>
                      <p>
                        If <code>true</code>, then this message and its
                        containing thread will automatically be marked as seen
                        when they have been visible in the browser for about one
                        second. If <code>false</code>, this behavior is
                        disabled.
                      </p>
                      <p>
                        The default is <code>true</code>.
                      </p>
                    </>
                  ),
                },
                ['is-editing']: {
                  type: 'boolean',
                  description: (
                    <>
                      <p>
                        If <code>true</code>, then this message component will
                        render a Composer that can be used to edit the message
                        content. This can be used together with the{' '}
                        <code>cord-message:editend</code> event to create a
                        custom edit button instead of the default one in message
                        options.
                      </p>
                      <p>
                        The default is <code>false</code>.
                      </p>
                    </>
                  ),
                },
                'cord-message:click': {
                  type: 'event',
                  description: `This event is fired when a user clicks anywhere on
the message, but not on the reactions or options menu. 

The event.detail[0] is an object of type \`{threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message which was clicked.`,
                },
                'cord-message:loading': {
                  type: 'event',
                  description: `This event is fired when the component begins
loading. Listen for \`cord-message:render\` to determine when loading is complete.`,
                },
                'cord-message:render': {
                  type: 'event',
                  description: `This event is fired when the component has
finished rendering. Listen for \`cord-message:loading\` to determine when a
component begins loading.`,
                },
                'cord-message:mouseenter': {
                  type: 'event',
                  description: `This event is fired when the cursor enters a message. 
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the hovered message.

The message area consists of the avatar, the name, the message content, the options menu and the reactions.`,
                },
                'cord-message:mouseleave': {
                  type: 'event',
                  description: `This event is fired when the cursor leaves a message.  
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the hovered message.

The message area consists of the avatar, the name, the message content, the options menu and the reactions.`,
                },
                'cord-message:editstart': {
                  type: 'event',
                  description: `This event is fired when a user starts editing a message.
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message being edited.
                  
Listen for \`cord-message:editend\` to determine when editing is complete.`,
                },
                'cord-message:editend': {
                  type: 'event',
                  description: `This event is fired when a user completes editing a message.
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData;}\`
containing information about the message being edited.

Listen for \`cord-message:editstart\` to determine when editing begins.`,
                },
                'cord-message:threadresolve': {
                  type: 'event',
                  description: `This event is fired when a user resolves a thread. 
The \`event.detail[0]\` an object of type \`{thread: ThreadSummary}\` containing the [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread being resolved.

Note: This action is only available from the first message of each thread.`,
                },
                'cord-message:threadreopen': {
                  type: 'event',
                  description: `This event is fired when a user reopens a thread.   
The \`event.detail[0]\` an object of type \`{thread: ThreadSummary}\` containing the [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread being reopened.
                  
Note: This action is only available from the first message of each thread.`,
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
          There are more classes that are best understood in context. We suggest
          inspecting the component with your browser's developer tools to view
          everything. You can target any classes starting with{' '}
          <code>cord-</code>.
        </p>
        <p>
          <EmphasisCard>
            Do you need more control? Are some messages more important, or do
            you want system messages to look different from normal users'
            messages?
            <p>
              We add any classes present in the message's{' '}
              <code>extraClassnames</code> field.{' '}
            </p>
            <p>
              You can combine this field and CSS for achieving greater
              customization. This allow you to make messages look different from
              each others.
            </p>
          </EmphasisCard>
        </p>
        <CSSClassNameList classnames={messageClassnamesDocs} />
      </section>
    </>
  );
}
