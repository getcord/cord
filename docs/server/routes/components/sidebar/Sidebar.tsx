/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { DeprecatedComponentWarning } from 'docs/server/routes/components/Warning/DeprecatedComponentWarning.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function Sidebar() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Sidebar (Deprecated)"
      pageSubtitle={`Self-contained collaboration mini-application`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <DeprecatedComponentWarning componentName="Sidebar">
          <p>
            To display a series of comments or threaded conversations on your
            page, we strongly recommend using{' '}
            <Link to="/components/cord-threaded-comments">
              Cord Threaded Comments
            </Link>
            , combined with{' '}
            <Link to="/components/cord-notification-list">
              Cord Notification List
            </Link>{' '}
            for better customizability and a more native feel.
          </p>
        </DeprecatedComponentWarning>
        <LiveDemoCard showAsRow={true}>
          <div
            css={{
              height: 600,
              flex: 1,
              background: '#F7F6FF',
              borderRadius: 4,
            }}
          >
            <iframe
              css={{ border: 'none' }}
              src="/components/cord-sidebar-mini-app"
              height="100%"
              width="100%"
            />
          </div>
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>Sidebar</code> component renders the Cord sidebar,
            positioned fixed on the right side of your website. You can
            customize its width, and you can use the{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: 'onOpen',
                [ClientLanguageDisplayNames.VANILLA_JS]: 'open',
              }}
            />{' '}
            and{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: 'onClose',
                [ClientLanguageDisplayNames.VANILLA_JS]: 'close',
              }}
            />{' '}
            <InlineCode
              readFromPreferencesFor="client"
              renderAsFragment={true}
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: 'callbacks',
                [ClientLanguageDisplayNames.VANILLA_JS]: 'events',
              }}
            />{' '}
            to adjust your website's CSS so the sidebar doesn't overlap with
            your content.
          </p>
          <p>
            <code>Sidebar</code> remains primarily as backwards-compatibility
            for existing applications. It can also rarely be useful as an
            instant proof-of-concept before committing to a deeper integration.
          </p>
          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-sidebar-launcher">
                Sidebar Launcher
              </Link>{' '}
              →
            </li>
            <li>
              <Link to="/components/cord-page-presence">Page Presence</Link> →
            </li>
            <li>
              <Link to="/components/cord-presence-facepile">
                Presence Facepile
              </Link>{' '}
              →
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
                snippet: `import { Sidebar } from "@cord-sdk/react";

export const Example = () => (
  <Sidebar
    groupID="my-group"
    showPresence={true}
    onOpen={() => {
      console.log("sidebar is open");
    }}
  />
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-sidebar group-id="my-group" show-presence="true" id="sidebar"></cord-sidebar>

<script>
  document
    .getElementById("sidebar")
    .addEventListener("cord-sidebar:open", () => {
      console.log("sidebar is open");
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
                  'location',
                  'groupId',
                  'open',
                  'showCloseButton',
                  'showPresence',
                  'showInbox',
                  'excludeViewerFromPresence',
                  'showLauncher',
                  'showAllActivity',
                  'showPinsOnPage',
                  'threadName',
                  'onOpen',
                  'onClose',
                  'onThreadOpen',
                  'onThreadClose',
                ],
                required: ['groupId'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location) for the sidebar.`,
                  },
                  groupId: {
                    type: 'string',
                    description: `The [group](/rest-apis/groups) whose threads the
                  component should load, and in which new threads should be written.
                  Note that the Inbox in the Sidebar still loads threads from all 
                  groups the user is in.`,
                  },
                  open: {
                    type: 'boolean',
                    description: `If set to true, the sidebar will be open visible.
                    If set to false, the sidebar will be hidden.
                    This value defaults to \`true\`. `,
                  },

                  showCloseButton: {
                    type: 'boolean',
                    description: `If set to true, the sidebar will display close button
                   in its top left corner. If set to false, no close button will
                   be shown. The \`onClose\` callback will be triggered when
                   this close button is clicked (see below). You would set this
                   to \`false\` if you wanted your application to have full
                   control over whether the sidebar is open or closed, and not
                   the user, for example. You would also set this to \`false\`
                   if you wanted the sidebar to be permanently open.
                   This value defaults to \`true\`.`,
                  },

                  showPresence: {
                    type: 'boolean',
                    description: `If set to true, the sidebar will display a presence
                    facepile in its top navigation. This facepile will display durable
                    presence for the current \`location\`. If set to false, the sidebar
                    will not display a facepile.
                    This value defaults to \`true\`.`,
                  },

                  showInbox: {
                    type: 'boolean',
                    description: `If set to true, sidebar will include an
                    [inbox launcher](/components/cord-inbox-launcher) button in
                    its top navigation. If set to false, no inbox launcher
                    button will be shown.  This value defaults to \`true\`.`,
                  },

                  excludeViewerFromPresence: {
                    type: 'boolean',
                    description: `If set to true, the users viewing the sidebar
                    will not see themselves in the presence facepile. They will
                    still be marked as present. If set to false, users viewing the
                    sidebar will be shown in the presence facepile.
                    This value defaults to \`true\`.`,
                  },

                  showLauncher: {
                    type: 'boolean',
                    description: `If set to true, when the sidebar is closed, a floating
                    action button will be displayed in the bottom right corner of the screen
                    enabling the viewing user to open the sidebar. If set to false, no floating
                    action button will be shown. If you're setting this value to false, you must
                    ensure users have the ability to open and close the sidebar from within your
                    application. Set this value to \`false\` if you use your own sidebar launcher
                    or if you use Cord's [sidebar launcher component](/components/cord-sidebar-launcher).
                    This value defaults to \`true\`.`,
                  },
                  showAllActivity: {
                    type: 'boolean',
                    description: `If set to \`true\`, the sidebar will display an  "All Activity"
                    button in the top navigation bar.  If set to \`false\`, this button will be
                    hidden.
                    This value defaults to \`true\`.`,
                  },

                  showPinsOnPage: {
                    type: 'boolean',
                    description: `If \`true\`, any annotation pins matching the
                    \`Sidebar\`'s [location](/reference/location) will be
                    rendered. If the sidebar is displaying annotation pins for
                    the current location, but you don't want those pins to
                    appear, setting this value to \`false\` will prevent the
                    sidebar from rendering them. (This does not prevent *other*
                    components from rendering their own annotation pins, such as
                    the [floating threads](/components/cord-floating-threads)
                    component.) For any location where there are no annotations,
                    this property has no effect.  This value defaults to
                    \`true\`.`,
                  },
                  threadName: {
                    type: 'string',
                    description: `Sets the name of any threads created from the
                    sidebar. The thread name is used in a small number of places
                    where a short name or header is useful to distinguish the
                    thread; the default value is nearly always fine. A
                    newly-created thread will have its title set to this value,
                    but the title of any existing threads will not be changed.
                    This value defaults to the current page title (document.title).
                  `,
                  },
                  onOpen: {
                    type: 'function',
                    description: `Callback invoked when sidebar is opened. The
function will be called passed a single argument, an object
with the following properties:

\`\`\`js
{
  width: <number of pixels the sidebar will occupy>
}
\`\`\`

An example of how to use this callback:
\`\`\`js
  <Sidebar
    onOpen={({ width }) => {
      document.body.style.paddingRight = width + 'px';
    }}
  />
\`\`\`
`,
                  },
                  onClose: {
                    type: 'function',
                    description: `Callback invoked when sidebar is closed`,
                  },

                  onThreadOpen: {
                    type: 'function',
                    description: `Callback invoked when one of the threads in the
                  sidebar is opened. The callback is passed a single argument,
                  the ID of the opened thread.

\`\`\`js
import { useCallback } from 'react';
import { Sidebar } from '@cord-sdk/react';

const MyPage = () => {

  const onThreadOpen = useCallback((threadID) => {
    if (threadID.startsWith('cord:')) {
      // Cord-created thread IDs all begin with this prefix
      return;
    }

    // This code assumes that you've used threadIDs that match
    // key elements in your page, which have \`id\` attributes
    // of the same value. That way, when the thread is opened
    // in the Cord sidebar, you can scroll your page to the
    // corresponding element.
    window.location.hash = threadID;
  }, []);

  return (
    <>
      <div>My app's page contents</div>
      <Sidebar onThreadOpen={onThreadOpen} />
    </>
  );
}

\`\`\`
                  `,
                  },
                  onThreadClose: {
                    type: 'function',
                    description: `Callback invoked when one of the threads in the
                  sidebar is closed. The callback is passed a single argument,
                  the ID of the opened thread.

\`\`\`js
import { useCallback } from 'react';
import { Sidebar } from '@cord-sdk/react';

const MyPage = () => {

  // See the codeblock above for more context.
  const onThreadClose = useCallback((threadID) => {
    if (threadID.startsWith('cord:')) {
      // Cord-created thread IDs all begin with this prefix
      return;
    }

    if (window.location.hash === threadID) {
      window.location.hash = threadID;
    }
  }, []);

  return (
    <>
      <div>My app's page contents</div>
      <Sidebar onThreadClose={onThreadClose} />
    </>
  );
}

\`\`\`
                  `,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'location',
                  'group-id',
                  'open',
                  'show-close-button',
                  'show-presence',
                  'show-inbox',
                  'exclude-viewer-from-presence',
                  'show-launcher',
                  'show-all-activity',
                  'show-pins-on-page',
                  'thread-name',
                  'cord-sidebar:open',
                  'cord-sidebar:close',
                  'cord-sidebar:threadopen',
                  'cord-sidebar:threadclose',
                ],
                required: ['group-id'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location) for the sidebar.`,
                  },
                  'group-id': {
                    type: 'string',
                    description: `The [group](/rest-apis/groups) whose threads the
                  component should load, and in which new threads should be written.
                  Note that the Inbox in the Sidebar still loads threads from all 
                  groups the user is in.`,
                  },
                  open: {
                    type: 'boolean',
                    description: `If set to true, the sidebar will be open visible.
                    If set to false, the sidebar will be hidden.
                    This value defaults to \`true\`. `,
                  },
                  'show-close-button': {
                    type: 'boolean',
                    description: `If set to true, the sidebar will display close button
                   in its top left corner. If set to false, no close button will
                   be shown. The \`cord-sidebar:open\` event will be triggered when
                   this close button is clicked (see below). You would set this
                   to \`false\` if you wanted your application to have full
                   control over whether the sidebar is open or closed, and not
                   the user, for example. You would also set this to \`false\`
                   if you wanted the sidebar to be permanently open.
                   This value defaults to \`true\`.`,
                  },

                  'show-presence': {
                    type: 'boolean',
                    description: `If set to true, the sidebar will display a presence
                    facepile in its top navigation. This facepile will display durable
                    presence for the current \`location\`. If set to false, the sidebar
                    will not display a facepile.
                    This value defaults to \`true\`.`,
                  },

                  'show-inbox': {
                    type: 'boolean',
                    description: `If set to true, sidebar will include an
                    [inbox launcher](/components/cord-inbox-launcher) button in
                    its top navigation. If set to false, no inbox launcher
                    button will be shown.  This value defaults to \`true\`.`,
                  },

                  'exclude-viewer-from-presence': {
                    type: 'boolean',
                    description: `If set to true, the users viewing the sidebar
                    will not see themselves in the presence facepile. They will
                    still be marked as present. If set to false, users viewing the
                    sidebar will be shown in the presence facepile.
                    This value defaults to \`true\`.`,
                  },

                  'show-launcher': {
                    type: 'boolean',
                    description: `If set to true, when the sidebar is closed, a floating
                    action button will be displayed in the bottom right corner of the screen
                    enabling the viewing user to open the sidebar. If set to false, no floating
                    action button will be shown. If you're setting this value to false, you must
                    ensure users have the ability to open and close the sidebar from within your
                    application. Set this value to \`false\` if you use your own sidebar launcher
                    or if you use Cord's [sidebar launcher component](/components/cord-sidebar-launcher).
                    This value defaults to \`true\`.`,
                  },
                  'show-all-activity': {
                    type: 'boolean',
                    description: `If set to \`true\`, the sidebar will display an  "All Activity"
                    button in the top navigation bar.  If set to \`false\`, this button will be
                    hidden.
                    This value defaults to \`true\`.`,
                  },

                  'show-pins-on-page': {
                    type: 'boolean',
                    description: `If \`true\`, any annotation pins matching the
                    \`Sidebar\`'s [location](/reference/location) will be
                    rendered. If the sidebar is displaying annotation pins for
                    the current location, but you don't want those pins to
                    appear, setting this value to \`false\` will prevent the
                    sidebar from rendering them. (This does not prevent *other*
                    components from rendering their own annotation pins, such as
                    the [floating threads](/components/cord-floating-threads)
                    component.) For any location where there are no annotations,
                    this property has no effect.  This value defaults to
                    \`true\`.`,
                  },
                  'thread-name': {
                    type: 'string',
                    description: `Sets the name of any threads created from the
                    sidebar. The thread name is used in a small number of places
                    where a short name or header is useful to distinguish the
                    thread; the default value is nearly always fine. A
                    newly-created thread will have its title set to this value,
                    but the title of any existing threads will not be changed.
                    This value defaults to the current page title (document.title).
                  `,
                  },
                  'cord-sidebar:open': {
                    type: 'event',
                    description: `This event is fired when sidebar is opened.

\`\`\`js
document.querySelector('cord-sidebar').addEventListener(
  'cord-sidebar:open',
  (e) => {
    document.body.style.marginRight = e.detail[0].width + 'px';
  }
);
\`\`\`
`,
                  },
                  'cord-sidebar:close': {
                    type: 'event',
                    description: `This event is fired when sidebar is closed.

\`\`\`js
document.querySelector('cord-sidebar').addEventListener(
  'cord-sidebar:close',
  (e) => {
    document.body.style.marginRight = '0';
  }
);
\`\`\`
`,
                  },
                  'cord-sidebar:threadopen': {
                    type: 'event',
                    description: `Event fired when one of the threads in the
                  sidebar is opened. The event.detail[0] is the thread-id of
                  the opened thread.

\`\`\`js
document.querySelector('cord-sidebar').addEventListener(
  'cord-sidebar:threadopen',
  (e) => {
    const threadID = e.detail[0];
    if (threadID.startsWith('cord:')) {
      // Cord-created thread IDs all begin with this prefix
      return;
    }

    // This code assumes that you've used threadIDs that match
    // key elements in your page, which have \`id\` attributes
    // of the same value. That way, when the thread is opened
    // in the Cord sidebar, you can scroll your page to the
    // corresponding element.
    window.location.hash = threadID;
  }
);
\`\`\`
                  `,
                  },
                  'cord-sidebar:threadclose': {
                    type: 'event',
                    description: `Event fired when one of the threads in the
                  sidebar is closed. The event.detail[0] is the thread-id of
                  the opened thread.

\`\`\`js
document.querySelector('cord-sidebar').addEventListener(
  'cord-sidebar:threadclose',
  (e) => {
    const threadID = e.detail[0];
    if (threadID.startsWith('cord:')) {
      // Cord-created thread IDs all begin with this prefix
      return;
    }

    if (window.location.hash === threadID) {
      window.location.hash = '';
    }
  }
);
\`\`\`
                  `,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <NextUp>
          <NextUpCard
            title="Sidebar Launcher"
            linkTo="/components/cord-sidebar-launcher"
          >
            Integrate the button to open the sidebar into your UI
          </NextUpCard>
          <NextUpCard
            title="Page Presence"
            linkTo="/components/cord-page-presence"
          >
            Let people know who else is on the page
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

export default Sidebar;
