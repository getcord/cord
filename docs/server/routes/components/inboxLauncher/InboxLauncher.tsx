/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { InboxLauncher } from '@cord-sdk/react';
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

function CordInboxLauncher() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Inbox Launcher (Deprecated)"
      pageSubtitle={`Open the inbox to see new activity relevant to you`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <DeprecatedComponentWarning componentName="Inbox Launcher">
          <p>
            To display notifications and help users keep up with conversation,
            we strongly recommend using{' '}
            <Link to="/components/cord-notification-list-launcher">
              Cord Notification List Launcher
            </Link>
            .
          </p>
        </DeprecatedComponentWarning>
        <LiveDemoCard>
          <div
            css={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              // Value is the height of the inbox itself (600) + button (32)
              height: 632,
              width: 300,
            }}
          >
            <InboxLauncher />
          </div>
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>InboxLauncher</code> is a button you can use to open the{' '}
            <code>Inbox</code>. By default, clicking the launcher will open the
            inbox in a modal floating next to the button, but you can also
            configure custom behavior.
          </p>
          <p>
            You can customize the icon and text on the button, as well as the
            notification badging style.
          </p>
          <p>
            As well as the CSS custom properties listed at the bottom of this
            page, you can use the properties on the <code>Inbox</code> component
            to configure the default inbox that appears. For example, to change
            the width of the popup you can set the{' '}
            <code>--cord-inbox-width</code> variable in your CSS.
          </p>
          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-inbox">Inbox</Link> →
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
              If you use this component's default settings, you do{' '}
              <strong>not</strong> need to add a separate <code>Inbox</code>{' '}
              component to your page. However, if you set{' '}
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
              <code>Inbox</code> component. In that case, you can connect the
              components by adding event listeners for the{' '}
              <code>InboxLauncher</code> <code>click</code> event and the{' '}
              <code>Inbox</code> <code>closeRequested</code> event and running
              your own functions as required.
            </p>
          </EmphasisCard>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { InboxLauncher } from "@cord-sdk/react";

export const Example = () => (
  <body>
    <div id="header">
      <InboxLauncher />
    </div>
  </body>
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<body>
  <div id="header">
    <cord-inbox-launcher></cord-inbox-launcher>
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
                  'label',
                  'iconUrl',
                  'showInboxOnClick',
                  'showPlaceholder',
                  'onClick',
                ],
                required: [],
                properties: {
                  label: {
                    type: 'string',
                    description: `This sets the text label on the "Inbox" button.

The default label is \`Inbox\`. If set to an empty string, the
button will not have a label.`,
                  },
                  iconUrl: {
                    type: 'string',
                    description: `This URL sets the image used as the icon on the
"Inbox" button.

The default setting is \`Inbox icon\`. If set to an empty string, the button will
have no icon.`,
                  },
                  showInboxOnClick: {
                    type: 'boolean',
                    description: `When true, clicking the button will open
the \`cord-inbox\` component in a modal and trigger the
\`on-click\` event. When false, the button will only trigger
the \`on-click\` event. This is useful when you have custom
logic or layout in your application to handle the Inbox
component popup.

The default setting is set to \`true\`.`,
                  },
                  showPlaceholder: {
                    type: 'boolean',
                    description: `If \`false\`, when the inbox has no unread threads, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of threads a user
                  will see in the inbox.

The default value is \`true\`.`,
                  },
                  onClick: {
                    type: 'function',
                    description: `Callback invoked when the "Inbox" button is
clicked.`,
                  },
                },
              },

              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'label',
                  'icon-url',
                  'inbox-badge-style',
                  'show-inbox-on-click',
                  'show-placeholder',
                  'cord-inbox-launcher:click',
                ],
                required: [],
                properties: {
                  label: {
                    type: 'string',
                    description: `This sets the text label on the "Inbox" button.

The default label is \`Inbox\`. If set to an empty string, the
button will not have a label.`,
                  },
                  'icon-url': {
                    type: 'string',
                    description: `This URL sets the image used as the icon on the
"Inbox" button.

The default setting is \`Inbox icon\`. If set to an empty string, the button will
have no icon.`,
                  },
                  'inbox-badge-style': {
                    type: 'string',
                    description: `This customizes how the Inbox button indicates
that there are new messages. You can set it to one of the three
following values:

1. \`badge_with_count\`: This will show a bubble on the top
right of the button. Inside the bubble, the number of unread
messages will be displayed.
2. \`badge\`: This will show a blue bubble on the top right
of the button if there is at least one unread message.
3. \`none\`: There will be no indication of unread messages
in the button.

The default setting is \`badge_with_count\`. We strongly
discourage using this option, as it greatly reduces the
discoverability of the conversation users have started.
`,
                  },
                  'show-inbox-on-click': {
                    type: 'boolean',
                    description: `When true, clicking the button will open
the \`cord-inbox\` component in a modal and trigger the
\`on-click\` event. When false, the button will only trigger
the \`on-click\` event. This is useful when you have custom
logic or layout in your application to handle the Inbox
component popup.

The default setting is set to \`true\`.`,
                  },
                  'show-placeholder': {
                    type: 'boolean',
                    description: `If \`false\`, when the inbox has no unread threads, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of threads a user
                  will see in the inbox.

The default value is \`true\`.`,
                  },
                  'cord-inbox-launcher:click': {
                    type: 'event',
                    description: `This event is fired when the "Inbox" button is clicked.`,
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
          <NextUpCard title="Inbox" linkTo="/components/cord-inbox">
            Customize the inbox
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

export default CordInboxLauncher;
