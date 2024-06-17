/** @jsxImportSource @emotion/react */

import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ThreadReactComponentProps } from '@cord-sdk/react';
import { Thread } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import {
  DOCS_LIVE_PAGE_LOCATIONS,
  LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX,
} from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import type { ComponentDropdownMapType } from 'docs/server/routes/components/types.ts';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import { useLiveDemoSelect } from 'docs/server/hooks/useLiveDemoSelect.tsx';

function Thread3() {
  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX}${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  const {
    componentOptions,
    setComponentOptions,
    interactiveProps: interactiveThreadProps,
    componentSelects,
    liveDemoCssStyles,
  } = useLiveDemoSelect(INITIAL_INTERATIVE_THREAD_PROPS);

  const threadComponentRef = useRef<Element>(null);

  const [threadMessageCount, setThreadMessageCount] = useState<number>(0);

  useEffect(() => {
    let collapsedDisabled = false;
    let placeHolderDisabled = false;

    // Disabling prop as user will see no component is collapsed was true
    if (threadMessageCount === 0) {
      collapsedDisabled = true;
    }

    // Disabling prop as user wouldn't be able to see any changes to
    // showPlaceholder in this state
    if (threadMessageCount > 0) {
      placeHolderDisabled = true;
    }

    setComponentOptions((prevVal) => {
      const newValue = {
        ...prevVal,
        collapsed: { ...prevVal.collapsed, disabled: collapsedDisabled },
        showPlaceholder: {
          ...prevVal.showPlaceholder,
          disabled: placeHolderDisabled,
        },
      };

      return newValue;
    });
  }, [setComponentOptions, threadMessageCount]);

  useEffect(() => {
    // If user sets collapsed to true we basically disable all the other props
    // as user will see not visual difference
    setComponentOptions((prevVal) => {
      return {
        ...prevVal,
        composerExpanded: {
          ...prevVal.composerExpanded,
          disabled: componentOptions.collapsed.value,
        },
        showHeader: {
          ...prevVal.showHeader,
          disabled: componentOptions.collapsed.value,
        },
      };
    });
  }, [componentOptions.collapsed.value, setComponentOptions]);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Thread"
      pageSubtitle={`Display conversations anywhere in your product`}
      showTableOfContents={true}
    >
      <LiveDemoCard css={liveDemoCssStyles} showTag={false}>
        {threadID && (
          <>
            {componentSelects}
            <Thread
              forwardRef={threadComponentRef}
              threadId={threadID}
              location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveThread }}
              style={{
                maxHeight: 400,
                width: 300,
              }}
              onThreadInfoChange={(threadInfo) =>
                setThreadMessageCount(threadInfo.messageCount)
              }
              {...interactiveThreadProps}
            />
          </>
        )}
      </LiveDemoCard>

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
              snippet: `import { Thread } from "@cord-sdk/react";

export const Example = () => {
  return (
    <Thread
      threadId={"<any string that is unique across your entire application>"}
      groupId="my-group"
      location={{ "page": "index" }}
      metadata={{ "foo": "bar" }}
      onThreadInfoChange={({ messageCount }) => {
        console.log("thread has", messageCount, "messages");
      }}
      onClose={() => {
        console.log("User clicked close button");
      }}
      onResolved={() => {
        console.log("User resolved the thread");
      }}
      style={{
        maxHeight: "400px", // Recommended so that long threads scroll instead of disappearing off-screen
        width: "300px" // Recommended so that threads don't stretch horizontally based on their content
      }}
    />
  );
};`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `<cord-thread
  thread-id="<id of thread>"
  group-id="my-group"
  location='{ "page": "index" }'
  metadata='{ "foo": "bar" }'
  // Setting a max-height is recommended so that long threads scroll instead of disappearing off-screen
  // Setting a width is recommended so that threads don't stretch horizontally based on their content
  style="max-height: 400px; width: 300px;"
></cord-thread>`,
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
                'groupId',
                'location',
                'threadName',
                'metadata',
                'collapsed',
                'autofocus',
                'showHeader',
                'composerExpanded',
                'composerDisabled',
                'showPlaceholder',
                'onLoading',
                'onRender',
                'onThreadInfoChange',
                'onClose',
                'onResolved',
                'onMessageEditStart',
                'onMessageEditEnd',
                'onFocusComposer',
                'onBlurComposer',
                'onSend',
              ],
              required: ['threadId'],
              properties: {
                threadId: {
                  type: 'string',
                  description: `An arbitrary string that uniquely identifies a
thread. When your page loads, the Cord client SDK will load the
thread associated with this thread identifier and display the
messages. If the thread doesn't exist yet, Cord's backend will
create it on the fly.

*Warning!*
An important restriction of working with thread identifiers
is that they must be unique across your entire application.
You can't use the same thread identifier in two separate
groups. This is an intentional limitation imposed by Cord.`,
                },
                groupId: {
                  type: 'string',
                  description: `The [group](/rest-apis/groups) ID which this thread
should belong to.  This controls which users will be able to see the Thread.
                  
Required when creating a new thread.  If loading an existing thread ID, specifying
a group ID which does not match the group the thread belongs to will result in an
error.`,
                },
                location: {
                  type: 'string',
                  description: `The [location](/reference/location/) concept for
the thread component.

If unset, this field will default to the current URL for
the page.`,
                },
                threadName: {
                  type: 'string',
                  description: `Sets the name of the thread. The thread name is
used in a small number of places where a short name or header
is useful to distinguish the thread; the default value is nearly
always fine. A newly-created thread will have its title set to
this value, and an existing thread will have its title updated
to this value.

The default setting is the current page's title.`,
                },
                metadata: {
                  type: 'object',
                  description: `A JSON object that can be used to
store metadata about a thread. Keys are strings, and values can be strings,
numbers or booleans.

A newly-created thread will have its metadata set to
this value, and an existing thread will have its metadata updated
to this value. If the metadata property is unset, the thread's existing metadata
is preserved.`,
                },
                collapsed: {
                  type: 'boolean',
                  description: `If \`true\`, the thread will render in a smaller,
collapsed state. The header and message composer will be hidden,
and only the first message in the thread will be visible (with
a "N replies" link underneath to expand further replies in
the thread).

The default value is \`false\`.`,
                },
                autofocus: {
                  type: 'boolean',
                  description: `If \`true\`, the thread's message composer input
field will render with the \`autofocus\` HTML attribute set.

The default value is \`false\`.`,
                },
                showHeader: {
                  type: 'boolean',
                  description: `If \`true\`, a header will be shown at the top of
the thread. The header contains some extra dropdowns and actions
relating to the thread, such as "Share via email" and
"Unsubscribe". If \`collapsed\` is \`true\`, this attribute is
ignored (the header is always hidden in collapsed threads). In threads with no messages the extra dropdown will not be rendered, only a close button.

The default value is \`false\`.`,
                },

                composerExpanded: {
                  type: 'boolean',
                  description: `If \`true\`, the composer of the thread will always
appear expanded. This means that it will always show the button list (such as
the mention button and emoji button) right below the editor. If it is set to
\`false\`, the composer will start from a single-line state, but will expand
when a user clicks in the editor or starts typing. It will return to a
single-line state when it loses focus and there is no input in the editor.

This value defaults to \`false\`.`,
                },
                composerDisabled: {
                  type: 'boolean',
                  description: `If \`true\`, the composer of the thread will
render in a disabled state, preventing writing or sending a
message. This can be used, for example, to visually suggest
the user can not or should not send a message to the thread.
However, it is not a permission control, since it does not
prevent the user from sending to the thread directly (such as
via the [JS API](/js-apis-and-hooks/thread-api/sendMessage)).
Only Cord's [groups](/reference/permissions) should be used
for permissions.

The default value is \`false\`.`,
                },
                showPlaceholder: {
                  type: 'boolean',
                  description: `If \`false\`, when the thread has no messages, it will show only the composer. If set to \`true\`, it will instead show a placeholder, containing a set of users from the group and a description to prompt sending a message.

The default value is \`true\`.`,
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

                onThreadInfoChange: {
                  type: 'function',
                  description: `Callback invoked when the thread is first loaded
and when the thread information changes. 
The callback is passed one argument, threadInfo which is an object of type \`{messageCount: number; thread: ThreadSummary}\`
containing the number of non-deleted messages in the thread and the thread's [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2)
`,
                },
                onClose: {
                  type: 'function',
                  description: `Callback invoked when a user clicks on the close
button in the thread header.
The callback is passed one argument, \`threadInfo\` which is an object of type \`{thread: ThreadSummary}\` containing the thread's [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2)
`,
                },
                onResolved: {
                  type: 'function',
                  description: `Callback invoked when a user resolves the thread.
                  The callback is passed one argument, \`threadInfo\` which is an object of type \`{thread: ThreadSummary}\` containing the thread's [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2)
                  `,
                },
                onFocusComposer: {
                  type: 'function',
                  description: `Callback invoked when a user focuses the composer.
                  The callback is passed one argument which is an object of type \`{threadId: string; thread: ThreadSummary}\``,
                },
                onBlurComposer: {
                  type: 'function',
                  description: `Callback invoked when the composer loses focus.
                  The callback is passed one argument which is an object of type \`{threadId: string; thread: ThreadSummary}\``,
                },
                onSend: {
                  type: 'function',
                  description: `Callback invoked when a new message is sent from the Thread's composer.
                  The callback is passed one argument which is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary}\``,
                },
                onMessageEditStart: {
                  type: 'function',
                  description: `Callback invoked when a user starts editing a message in the Thread.
                  The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData; }\`.
                  `,
                },
                onMessageEditEnd: {
                  type: 'function',
                  description: `Callback invoked when a user completes editing a message in the Thread.
                  The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData; }\`
                  `,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: [
                'thread-id',
                'group-id',
                'location',
                'thread-name',
                'metadata',
                'collapsed',
                'autofocus',
                'show-header',
                'composer-expanded',
                'composer-disabled',
                'show-placeholder',
                'cord-thread:loading',
                'cord-thread:render',
                'cord-thread:threadinfochange',
                'cord-thread:close',
                'cord-thread:resolved',
                'cord-message:editstart',
                'cord-message:editend',
                'cord-composer:focus',
                'cord-composer:blur',
                'cord-composer:send',
              ],
              required: ['thread-id'],
              properties: {
                'thread-id': {
                  type: 'string',
                  description: `An arbitrary string that uniquely identifies a
thread. When your page loads, the Cord client SDK will load the
thread associated with this thread identifier and display the
messages. If the thread doesn't exist yet, Cord's backend will
create it on the fly.

*Warning!*
An important restriction of working with thread identifiers
is that they must be unique across your entire application.
You can't use the same thread identifier in two separate
groups. This is an intentional limitation imposed by Cord.`,
                },
                'group-id': {
                  type: 'string',
                  description: `The [group](/rest-apis/groups) ID which this thread
should belong to.  This controls which users will be able to see the Thread.
                  
Required when creating a new thread.  If loading an existing thread ID, specifying
a group ID which does not match the group the thread belongs to will result in an
error.`,
                },
                location: {
                  type: 'string',
                  description: `The [location](/reference/location/) concept for
the thread component.

If unset, this field will default to the current URL for
the page.`,
                },
                'thread-name': {
                  type: 'string',
                  description: `Sets the name of the thread. The thread name is
used in a small number of places where a short name or header
is useful to distinguish the thread; the default value is nearly
always fine. A newly-created thread will have its title set to
this value, and an existing thread will have its title updated
to this value.

The default setting is the current page's title.`,
                },
                metadata: {
                  type: 'string',
                  description: `A serialized JSON object that can be used to
store metadata about a thread. Keys must be strings, values can be strings,
numbers or booleans.

A newly-created thread will have its metadata set to
this value, and an existing thread will have its metadata updated
to this value. If the metadata property is unset, the thread's existing metadata
is preserved.

The default value is \`{}\`.`,
                },
                collapsed: {
                  type: 'boolean',
                  description: `If \`true\`, the thread will render in a smaller,
collapsed state. The header and message composer will be hidden,
and only the first message in the thread will be visible (with
a "N replies" link underneath to expand further replies in
the thread).

The default value is \`false\`.`,
                },
                autofocus: {
                  type: 'boolean',
                  description: `If \`true\`, the thread's message composer input
field will render with the \`autofocus\` HTML attribute set.

The default value is \`false\`.`,
                },
                'show-header': {
                  type: 'boolean',
                  description: `If \`true\`, a header will be shown at the top of
the thread. The header contains some extra dropdowns and actions
relating to the thread, such as "Share via email" and
"Unsubscribe". If \`collapsed\` is \`true\`, this attribute is
ignored (the header is always hidden in collapsed threads). In threads with no messages the extra dropdown will not be rendered, only a close button.

The default value is \`false\`.`,
                },
                'composer-expanded': {
                  type: 'boolean',
                  description: `If \`true\`, the composer of the thread will always
appear expanded. This means that it will always show the button list (such as
the mention button and emoji button) right below the editor. If it is set to
\`false\`, the composer will start from a single-line state, but will expand
when a user clicks in the editor or starts typing. It will return to a
single-line state when it loses focus and there is no input in the editor.

This value defaults to \`false\`.`,
                },
                'composer-disabled': {
                  type: 'boolean',
                  description: `If \`true\`, the composer of the thread will
render in a disabled state, preventing writing or sending a
message. This can be used, for example, to visually suggest
the user can not or should not send a message to the thread.
However, it is not a permission control, since it does not
prevent the user from sending to the thread directly (such as
via the [JS API](/js-apis-and-hooks/thread-api/sendMessage)).
Only Cord's [groups](/reference/permissions) should be used
for permissions.

The default value is \`false\`.`,
                },
                'show-placeholder': {
                  type: 'boolean',
                  description: `If \`false\`, when the thread has no messages, it will show only the composer. If set to \`true\`, it will instead show a placeholder, containing a set of users from the group and a description to prompt sending a message.

The default value is \`true\`.`,
                },
                'cord-thread:loading': {
                  type: 'event',
                  description: `This event is fired when the component begins
loading. Listen for \`cord-thread:render\` to determine when loading is complete.`,
                },
                'cord-thread:render': {
                  type: 'event',
                  description: `This event is fired when the component has
finished rendering. Listen for \`cord-thread:loading\` to determine when a
component begins loading.`,
                },
                'cord-thread:threadinfochange': {
                  type: 'event',
                  description: `This event is fired when the thread is first loaded
and when the thread information changes. The \`event.detail[0]\` is the thread info object which
has type \`{ messageCount: number; thread: ThreadSummary }\`.`,
                },
                'cord-thread:close': {
                  type: 'event',
                  description: `This event is fired when a user clicks on the close button in the thread header. 

The \`event.detail[0]\` is an object of ty[e] \`{ thread: ThreadSummary }\`.`,
                },
                'cord-thread:resolved': {
                  type: 'event',
                  description: `This event is fired when a user resolves the thread.
The \`event.detail[0]\` is an object of type \`{ thread: ThreadSummary }\`.`,
                },
                'cord-message:editstart': {
                  type: 'event',
                  description: `This event is fired when a user starts editing a message in the Thread.
The \`event.detail[0]\` is an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData; }\`.`,
                },
                'cord-message:editend': {
                  type: 'event',
                  description: `This event is fired when a user completes editing a message in the Thread.
The \`event.detail[0]\` is an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData; }\`.`,
                },

                'cord-composer:focus': {
                  type: 'event',
                  description: `This event is fired when a user focuses the composer. 
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary | null; }\`.`,
                },
                'cord-composer:blur': {
                  type: 'event',
                  description: `This event is fired when the composer loses focus. 
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary | null; }\`.`,
                },
                'cord-composer:send': {
                  type: 'event',
                  description: `This event is fired when a new message is sent from the Thread's composer.
The \`event.detail[0]\` is an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; }\`.`,
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
          title="Page Presence"
          linkTo="/components/cord-page-presence"
        >
          Let people know who else is on the page
        </NextUpCard>
        <NextUpCard title="Thread List" linkTo="/components/cord-thread-list">
          Get a list of threads
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Thread3;

type InteractiveThreadComponentProps = Required<
  Pick<
    ThreadReactComponentProps,
    'showHeader' | 'showPlaceholder' | 'collapsed' | 'composerExpanded'
  >
>;

type ThreadComponentOptionsType =
  ComponentDropdownMapType<InteractiveThreadComponentProps>;

const INITIAL_INTERATIVE_THREAD_PROPS: ThreadComponentOptionsType = {
  showHeader: {
    value: true,
    options: [true, false],
    description: 'Toggle the thread header on and off',
    disabled: false,
    disabledLabel: 'You can only see the header if the thread is not collapsed',
  },
  showPlaceholder: {
    value: true,
    options: [true, false],
    description: 'Shows a message prompting the user to write a message',
    disabled: false,
    disabledLabel:
      'You can only see this when a thread has no messages, try refreshing the page',
  },
  collapsed: {
    value: false,
    options: [true, false],
    description: 'Will show the first message in the thread',
    disabled: true,
    disabledLabel:
      'You will need at least one message in a thread to see this change',
  },
  composerExpanded: {
    value: true,
    options: [true, false],
    description:
      'The composer will always show the button list right below the editor ',
    disabled: false,
    disabledLabel:
      'You can only see the composer if the thread is not collapsed',
  },
};
