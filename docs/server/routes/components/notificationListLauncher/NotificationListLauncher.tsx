/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { NotificationListLauncher } from '@cord-sdk/react';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';
import EmphasisCard, {
  EmphasisCardTitle,
} from 'docs/server/ui/card/EmphasisCard.tsx';

import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordNotificationListLauncher() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Notification List Launcher"
      pageSubtitle={`Display a simple launcher button to open a notification list anywhere`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          <div
            css={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              // Value is the height of the notification list (400) + button (32)
              // + gap between the two (2)
              height: 436,
              width: 300,
              '--cord-notification-list-height': '400px',
              '--cord-notification-list-width': '300px',
            }}
          >
            <NotificationListLauncher />
          </div>
        </LiveDemoCard>

        <section>
          <H2>When to use</H2>

          <p>
            The{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]:
                  '<NotificationListLauncher />',
                [ClientLanguageDisplayNames.VANILLA_JS]:
                  '<cord-notification-list-launcher>',
              }}
            />{' '}
            displays a button that will open and close a{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: '<NotificationList />',
                [ClientLanguageDisplayNames.VANILLA_JS]:
                  '<cord-notification-list>',
              }}
            />{' '}
            when it is clicked. The notification list will appear in a floating
            modal below the button. The icon and text of the button can be
            customized.
          </p>

          <p>
            This component accepts all of the properties/attributes that a{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: '<NotificationList />',
                [ClientLanguageDisplayNames.VANILLA_JS]:
                  '<cord-notification-list>',
              }}
            />{' '}
            accepts. These properties/attributes will be applied to the
            NotificationList rendered by the{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]:
                  '<NotificationListLauncher />',
                [ClientLanguageDisplayNames.VANILLA_JS]:
                  '<cord-notification-list-launcher>',
              }}
            />
            .
          </p>

          <EmphasisCard>
            <EmphasisCardTitle>
              Send your own notifications via Cord
            </EmphasisCardTitle>
            <p>
              Our <Link to="/rest-apis/notifications">REST API</Link> enables
              you to push custom notifications into the list. Out of the box,
              you get read/unread tracking, mark-all-as-read and much more.
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
                snippet: `import { NotificationListLauncher } from "@cord-sdk/react";

export const Example = () => {
  return (
   <NotificationListLauncher
      filter={{
        location: { page: 'foo' },
        metadata: {category: 'sales'},
        groupID: 'group123'
      }}
    />
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `
<cord-notification-list-launcher filter='{"location":{"page":"foo"}, "metadata":{"category":"sales"}, "groupID": "group123"}'>
</cord-notification-list-launcher>`,
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
                  'iconURL',
                  'disabled',
                  'maxCount',
                  'fetchAdditionalCount',
                  'showPlaceholder',
                  'onClick',
                  'filter',
                  'onNotificationClick',
                ],
                required: [],
                properties: {
                  label: {
                    type: 'string',
                    description: `This sets the text label on the launcher button.

The default label is an empty string which means the button will not have a label`,
                  },
                  iconURL: {
                    type: 'string',
                    description: `This URL sets the image used as the icon for the launcher button. When set to an empty string, the button will not have an icon.

The default setting is \`Bell icon\`. If set to an empty string, the button will
have no icon.`,
                  },
                  disabled: {
                    type: 'boolean',
                    description: ` This controls whether the button is disabled or not.

The default is set to \`false\`.
                  `,
                  },
                  maxCount: {
                    type: 'number',
                    description: `When the list first loads, this is the maximum
number of notifications which will be initially loaded and displayed. If this
value is set too small, there may not be enough notifications fetched to fill
the list. If this value is set too large, it will take an unnecessarily long
time to fetch and display so many notifications. 

The default value strikes a
reasonable balance, and only needs to be changed if the notification list is
especially tall.`,
                  },
                  fetchAdditionalCount: {
                    type: 'number',
                    description: `When the list is scrolled all the way to the
bottom, this is the number of notifications which will loaded into the bottom of
the list to allow the user to continue scrolling. Increasing this value trades
fewer server roundtrips for each individual load taking more time. 

The default
value strikes a reasonable balance for nearly all use-cases.`,
                  },
                  showPlaceholder: {
                    type: 'boolean',
                    description: `If \`false\`, when the notification list has no notifications, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of notifications a user will see.

The default value is \`true\`.`,
                  },
                  onClick: {
                    type: 'function',
                    description: `Callback invoked when the launcher button is clicked.`,
                  },
                  filter: {
                    type: 'NotificationListFilter',
                    description: `A JSON object that can be used to filter notifications displayed in the <code>NotificationList</code>.`,
                    properties: {
                      metadata: {
                        description:
                          'An arbitrary JSON object specified when the notification is created. The value for a `metadata` entry should be an object representing the metadata key/value to filter on.  For example, to show only notifications with the metadata key of `"category"` set to `"sales"`, set the filter to `{ metadata: { category: "sales" } }`.',
                        type: 'EntityMetadata',
                      },
                      location: {
                        description:
                          'The [location](/reference/location) where the notifications live. This will be the location of the thread containing the message which prompted the notification.',
                        type: 'Location',
                      },
                      groupID: {
                        description:
                          'The group to which the message that prompted the notification belongs.',
                        type: 'string',
                      },
                    },
                    propertyOrder: ['metadata', 'location', 'groupID'],
                    required: [],
                  },
                  onNotificationClick: {
                    type: 'function',
                    description: `Callback invoked when a user clicks a notification.`,
                  },
                },
              },

              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'label',
                  'icon-url',
                  'badge-style',
                  'disabled',
                  'max-count',
                  'fetch-additional-count',
                  'show-placeholder',
                  'cord-notification-list-launcher:click',
                  'cord-notification:click',
                ],
                required: [],
                properties: {
                  label: {
                    type: 'string',
                    description: `This sets the text label on the launcher button.

The default label is an empty string which means the button will not have a label.`,
                  },
                  'icon-url': {
                    type: 'string',
                    description: `This URL sets the image used as the icon for the launcher button. When set to an empty string, the button will not have an icon.

The default value is set to a URL for Cord's standard bell icon.`,
                  },
                  'badge-style': {
                    type: 'string',
                    description: `This customizes how the launcher button indicates that there are new notifications. You can set it to one of the three following values:

1. \`badge_with_count\`: This will show a bubble on the top
right of the button. Inside the bubble, the number of unread
notifications will be displayed.
2. \`badge\`: This will show a blue bubble on the top right
of the button if there is at least one unread notification.
3. \`none\`: There will be no indication of unread notifications
in the button.

The default setting is \`badge_with_count\`. We strongly
discourage using this option, as it greatly reduces
the discoverability of the conversation users have started.
`,
                  },
                  disabled: {
                    type: 'boolean',
                    description: ` This controls whether the button is disabled or not.

The default is set to \`false\`.
                  `,
                  },
                  'max-count': {
                    type: 'number',
                    description: `When the list first loads, this is the maximum
number of notifications which will be initially loaded and displayed. If this
value is set too small, there may not be enough notifications fetched to fill
the list. If this value is set too large, it will take an unnecessarily long
time to fetch and display so many notifications. 

The default value strikes a
reasonable balance, and only needs to be changed if the notification list is
especially tall.`,
                  },
                  'fetch-additional-count': {
                    type: 'number',
                    description: `When the list is scrolled all the way to the
bottom, this is the number of notifications which will loaded into the bottom of
the list to allow the user to continue scrolling. Increasing this value trades
fewer server roundtrips for each individual load taking more time. 

The default
value strikes a reasonable balance for nearly all use-cases.`,
                  },
                  'show-placeholder': {
                    type: 'boolean',
                    description: `If \`false\`, when the notification list has no notifications, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of notifications a user will see.

The default value is \`true\`.`,
                  },
                  'cord-notification-list-launcher:click': {
                    type: 'event',
                    description: `This event is fired when the launcher button is clicked.`,
                  },
                  filter: {
                    type: 'string',
                    description: `A serialized JSON object that can be used to filter notifications displayed in the <code>NotificationList</code>.`,
                    properties: {
                      metadata: {
                        description:
                          'An arbitrary JSON object specified when the notification is created. The value for a `metadata` entry should be an object representing the metadata key/value to filter on.  For example, to show only notifications with the metadata key of `"category"` set to `"sales"`, set the filter to `{ metadata: { category: "sales" } }`.',
                        type: 'EntityMetadata',
                      },
                      location: {
                        description:
                          'The [location](/reference/location) where the notifications live. This will be the location of the thread containing the message which prompted the notification.',
                        type: 'Location',
                      },
                      groupID: {
                        description:
                          'The group to which the message that prompted the notification belongs.',
                        type: 'string',
                      },
                    },
                    propertyOrder: ['metadata', 'location', 'groupID'],
                    required: [],
                  },
                  'cord-notification:click': {
                    type: 'event',
                    description: `This event is fired when a user clicks a notification. The \`event.detail[0]\` is the native click event, and \`event.detail[1]\` is an object containing additional information about the notification.`,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <CSSCustomizationLinkCard />
      </ErrorOnBeta>
    </Page>
  );
}

export default CordNotificationListLauncher;
