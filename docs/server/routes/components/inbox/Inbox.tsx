/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { Inbox } from '@cord-sdk/react';
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
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';
import { DeprecatedComponentWarning } from 'docs/server/routes/components/Warning/DeprecatedComponentWarning.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordInbox() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Inbox (Deprecated)"
      pageSubtitle={`Find all messages relevant to you, in one handy place`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <DeprecatedComponentWarning componentName="Inbox">
          <p>
            To display notifications and help users keep up with conversation,
            we strongly recommend using{' '}
            <Link to="/components/cord-notification-list">
              Cord Notification List
            </Link>
            .
          </p>
        </DeprecatedComponentWarning>
        <LiveDemoCard>
          <Inbox style={{ width: 400, height: 600 }} />
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>Inbox</code> is where you can find new and recent messages
            that you are subscribed to. If enabled, this is also where users can
            find the settings page.
          </p>
          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-inbox-launcher">Inbox Launcher</Link> →
            </li>
            <li>
              <Link to="/components/cord-page-presence">Page Presence</Link> →
            </li>
          </ul>
        </section>
        <HR />
        <section>
          <H2>How to use</H2>
          <EmphasisCard>
            <p>
              If you use the{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<InboxLauncher />',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    '<cord-inbox-launcher>',
                }}
              />{' '}
              with default settings, you do <strong>not</strong> need to add a
              separate{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<Inbox />',
                  [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-inbox>',
                }}
              />{' '}
              component to your page. However, if you use the{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<InboxLauncher />',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    '<cord-inbox-launcher>',
                }}
              />{' '}
              and set{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]:
                    'showInboxOnClick={false}',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    'show-inbox-on-click="false"',
                }}
              />
              , then you <strong>will</strong> need to add a separate{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<Inbox />',
                  [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-inbox>',
                }}
              />{' '}
              component. In that case, you can connect the components by adding
              event listeners for the{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<InboxLauncher />',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    '<cord-inbox-launcher>',
                }}
              />{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: 'onClick',
                  [ClientLanguageDisplayNames.VANILLA_JS]: 'click',
                }}
              />{' '}
              <InlineCode
                readFromPreferencesFor="client"
                renderAsFragment={true}
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: 'event handler',
                  [ClientLanguageDisplayNames.VANILLA_JS]: 'event',
                }}
              />{' '}
              and the{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<Inbox />',
                  [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-inbox>',
                }}
              />{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: 'closeRequested',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    'cord-inbox:closeRequested',
                }}
              />{' '}
              <InlineCode
                readFromPreferencesFor="client"
                renderAsFragment={true}
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: 'event handler',
                  [ClientLanguageDisplayNames.VANILLA_JS]: 'event',
                }}
              />{' '}
              and running your own functions as required.
            </p>
          </EmphasisCard>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { Inbox } from "@cord-sdk/react";

export const Example = () => (
  <body>
    <div id="header">
      <Inbox showCloseButton={false} style={{ height: "600px", width: "400px;" }} />
    </div>
  </body>
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<body>
  <div id="header">
    <cord-inbox show-close-button="false" style="height: 600px; width: 400px"></cord-inbox>
  </div>
</body>
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
                  'showCloseButton',
                  'showPlaceholder',
                  'onCloseRequested',
                ],
                required: [],
                properties: {
                  showCloseButton: {
                    type: 'boolean',
                    description: `Whether to show the close button in the top right
corner of the inbox.

The default setting is set to \`true\`.`,
                  },
                  showPlaceholder: {
                    type: 'boolean',
                    description: `If \`false\`, when the inbox has no unread threads, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of threads a user
                  will see in the inbox.

The default value is \`true\`.`,
                  },
                  onCloseRequested: {
                    type: 'function',
                    description: `Callback invoked when the close button in the
inbox was clicked.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'show-close-button',
                  'show-placeholder',
                  'cord-inbox:closeRequested',
                ],
                required: [],
                properties: {
                  'show-close-button': {
                    type: 'boolean',
                    description: `Whether to show the close button in the top right
corner of the inbox.

The default setting is set to \`true\`.`,
                  },
                  'show-placeholder': {
                    type: 'boolean',
                    description: `If \`false\`, when the inbox has no unread threads, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of threads a user
                  will see in the inbox.

The default value is \`true\`.`,
                  },
                  'cord-inbox:closeRequested': {
                    type: 'event',
                    description: `This event is fired when the close button in the
inbox was clicked.`,
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
          <NextUpCard
            title="Inbox Launcher"
            linkTo="/components/cord-inbox-launcher"
          >
            Customize how you open the inbox
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordInbox;
