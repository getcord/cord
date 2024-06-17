/** @jsxImportSource @emotion/react */

import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { composerClassnamesDocs } from 'external/src/components/ui3/composer/Composer.classnames.ts';
import { Composer } from '@cord-sdk/react';
import type { ComposerReactComponentProps } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import {
  DOCS_LIVE_PAGE_LOCATIONS,
  LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX,
} from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import type { ComponentDropdownMapType } from 'docs/server/routes/components/types.ts';
import { useLiveDemoSelect } from 'docs/server/hooks/useLiveDemoSelect.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

export function CordComposer3() {
  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX}${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  const {
    interactiveProps: interactiveComposerProps,
    componentSelects,
    liveDemoCssStyles,
  } = useLiveDemoSelect(INITIAL_INTERATIVE_COMPOSER_PROPS);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Composer"
      pageSubtitle={`Create new conversations or reply to existing ones`}
      showTableOfContents={true}
    >
      <LiveDemoCard showTag={false} css={liveDemoCssStyles}>
        {threadID && (
          <>
            {componentSelects}
            <Composer
              location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveComposer }}
              threadId={threadID}
              style={{ width: 300 }}
              autofocus
              {...interactiveComposerProps}
            />
          </>
        )}
      </LiveDemoCard>
      <section>
        <H2>When to use</H2>
        <p>
          The <code>Composer</code> component renders a message composer to
          create new threads and to reply to existing ones.
        </p>
        <p>
          <strong>This component pairs well with:</strong>
        </p>
        <ul>
          <li>
            <Link to="/components/cord-thread">Thread</Link> →
          </li>
          <li>
            <Link to="/components/cord-thread-list">Thread List</Link> →
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
              snippet: `import { Composer } from "@cord-sdk/react";
  
  export const Example = () => {
    return (
      <Composer
        threadId={"<any string that is unique across your entire application>"}
        groupId="my-group"
        location={{ page: "index" }}
        onFocus={({ threadId }) =>
          console.log('Focussed <Composer /> threadId =', threadId)
        }
        onBlur={({ threadId }) =>
          console.log('Blurred <Composer /> threadId =', threadId)
        }
        onClose={({ threadId }) =>
          console.log('Closed <Composer /> threadId =', threadId)
        }
        onSend={({ threadId, messageId }) =>
        console.log('Sent a message from <Composer /> threadId =', threadId, 'messageId=', messageId)
      }
        style={{
          width: "300px" // Recommended so that the composer doesn't stretch horizontally based on its content
        }}
      />
    );
  };`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `<cord-composer
    thread-id="<id of thread>"
    group-id="my-group"
    location='{ page: "index" }'
    // Setting a width is recommended so that the composer doesn't stretch horizontally based on its content
    style="width: 300px;"
  ></cord-composer>
  
  <script>
    document
      .getElementById("composer")
      .addEventListener("cord-composer:close", (event) => {
        console.log("composer close button clicked, threadId=", event.detail[0].threadId);
      });
  </script>
  `,
            },
          ]}
        />
      </section>
      <HR />
      <EmphasisCard>
        <Link
          to="/js-apis-and-hooks/initialization"
          css={{ display: 'inline-block', '&&': { textDecoration: 'none' } }}
        >
          <p>
            <strong>Want to customize the features in the composer?</strong>
          </p>
          <p>
            The buttons shown at the bottom of the composer may vary depending
            on which Cord features are enabled. Check out initialization to
            learn more about configuring these features at load time. →
          </p>
        </Link>
      </EmphasisCard>
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
                'autofocus',
                'showExpanded',
                'showCloseButton',
                'disabled',
                'size',
                'threadUrl',
                'messageMetadata',
                'threadMetadata',
                'onFocus',
                'onBlur',
                'onClose',
                'onSend',
                'onThreadReopen',
              ],
              required: [],
              properties: {
                threadId: {
                  type: 'string',
                  description: `An [arbitrary string](/reference/identifiers) that uniquely identifies a
  thread. Messages sent will go to the provided thread ID. If the thread ID doesn't exist yet, it will be created. If no ID is passed, each message sent will create a new thread.
  
  
  *Warning!*
  An important restriction of working with thread identifiers
  is that they must be unique across your entire application.
  You can't use the same thread identifier in two separate
  groups. This is an intentional limitation imposed by Cord.`,
                },
                groupId: {
                  type: 'string',
                  description: `The [group](/rest-apis/groups) ID which this thread
  should belong to.  This controls which users will be able to see the thread.
  
  Required when creating a new thread.  If loading a composer for an existing thread
  ID, specifying a group ID which does not match the group the thread belongs to will
  result in an error.`,
                },
                location: {
                  type: 'string',
                  description: `The [location](/reference/location/) value set for
  the newly created threads. 
  
  If unset, this will default to the location provided to the [\`useCordLocation\`](/js-apis-and-hooks/initialization#Hooks/) hook if that was used. Otherwise, will default to the current URL for
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
                autofocus: {
                  type: 'boolean',
                  description: `If \`true\`, the composer input
  field will render with the \`autofocus\` HTML attribute set.
  
  The default value is \`false\`.`,
                },
                showExpanded: {
                  type: 'boolean',
                  description: `If \`true\`, the composer will always
  appear expanded. This means that it will always show the button list (such as
  the mention button and emoji button) right below the editor. 
  
  If \`false\`, the composer will start from a single-line state, but will expand
  when a user clicks in the editor or starts typing. It will return to a
  single-line state when it loses focus and there is no input in the editor.
  
  The default value is \`false\`.`,
                },
                showCloseButton: {
                  type: 'boolean',
                  description: `If \`true\` the composer will show a close button next to the send button that will trigger the \`onClose\` callback when clicked.
                    
  The default value is \`false\`.`,
                },
                disabled: {
                  type: 'boolean',
                  description: `If \`true\` the composer will render in a disabled state, preventing writing or sending a message. This can be used, for example,
  to visually suggest the user can not or should not send a message to a thread. However, it is not a permission control, since it does not prevent the user
  from sending to the thread directly (such as via the [JS API](/js-apis-and-hooks/thread-api/sendMessage)). Only Cord's [groups](/reference/permissions) should be
  used for permissions.
  
  The default value is \`false\`.`,
                },
                size: {
                  type: 'string',
                  enum: ['small', 'medium', 'large'],
                  description: `This customizes the size of the composer. You can set it to one of the three following values:
  
  1. \`small\`: The composer will start in a single-line state and expand to show the button list without a separator when a user clicks in the editor or starts typing. It will return to a
  single-line state when it loses focus and there is no input in the editor.
  2. \`medium\`: The composer will start in a single-line state and expand to show the button list with a separator when a user clicks in the editor or starts typing. It will return to a
  single-line state when it loses focus and there is no input in the editor.
  3. \`large\`: The composer will start with a size similar to the expanded state but without the button list and expand minimally to show the button list when a user clicks in the editor or starts typing. It will return to the state without the button list when it loses focus and there is no input in the editor.
  
  The default setting is \`medium\`.
  `,
                },
                threadUrl: {
                  type: 'string',
                  description: `The URL of a thread is used to direct users to the correct place
  when clicking on a notification. The \`threadUrl\` defaults to \`window.location.href\`. Setting this 
  property would override that default.
  
  Note: The URL specified only applies to new threads and will not change the url of existing threads.
  
  The default value is fine for almost all use cases.`,
                },
                messageMetadata: {
                  type: 'object',
                  description: `A JSON object that can be used to
    store metadata about a message on creation. Keys are strings, and values can be strings,
    numbers or booleans.`,
                },
                threadMetadata: {
                  type: 'object',
                  description: `A JSON object that can be used to
  store extra data about a thread. Keys are strings, and values can be strings,
  numbers or booleans. This only affects newly-created threads and does not 
  change the metadata on existing threads.
    
  This property will only have an effect if the specific composer component is used to create
  a new thread.`,
                },
                onFocus: {
                  type: 'function',
                  description: `Callback invoked when a user focuses the composer.
                    The callback is passed an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                onBlur: {
                  type: 'function',
                  description: `Callback invoked when the composer loses focus.
                    The callback is passed an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                onClose: {
                  type: 'function',
                  description: `Callback invoked when a user clicks on the close
                  button in the composer. 
                  The callback is passed an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                onSend: {
                  type: 'function',
                  description: `Callback invoked when a user sends a message
                  from the composer. 
                  The callback is passed an object containing the \`messageId\` of the sent message, \`threadId\` and \`thread\` which is the [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                onThreadReopen: {
                  type: 'function',
                  description: `If a threadId is specified in the composer component, it is possible that this thread is resolved.
  In which case, the composer will not be available to use and will contain a button labeled: "Reopen to reply". This callback will be
  invoked when a user clicks on this button.
  
  The callback is passed an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: [
                'thread-id',
                'group-id',
                'location',
                'thread-name',
                'autofocus',
                'show-expanded',
                'show-close-button',
                'disabled',
                'size',
                'thread-url',
                'message-metadata',
                'thread-metadata',
                'cord-composer:focus',
                'cord-composer:blur',
                'cord-composer:close',
                'cord-composer:send',
                'cord-composer:threadreopen',
              ],
              required: ['thread-id'],
              properties: {
                'thread-id': {
                  type: 'string',
                  description: `An [arbitrary string](/reference/identifiers) that uniquely identifies a
  thread. Messages sent will go to the provided thread ID. If the thread ID doesn't exist yet, it will be created. If no ID is passed, each message sent will create a new thread.
  
  *Warning!*
  An important restriction of working with thread identifiers
  is that they must be unique across your entire application.
  You can't use the same thread identifier in two separate
  groups. This is an intentional limitation imposed by Cord.`,
                },
                'group-id': {
                  type: 'string',
                  description: `The [group](/rest-apis/groups) ID which this thread
  should belong to.  This controls which users will be able to see the thread.
                    
  Required when creating a new thread.  If loading a composer for an existing thread
  ID, specifying a group ID which does not match the group the thread belongs to will
  result in an error.`,
                },
                location: {
                  type: 'string',
                  description: `The [location](/reference/location/) value set for
  the newly created threads. 
  
  If unset, this field will default to the location provided to the [\`useCordLocation\`](/js-apis-and-hooks/initialization#Hooks/) hook if that was used. Otherwise, will default to the current URL for
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
                autofocus: {
                  type: 'boolean',
                  description: `If \`true\`, the composer input
  field will render with the \`autofocus\` HTML attribute set.
  
  The default value is \`false\`.`,
                },
                'show-expanded': {
                  type: 'boolean',
                  description: `If \`true\`, the composer will always
  appear expanded. This means that it will always show the button list (such as
  the mention button and emoji button) right below the editor. 
  
  If \`false\`, the composer will start from a single-line state, but will expand
  when a user clicks in the editor or starts typing. It will return to a
  single-line state when it loses focus and there is no input in the editor.
  
  The default value is \`false\`.`,
                },
                'show-close-button': {
                  type: 'boolean',
                  description: `If \`true\` the composer will show a close button next to the send button that will trigger the \`cord-composer:close\` event when clicked.
                    
  The default value is \`false\`.`,
                },
                disabled: {
                  type: 'boolean',
                  description: `If \`true\` the composer will render in a disabled state, preventing writing or sending a message. This can be used, for example,
  to visually suggest the user can not or should not send a message to a thread. However, it is not a permission control, since it does not prevent the user
  from sending to the thread directly (such as via the [JS API](/js-apis-and-hooks/thread-api/sendMessage)). Only Cord's [groups](/reference/permissions) should be
  used for permissions.
  
  The default value is \`false\`.`,
                },
                size: {
                  type: 'string',
                  enum: ['small', 'medium', 'large'],
                  description: `This customizes the size of the composer. You can set it to one of the three following values:
  
  1. \`small\`: The composer will start in a single-line state and expand to show the button list without a separator when a user clicks in the editor or starts typing. It will return to a
  single-line state when it loses focus and there is no input in the editor.
  2. \`medium\`: The composer will start in a single-line state and expand to show the button list with a separator when a user clicks in the editor or starts typing. It will return to a
  single-line state when it loses focus and there is no input in the editor.
  3. \`large\`: The composer will start with a size similar to the expanded state but without the button list and expand minimally to show the button list when a user clicks in the editor or starts typing. It will return to the state without the button list when it loses focus and there is no input in the editor.
  
  The default setting is \`medium\`.
  `,
                },
                'thread-url': {
                  type: 'string',
                  description: `The URL of a thread is used to direct users to the correct place
  when clicking on a notification. The \`thread-url\` defaults to \`window.location.href\`. Setting this 
  attribute would override that default.
  
  Note: The URL specified only applies to new threads and will not change the url of existing threads.
  
  The default value is fine for almost all use cases.`,
                },
                'message-metadata': {
                  type: 'object',
                  description: `A JSON object that can be used to
    store metadata about a message on creation. Keys are strings, and values can be strings,
    numbers or booleans.`,
                },
                'thread-metadata': {
                  type: 'object',
                  description: `A JSON object that can be used to
  store extra data about a thread. Keys are strings, and values can be strings,
  numbers or booleans. This only affects newly-created threads and does not 
  change the metadata on existing threads.
    
  This attribute will only have an effect if the specific composer component is used to create
  a new thread.`,
                },
                'cord-composer:focus': {
                  type: 'event',
                  description: `This event is fired when a user focuses the composer.
                     The \`event.detail[0]\` gives an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                'cord-composer:blur': {
                  type: 'event',
                  description: `This event is fired when the composer loses focus. The \`event.detail[0]\` gives an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                'cord-composer:close': {
                  type: 'event',
                  description: `This event is fired when a user clicks on the close button in the composer. The \`event.detail[0]\` gives an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
                },
                'cord-composer:send': {
                  type: 'event',
                  description: `This event is fired when a message is sent from the composer. The \`event.detail[0]\` gives an object containing the \`threadId\`, \`messageId\` and \`thread\` [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) linked to the composer.`,
                },
                'cord-composer:threadreopen': {
                  type: 'function',
                  description: `If a threadId is specified in the composer component, it is possible that this thread is resolved.
  In which case, the composer will not be available to use and will contain a button labeled: "Reopen to reply". This event will be
  fired when a user clicks on this button.
  
  The \`event.detail[0]\` gives an object of type \`{ threadId: string; thread: ThreadSummary | null }\` containing the ID and [summary](/js-apis-and-hooks/thread-api/observeThread#thread-2) of the thread linked to the composer.`,
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
        <CSSClassNameList classnames={composerClassnamesDocs} />
      </section>
    </Page>
  );
}

type InteractiveComposerComponentProps = Required<
  Pick<ComposerReactComponentProps, 'size' | 'showExpanded' | 'showCloseButton'>
>;

type ComposerComponentOptionsType =
  ComponentDropdownMapType<InteractiveComposerComponentProps>;

const INITIAL_INTERATIVE_COMPOSER_PROPS: ComposerComponentOptionsType = {
  size: {
    value: 'medium',
    options: ['small', 'medium', 'large'],
    description: 'Change the overall size of the composer',
  },
  showExpanded: {
    value: true,
    options: [true, false],
    description: 'Always show the menu options below',
  },
  showCloseButton: {
    value: false,
    options: [true, false],
    description: 'Show the close button beside the menu options',
  },
};
