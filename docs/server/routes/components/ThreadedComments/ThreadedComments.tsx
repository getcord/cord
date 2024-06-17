/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import { ThreadedComments } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import type { ComponentDropdownMapType } from 'docs/server/routes/components/types.ts';
import { useLiveDemoSelect } from 'docs/server/hooks/useLiveDemoSelect.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { threadedCommentsClassnameDocs } from '@cord-sdk/react/components/ThreadedComments.classnames.ts';
import type { ThreadedCommentsReactComponentProps } from '@cord-sdk/react/components/ThreadedComments.tsx';
import GithubLink from 'docs/server/ui/GithubLink.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

export default function CordThreadedComments() {
  const {
    componentOptions,
    interactiveProps,
    componentSelects,
    liveDemoCssStyles,
  } = useLiveDemoSelect(INITIAL_INTERACTIVE_THREADED_COMMENTS_PROPS);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Threaded Comments"
      pageSubtitle={`Display all the Threads in a given location, add new Threads, 
        and reply inline with a flexible, embeddable UI component. 
        Threaded Comments is ideal for showing conversations on a page, 
        or creating a comment section.
      `}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <section>
          <LiveDemoCard css={liveDemoCssStyles} showTag={false}>
            {componentSelects}
            {/* showReplies manipulates initial states, so I am using the showReplies value in the key to force a re-render on change. */}
            <ThreadedComments
              key={`live-demo-${componentOptions.sortBy}-${componentOptions.scrollDirection}-${componentOptions.topLevelComposerExpanded}-${componentOptions.composerPosition}-${componentOptions.showReplies?.value}`}
              location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveThreadedComments }}
              {...interactiveProps}
            />
          </LiveDemoCard>
          <H2>When to use</H2>
          <p>
            The{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: '<ThreadedComments />',
              }}
            />{' '}
            component renders a composer and a list of comments. Every new
            comment created from that composer will appear in the same list. You
            can react and reply to each comment inline.
          </p>
          <p>
            This component is great for an all-in-one threaded commenting
            experience. If you don't want multiple threads, take a look at the
            single <Link to="/components/cord-thread">Thread</Link> component
            instead.
          </p>
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
                snippet: `import { ThreadedComments } from "@cord-sdk/react";

export function Example() {
  return (
    <ThreadedComments
      location={{ page: 'index' }}
      groupId="my-group"
      composerPosition={'top'}
      topLevelComposerExpanded={false}
      onMessageClick={({ threadId, messageId }) =>
        console.log("user clicked on:", threadId, messageId)
      }
    />
  );
}`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-threaded-comments
  location='{ "page": "index" }'
  group-id="my-group"
  composer-position="top"
  top-level-composer-expanded="false"
></cord-threaded-comments>`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H2>Source code</H2>
          <p>
            Threaded Comments is built on top of our lower-level components and
            APIs, such as the{' '}
            <Link to="/components/cord-message">Message component</Link> and our{' '}
            <Link to="/js-apis-and-hooks/thread-api">Thread API</Link>. The{' '}
            <Link to="https://github.com/getcord/sdk-js/blob/master/packages/react/components/ThreadedComments.tsx">
              complete source code is available here
            </Link>{' '}
            under a permissive license. You can use it to learn from as an
            example, or even copy-paste into your own app to remix and build a
            custom experience.
          </p>
          <p>
            <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/components/ThreadedComments.tsx" />
          </p>
        </section>
        <HR />
        <section>
          <H2>Anatomy</H2>
          <p>
            This diagram shows how Threaded Comments is built using other,
            smaller, Cord components. Use this to help style your integration,
            or to break apart and create something new.
          </p>
          <SimpleCard>
            <img
              src="/static/images/anatomy-threaded-comments.png"
              alt="Anatomy of the Cord Threaded Comments component"
            />
          </SimpleCard>
        </section>
        <HR />
        <section>
          <PropertiesList
            savePreferenceFor="client"
            properties={{
              [ClientLanguageDisplayNames.REACT]: {
                propertyOrder: [
                  'location',
                  'partialMatch',
                  'groupId',
                  'filter',
                  'sortBy',
                  'scrollDirection',
                  'composerPosition',
                  'topLevelComposerExpanded',
                  'replyComposerExpanded',
                  'showReplies',
                  'highlightThreadId',
                  'autofocus',
                  'enableFacepileTooltip',
                  'threadUrl',
                  'threadName',
                  'threadMetadata',
                  'showPlaceholder',
                  'displayResolved',
                  'onMessageClick',
                  'onLoading',
                  'onRender',
                  'onComposerFocus',
                  'onComposerBlur',
                  'onComposerClose',
                  'onSend',
                  'onMessageMouseEnter',
                  'onMessageMouseLeave',
                  'onMessageEditStart',
                  'onMessageEditEnd',
                  'onThreadResolve',
                  'onThreadReopen',
                ],
                required: ['location', 'groupId'],
                properties: {
                  location: {
                    type: 'string',
                    description: (
                      <p>
                        Threads with this{' '}
                        <Link to="/reference/location">location</Link> will be
                        shown by the component. Any new threads will also be
                        created with this location.
                      </p>
                    ),
                  },
                  partialMatch: {
                    type: 'boolean',
                    description: `If \`false\`, only threads that exactly match the provided [location](/reference/location) are shown. If \`true\`, threads in any [partially matching location](/reference/location#Partial-Matching) are also shown. 

The default value is \`false\`. `,
                  },
                  groupId: {
                    type: 'string',
                    description: `Threads with this group ID will be
                  shown by the component. Any new threads will also be
                  created with this group ID.
                  
This attribute is required if the user does not have a group specified in their access token.

The exception is if \`composerPosition\` is set to \`none\`, in which case it may be omitted.  Doing so will cause the component to fetch threads from all groups the user is a member of.`,
                  },
                  filter: {
                    type: 'ThreadListFilter',
                    description: `A serialized JSON object that can be used to filter the 
threads in \`ThreadedComments\`.

Please refer to the [JS API ThreadListFilter](/js-apis-and-hooks/thread-api/observeThreads#filter-2) 
for the available options.`,
                  },
                  sortBy: {
                    type: 'enum',
                    description: sortByDescription,
                  },
                  scrollDirection: {
                    type: 'enum',
                    description: scrollDirectionDescription,
                  },
                  composerPosition: {
                    type: 'enum',
                    description: (
                      <>
                        <p>
                          Takes one of two possible values: <code>top</code> or{' '}
                          <code>bottom</code>.
                        </p>
                        <p>
                          If set to <code>top</code>, the composer will be
                          rendered above the list of threads.
                        </p>
                        <p>
                          If set to <code>bottom</code>, the composer will be
                          rendered below the list of threads.
                        </p>
                        <p>
                          If set to <code>none</code>, the composer will not
                          appear at all.
                        </p>
                        <p>
                          The default value is <code>bottom</code>.
                        </p>
                      </>
                    ),
                  },
                  topLevelComposerExpanded: {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          If <code>true</code>, the top level composer will
                          always appear expanded. This means that it will always
                          show the button list (such as the mention button and
                          emoji button) right below the editor.
                        </p>
                        <p>
                          If <code>false</code>, the top level composer will
                          start from a single-line state, but will expand when a
                          user clicks in the editor or starts typing. It will
                          return to a single-line state when it loses focus and
                          there is no input in the editor.
                        </p>
                        <p>
                          The default value is <code>false</code>.
                        </p>
                      </>
                    ),
                  },
                  showReplies: {
                    type: 'enum',
                    description: (
                      <>
                        <p>
                          Takes one of the following values:{' '}
                          <code>initiallyCollapsed</code>,{' '}
                          <code>initiallyExpanded</code> or
                          <code>alwaysCollapsed</code>.
                        </p>
                        <p>
                          If set to <code>initiallyCollapsed</code>, thread
                          replies will initially show a facepile and the number
                          of replies, if any. On click, the replies will become
                          visible, together with a composer.
                        </p>
                        <p>
                          If set to <code>initiallyExpanded</code>, all replies
                          will initially be visible. Both hiding them and
                          replying will be available.
                        </p>
                        <p>
                          If set to <code>alwaysCollapsed</code>, a facepile and
                          the number of replies for a thread will be shown, if
                          there are any, but viewing the replies and replying
                          will be disabled.
                        </p>
                        <p>
                          The default value is <code>initiallyCollapsed</code>.
                        </p>
                      </>
                    ),
                  },
                  replyComposerExpanded: {
                    type: 'boolean',
                    description: `Applies the exact same behavior as the \`composerExpanded\` property above, 
                but to the composers for replying to a thread.`,
                  },
                  highlightThreadId: {
                    type: 'string',
                    description: `Passing a thread id will highlight that thread in the ThreadedComments if it exists. If you want to modify how the highlight looks, you can write CSS targeting <code>.cord-threaded-comments.cord-highlighted</code>.`,
                  },
                  autofocus: {
                    type: 'boolean',
                    description: `If \`true\`, the top-level composer input
field will render with the \`autofocus\` HTML attribute set.

The default value is \`false\`.`,
                  },
                  enableFacepileTooltip: {
                    type: 'boolean',
                    description: `When \`true\`, a tooltip with the user's displayName will
appear on the Facepile with the profile pictures of the users who have replied to each thread. The default value is \`false\``,
                  },
                  threadUrl: {
                    type: 'string',
                    description: `The URL of a thread is used to direct users to the correct place
when clicking on a notification. The \`threadUrl\` defaults to \`window.location.href\`. Setting this 
property would override that default.

Note: The URL specified only applies to new threads and will not change the url of existing threads.

The default value is fine for almost all use cases.`,
                  },
                  threadName: {
                    type: 'string',
                    description: `Sets the name of the newly-created thread. The thread name is
used in a small number of places where a short name or header is useful to distinguish 
the thread. It defaults to the current page's title.

Note: The title specified only applies to new threads and will not change the title of existing threads.

The default value is nearly always fine.`,
                  },
                  threadMetadata: {
                    type: 'object',
                    description: `A JSON object that can be used to
  store extra data about a thread. Keys are strings, and values can be strings,
  numbers or booleans. This only affects newly-created threads and does not 
  change the metadata on existing threads.
  
  This property will only have an effect on the top-level composer, as the metadata can
  only be set on newly-created threads.`,
                  },
                  showPlaceholder: {
                    type: 'boolean',
                    description: `If \`false\`, when the the location specified in the component has no threads, 
ThreadedComments will show a completely empty div. If set to \`true\`, ThreadedComments will instead show a 
placeholder, containing a facepile with the people who will be able to view the threads and a prompt to add a
comment.

The default value is \`true\`.`,
                  },
                  displayResolved: {
                    type: 'enum',
                    description: displayResolvedDescription,
                  },
                  onMessageClick: {
                    type: 'function',
                    description: `Callback invoked when a user clicks on a message in the list. 

The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData;}\` containing
information about the clicked message.

For example, you could use this event to scroll your page to the relevant context of the 
clicked thread.`,
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
                  onMessageMouseEnter: {
                    type: 'function',
                    description: `Callback invoked when the cursor enters a message. 
                  The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData;}\` containing
                  information about the hovered message.

For example, you could use this event to highlight the section of a webpage being 
discussed in the hovered message.`,
                  },
                  onMessageMouseLeave: {
                    type: 'function',
                    description: `Callback invoked when the cursor leaves a message. 
                  The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData;}\` containing
                  information about the hovered message.

For example, you could use this event to terminate the special behavior initiated with 
\`onMessageMouseEnter\`.`,
                  },
                  onComposerFocus: {
                    type: 'function',
                    description: `Callback invoked when a user focuses the composer.
                  
                  The callback is passed an object of type \`{threadId: string; thread: ThreadSummary | null}\` containing information on the thread linked to the composer.`,
                  },
                  onComposerBlur: {
                    type: 'function',
                    description: `Callback invoked when the composer loses focus. 
                  The callback is passed an object of type \`{threadId: string; thread: ThreadSummary | null}\` containing information on the thread linked to the composer.`,
                  },
                  onComposerClose: {
                    type: 'function',
                    description: `Callback invoked when a user clicks on the close
button in the composer. It is passed an object of type \`{threadId: string; thread: ThreadSummary | null}\` containing information on the thread linked to the composer.

This callback will only be fired by the reply composers, as the top-level composer cannot be closed by users.`,
                  },
                  onSend: {
                    type: 'function',
                    description: `Callback invoked when a user sends a message from a composer.
The callback is passed an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary}\` containing details linked to the message sent.`,
                  },
                  onMessageEditStart: {
                    type: 'function',
                    description: `Callback invoked when a user starts editing a message.
                  The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData; }\`.

                   Use \`onMessageEditEnd\` to determine when editing is complete.`,
                  },
                  onMessageEditEnd: {
                    type: 'function',
                    description: `Callback invoked when a user completes editing a message.
                  The callback is passed an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData; }\`.

                  Use \`onMessageEditStart\` to determine when editing begins.`,
                  },
                  onThreadResolve: {
                    type: 'function',
                    description: `Callback invoked when a user resolves a thread.
                  The callback is passed an object of type \`{threadID: string; thread: ThreadSummary}\` containing the thread's ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).

The callback is passed an object containing the \`threadId\` identifying the thread which was resolved.`,
                  },
                  onThreadReopen: {
                    type: 'function',
                    description: `Callback invoked when a user reopens a thread.
                  The callback is passed an object of type \`{threadID: string; thread: ThreadSummary}\` containing the thread's ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2).

                  The callback is passed an object containing the \`threadId\` identifying the thread which was reopened.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'location',
                  'partial-match',
                  'group-id',
                  'filter',
                  'sort-by',
                  'scroll-direction',
                  'composer-position',
                  'top-level-composer-expanded',
                  'reply-composer-expanded',
                  'show-replies',
                  'highlight-thread-id',
                  'autofocus',
                  'enable-facepile-tooltip',
                  'thread-url',
                  'thread-name',
                  'thread-metadata',
                  'show-placeholder',
                  'display-resolved',
                  'cord-threaded-comments:messageclick',
                  'cord-threaded-comments:loading',
                  'cord-threaded-comments:render',
                  'cord-threaded-comments:messagemouseenter',
                  'cord-threaded-comments:messagemouseleave',
                  'cord-threaded-comments:messageeditstart',
                  'cord-threaded-comments:messageeditend',
                  'cord-threaded-comments:threadresolve',
                  'cord-threaded-comments:threadreopen',
                  'cord-composer:focus',
                  'cord-composer:blur',
                  'cord-composer:close',
                  'cord-composer:send',
                ],
                required: ['location', 'group-id'],
                properties: {
                  location: {
                    type: 'string',
                    description: (
                      <p>
                        Threads with this{' '}
                        <Link to="/reference/location">location</Link> will be
                        shown by the component. Any new threads will also be
                        created with this location.
                      </p>
                    ),
                  },
                  'partial-match': {
                    type: 'boolean',
                    description: `If \`false\`, only threads that exactly match the provided [location](/reference/location) are shown. If \`true\`, threads in any [partially matching location](/reference/location#Partial-Matching) are also shown. 

The default value is \`false\`. `,
                  },
                  'group-id': {
                    type: 'string',
                    description: `Threads with this group ID will be
                  shown by the component. Any new threads will also be
                  created with this group ID.
                  
This attribute is required if the user does not have a group specified in their access token.

The exception is if \`composer-position\` is set to \`none\`, in which case it may be omitted.  Doing so will cause the component to fetch threads from all groups the user is a member of.`,
                  },
                  filter: {
                    type: 'ThreadListFilter',
                    description: `A serialized JSON object that can be used to filter the 
threads in \`ThreadedComments\`.

Please refer to the [JS API ThreadListFilter](/js-apis-and-hooks/thread-api/observeThreads#filter-2) 
for the available options.`,
                  },
                  'sort-by': {
                    type: 'enum',
                    description: sortByDescription,
                  },
                  'scroll-direction': {
                    type: 'enum',
                    description: scrollDirectionDescription,
                  },
                  'composer-position': {
                    type: 'enum',
                    description: (
                      <>
                        <p>
                          Takes one of two possible values: <code>top</code> or{' '}
                          <code>bottom</code>.
                        </p>
                        <p>
                          If set to <code>top</code>, the composer will be
                          rendered above the list of threads.
                        </p>
                        <p>
                          If set to <code>bottom</code>, the composer will be
                          rendered below the list of threads.
                        </p>
                        <p>
                          If set to <code>none</code>, the composer will not
                          appear at all.
                        </p>
                        <p>
                          The default value is <code>bottom</code>.
                        </p>
                      </>
                    ),
                  },
                  'top-level-composer-expanded': {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          If <code>true</code>, the top level composer will
                          always appear expanded. This means that it will always
                          show the button list (such as the mention button and
                          emoji button) right below the editor.
                        </p>
                        <p>
                          If <code>false</code>, the top level composer will
                          start from a single-line state, but will expand when a
                          user clicks in the editor or starts typing. It will
                          return to a single-line state when it loses focus and
                          there is no input in the editor.
                        </p>
                        <p>
                          The default value is <code>false</code>.
                        </p>
                      </>
                    ),
                  },
                  'reply-composer-expanded': {
                    type: 'boolean',
                    description: `Applies the exact same behavior as the \`composerExpanded\` attribute above, 
                but to the composers for replying to a thread.`,
                  },
                  'show-replies': {
                    type: 'enum',
                    description: (
                      <>
                        <p>
                          Takes one of the following values:{' '}
                          <code>initiallyCollapsed</code>,{' '}
                          <code>initiallyExpanded</code> or
                          <code>alwaysCollapsed</code>.
                        </p>
                        <p>
                          If set to <code>initiallyCollapsed</code>, thread
                          replies will initially show a facepile and the number
                          of replies, if any. On click, the replies will become
                          visible, together with a composer.
                        </p>
                        <p>
                          If set to <code>initiallyExpanded</code>, all replies
                          will initially be visible. Both hiding them and
                          replying will be available.
                        </p>
                        <p>
                          If set to <code>alwaysCollapsed</code>, a facepile and
                          the number of replies for a thread will be shown, if
                          there are any, but viewing the replies and replying
                          will be disabled.
                        </p>
                        <p>
                          The default value is <code>initiallyCollapsed</code>.
                        </p>
                      </>
                    ),
                  },
                  'highlight-thread-id': {
                    type: 'string',
                    description: `Passing a thread id will highlight that thread in the ThreadedComments if it exists. If you want to modify how the highlight looks, you can write CSS targeting <code>.cord-threaded-comments.cord-highlighted</code>.`,
                  },
                  autofocus: {
                    type: 'boolean',
                    description: `If \`true\`, the top-level composer input
field will render with the \`autofocus\` HTML attribute set.

The default value is \`false\`.`,
                  },
                  'enable-facepile-tooltip': {
                    type: 'boolean',
                    description: `When \`true\`, a tooltip with the user's displayName will
appear on the Facepile with the profile pictures of the users who have replied to each thread. The default value is \`false\``,
                  },
                  'thread-url': {
                    type: 'string',
                    description: `The URL of a thread is used to direct users to the correct place
when clicking on a notification. The \`thread-url\` defaults to \`window.location.href\`. Setting this 
attribute would override that default.

Note: The URL specified only applies to new threads and will not change the url of existing threads.

The default value is fine for almost all use cases.`,
                  },
                  'thread-name': {
                    type: 'string',
                    description: `Sets the name of the newly-created thread. The thread name is
used in a small number of places where a short name or header is useful to distinguish 
the thread. It defaults to the current page's title.

Note: The title specified only applies to new threads and will not change the title of existing threads.

The default value is nearly always fine.`,
                  },
                  'thread-metadata': {
                    type: 'object',
                    description: `A JSON object that can be used to
store extra data about a thread. Keys are strings, and values can be strings,
numbers or booleans. This only affects newly-created threads and does not 
change the metadata on existing threads.

This attribute will only have an effect on the top-level composer, as the metadata can
only be set on newly-created threads.`,
                  },
                  'show-placeholder': {
                    type: 'boolean',
                    description: `If \`false\`, when the the location specified in the component has no threads, 
ThreadedComments will show a completely empty div. If set to \`true\`, ThreadedComments will instead show a 
placeholder, containing a facepile with the people who will be able to view the threads and a prompt to add a
comment.

The default value is \`true\`.`,
                  },
                  'display-resolved': {
                    type: 'enum',
                    description: displayResolvedDescription,
                  },
                  'cord-threaded-comments:messageclick': {
                    type: 'event',
                    description: `This event is fired when a user clicks on a message in the list. 
The event.detail[0] is an object of type \`{threadId: string; messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message which was clicked. 

For example, you could use this event to scroll your page to the relevant context of the 
clicked thread.`,
                  },
                  'cord-threaded-comments:loading': {
                    type: 'event',
                    description: `This event is fired when the component begins
loading. Use \`cord-threaded-comments:render\` to determine when loading is complete.`,
                  },
                  'cord-threaded-comments:render': {
                    type: 'event',
                    description: `This event is fired when the component has finished
rendering. Use \`cord-threaded-comments:loading\` to determine when a component begins loading.`,
                  },
                  'cord-threaded-comments:messagemouseenter': {
                    type: 'event',
                    description: `This event is fired when the cursor enters a message. 
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the hovered message.

For example, you could use this event to highlight the section of a webpage being 
discussed in the hovered message.`,
                  },
                  'cord-threaded-comments:messagemouseleave': {
                    type: 'event',
                    description: `This event is fired when the cursor leaves a message. 
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the hovered message.

For example, you could use this event to terminate the special behavior initiated with 
\`cord-threaded-comments:messagemouseenter\`.`,
                  },
                  'cord-threaded-comments:messageeditstart': {
                    type: 'event',
                    description: `This event is fired when a user starts editing a message. 
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData}\`
containing information about the message being edited.

Use \`cord-threaded-comments:messageeditend\` to determine when editing is complete.`,
                  },
                  'cord-threaded-comments:messageeditend': {
                    type: 'event',
                    description: `This event is fired when a user completes editing a message. 
The \`event.detail[0]\` is an object of type \`{threadId: string;  messageId: string; thread: ThreadSummary; message: ClientMessageData;}\`
containing information about the message being edited.

Use \`cord-threaded-comments:messageeditstart\` to determine when editing begins.`,
                  },
                  'cord-threaded-comments:threadresolve': {
                    type: 'function',
                    description: `This event is fired when a user resolves a thread.
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary; }\` identifying the thread which was resolved.`,
                  },
                  'cord-threaded-comments:threadreopen': {
                    type: 'function',
                    description: `This event is fired when a user reopens a thread.
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary; }\` identifying the thread which was reopened.`,
                  },
                  'cord-composer:focus': {
                    type: 'event',
                    description: `This event is fired when a user focuses the composer.
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary; }\` containing information about the thread linked to the composer.`,
                  },
                  'cord-composer:blur': {
                    type: 'event',
                    description: `This event is fired when the composer loses focus. 
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary; }\` containing information about the thread linked to the composer.`,
                  },
                  'cord-composer:close': {
                    type: 'event',
                    description: `This event is fired when a user clicks on the close button in the composer. 
The \`event.detail[0]\` is an object of type \`{ threadId: string; thread: ThreadSummary; }\`.

This event will only be fired by the reply composers, as the top-level composer cannot be closed by users.`,
                  },
                  'cord-composer:send': {
                    type: 'function',
                    description: `Callback invoked when a user sends a message from a composer.
The \`event.detail[0]\` is an object of type \`{ threadId: string; messageId: string; thread: ThreadSummary; }\`.`,
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
            This component itself makes use of the following components. Take a
            look at their documentation for what classes are available to target
            within those components.
          </p>
          <ul>
            <li>
              <Link to="/components/cord-composer#CSS-customization">
                Composer
              </Link>
            </li>
            <li>
              <Link to="/components/cord-avatar#CSS-customization">Avatar</Link>
            </li>
          </ul>
          <p>
            The following classes are also available specific to this component:
          </p>
          <CSSClassNameList classnames={threadedCommentsClassnameDocs} />
        </section>
        <HR />
        <NextUp>
          <NextUpCard title="Thread" linkTo={'/components/cord-thread'}>
            Render a single conversation thread
          </NextUpCard>
          <NextUpCard
            title="Thread API"
            linkTo={'/js-apis-and-hooks/thread-api'}
          >
            Fetch data for a particular location or thread ID
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

const displayResolvedDescription = (
  <>
    <p>
      This property tells ThreadedComments how to display resolved threads. It
      takes one of the following values: <code>unresolvedOnly</code>,{' '}
      <code>resolvedOnly</code>, <code>tabbed</code>, <code>interleaved</code>{' '}
      or <code>sequentially</code>.
    </p>
    <p>
      If set to <code>unresolvedOnly</code>, only unresolved threads will be
      shown.
    </p>
    <p>
      If set to <code>resolvedOnly</code>, only resolved threads will be shown.
    </p>
    <p>
      If set to <code>tabbed</code>, two tabs will appear on the top part of the
      component, with "Open" and "Resolved" labels respectively. Clicking on
      each of them will filter for the relevant threads. Note that when resolved
      threads are visible, the composer will not be shown since it doesn't make
      sense to create a new, but already resolved thread.
    </p>
    <p>
      If set to <code>interleaved</code>, whether a thread is resolved or
      unresolved is ignored with this setting. All threads appear together and
      are sorted together (by the order specified by the{' '}
      <code>scrollDirection</code> property) regardless of whether or not they
      are resolved.
    </p>
    <p>
      If set to <code>sequentially</code>, both resolved and unresolved threads
      will appear together. However, unresolved threads will appear first,
      followed by a button that when clicked, will expand a section of resolved
      threads. The order of the three elements (unresolved threads, "show
      resolved" button and resolved threads) is controlled by the
      <code>scrollDirection</code> property. For example, if{' '}
      <code>scrollDirection</code> is set to <code>down</code>, the elements
      will appear in the aforementioned order. Otherwise their order will be
      reversed.
    </p>
    <p>
      The default value is <code>unresolvedOnly</code>.
    </p>
  </>
);

const sortByDescription = (
  <>
    <p>
      This property controls the criteria for how threads are sorted. Combined
      with `scrollDirection`, it determines which threads are "first".
    </p>
    <p>It's a string enum which can have one of the following values:</p>
    <p>
      If set to <code>first_message_timestamp</code>, threads will be sorted by
      the timestamp of the first message in the thread. In other words, threads
      will be sorted based on how recently they were created.
    </p>
    <p>
      If set to <code>most_recent_message_timestamp</code>, threads will be
      sorted by the timestamp of the most recent message in the thread. In other
      words, threads will be sorted based on how recently they were responded
      to.
    </p>
    <p>
      The default value is <code>first_message_timestamp</code>
    </p>
  </>
);

const scrollDirectionDescription = (
  <>
    <p>
      This prop controls the order in which threads are displayed. It takes one
      of two possible values: <code>up</code> or <code>down</code>.
    </p>
    <p>
      If set to <code>up</code>, the newest thread will render at the bottom,
      which means that you will need to scroll up to see older threads.
    </p>
    <p>
      If set to <code>down</code>, the newest thread will render at the top,
      which means that you will need to scroll down to see older threads.
    </p>
    <p>
      Note: Which threads are "newer" is determined by the <code>sortBy</code>{' '}
      property, documented above.
    </p>
    <p>
      The default value is <code>descending</code>.
    </p>
  </>
);

const INITIAL_INTERACTIVE_THREADED_COMMENTS_PROPS: ComponentDropdownMapType<
  Pick<
    ThreadedCommentsReactComponentProps,
    | 'sortBy'
    | 'scrollDirection'
    | 'composerPosition'
    | 'topLevelComposerExpanded'
    | 'showReplies'
  >
> = {
  sortBy: {
    value: 'first_message_timestamp',
    options: ['first_message_timestamp', 'most_recent_message_timestamp'],
    description:
      'Whether to sort by the first message timestamp or the most recently replied to thread.',
  },
  scrollDirection: {
    value: 'up',
    options: ['up', 'down'],
    description: 'The direction in which the sorted threads appear.',
  },
  composerPosition: {
    value: 'bottom',
    options: ['top', 'bottom', 'none'],
    description:
      'Whether the composer will be positioned above messages, below messages, or not visible at all.',
  },
  topLevelComposerExpanded: {
    value: false,
    options: [true, false],
    description: 'Whether the composer will be expanded or not.',
  },
  showReplies: {
    value: 'initiallyCollapsed',
    options: ['initiallyCollapsed', 'initiallyExpanded', 'alwaysCollapsed'],
    description:
      'Whether to initially show the replies or not show them at all',
  },
};
