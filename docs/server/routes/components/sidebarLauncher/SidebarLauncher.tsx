/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

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

function SidebarLauncher() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Sidebar Launcher (Deprecated)"
      pageSubtitle={`Open and close the sidebar from anywhere`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <DeprecatedComponentWarning componentName="Sidebar Launcher">
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
            css={{ height: 600, flex: 1, background: '#FFF', borderRadius: 4 }}
          >
            <iframe
              css={{ border: 'none' }}
              src="/components/cord-sidebar-launcher-mini-app"
              height="100%"
              width="100%"
            />
          </div>
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>SidebarLauncher</code> component allows you to replace
            that default button with a customizable one that you can choose to
            place anywhere in your application UI.
          </p>
          <p>
            By itself, the <code>Sidebar</code> component will add a floating
            launcher button, positioned fixed in the bottom-right corner of your
            app in the browser; clicking this launcher opens and closes the
            sidebar.
          </p>
          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-sidebar">Sidebar</Link> →
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
          <EmphasisCard>
            <p>
              If you use this component, remember to pass{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: 'showLauncher={false}',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    'show-launcher="false"',
                }}
              />{' '}
              to{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<Sidebar />',
                  [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-sidebar>',
                }}
              />
              .
            </p>
          </EmphasisCard>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { Sidebar, SidebarLauncher } from "@cord-sdk/react";

export const Example = () => (
  <body>
    <div id="header">
      <SidebarLauncher label="Collaborate" inboxBadgeStyle="badge" />
    </div>
    <Sidebar showLauncher={false} />
  </body>
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<body>
  <div id="header">
    <cord-sidebar-launcher label="Collaborate" inbox-badge-style="badge">
    </cord-sidebar-launcher>
  </div>
  <cord-sidebar show-launcher="false"></cord-sidebar>
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
                  'label',
                  'iconUrl',
                  'inboxBadgeStyle',
                  'disabled',
                  'onClick',
                ],
                required: [],
                properties: {
                  label: {
                    type: 'string',
                    description: `The text label on the button. If set to an empty
string, the button will not have a label.

The default is set to \`Comment\`.`,
                  },
                  iconUrl: {
                    type: 'string',
                    description: `If provided, changes the URL of the icon. If set
to an empty string, the button will not have an icon.

The default is set to \`Comment icon\`.`,
                  },

                  inboxBadgeStyle: {
                    type: 'string',
                    description: `The style of the badge that appears on the
button if there are inbox items. One of \`badge_with_count\`, \`badge\` or
\`none\`.

The default is set to \`badge_with_count\`.`,
                  },

                  disabled: {
                    type: 'boolean',
                    description: `Whether the button should be disabled.

The default is set to \`false\`.`,
                  },

                  onClick: {
                    type: 'boolean',
                    description: `Callback invoked when the launcher button
is clicked.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'label',
                  'icon-url',
                  'inbox-badge-style',
                  'disabled',
                  'cord-sidebar-launcher:click',
                ],
                required: [],
                properties: {
                  label: {
                    type: 'string',
                    description: `The text label on the button. If set to an empty
string, the button will not have a label.

The default is set to \`Comment\`.`,
                  },
                  'icon-url': {
                    type: 'string',
                    description: `If provided, changes the URL of the icon. If set
to an empty string, the button will not have an icon.

The default is set to \`Comment icon\`.`,
                  },
                  'inbox-badge-style': {
                    type: 'string',
                    description: `The style of the badge that appears on the
button if there are inbox items. One of \`badge_with_count\`, \`badge\` or
\`none\`.

The default is set to \`badge_with_count\`.`,
                  },
                  disabled: {
                    type: 'boolean',
                    description: `Whether the button should be disabled.

The default is set to \`false\`.`,
                  },
                  'cord-sidebar-launcher:click': {
                    type: 'event',
                    description: `This event is fired when the launcher button is
clicked.`,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <NextUp>
          <NextUpCard title="Sidebar" linkTo="/components/cord-sidebar">
            Integrate the sidebar within your product
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

export default SidebarLauncher;
