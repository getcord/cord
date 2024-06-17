/** @jsxImportSource @emotion/react */

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';

const NotificationListHowToUse = () => {
  return (
    <>
      <section>
        <H2>How to use</H2>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { NotificationList } from "@cord-sdk/react";

export const Example = () => {
  return (
    <NotificationList 
      maxCount={10}
      fetchAdditionalCount={3}
      filter={{
        location: {page: 'foo'}
        metadata: {category: 'sales'}
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
<cord-notification-list
  max-count="10"
  fetch-additional-count="3"
  filter='{"location":{"page":"foo"}, "metadata":{"category":"sales"}, "groupID": "group123"}'
>
</cord-notification-list>`,
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
                'maxCount',
                'fetchAdditionalCount',
                'showPlaceholder',
                'filter',
                'onNotificationClick',
              ],
              required: [],
              properties: {
                maxCount: {
                  type: 'number',
                  description: `When the list first loads, this is the maximum
number of notifications which will be initially loaded and displayed. If this
value is set too small, there may not be enough notifications fetched to fill
the list. If this value is set too large, it will take an unnecessarily long
time to fetch and display so many notifications. The default value strikes a
reasonable balance, and only needs to be changed if the notification list is
especially tall.`,
                },
                fetchAdditionalCount: {
                  type: 'number',
                  description: `When the list is scrolled all the way to the
bottom, this is the number of notifications which will loaded into the bottom of
the list to allow the user to continue scrolling. Increasing this value trades
fewer server roundtrips for each individual load taking more time. The default
value strikes a reasonable balance for nearly all use-cases.`,
                },
                showPlaceholder: {
                  type: 'boolean',
                  description: `If \`false\`, when the notification list has no notifications, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of notifications a user will see.

The default value is \`true\`.`,
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
                'max-count',
                'fetch-additional-count',
                'show-placeholder',
                'filter',
                'cord-notification:click',
              ],
              required: [],
              properties: {
                'max-count': {
                  type: 'number',
                  description: `When the list first loads, this is the maximum
number of notifications which will be initially loaded and displayed. If this
value is set too small, there may not be enough notifications fetched to fill
the list. If this value is set too large, it will take an unnecessarily long
time to fetch and display so many notifications. The default value strikes a
reasonable balance, and only needs to be changed if the notification list is
especially tall.`,
                },
                'fetch-additional-count': {
                  type: 'number',
                  description: `When the list is scrolled all the way to the
bottom, this is the number of notifications which will loaded into the bottom of
the list to allow the user to continue scrolling. Increasing this value trades
fewer server roundtrips for each individual load taking more time. The default
value strikes a reasonable balance for nearly all use-cases.`,
                },
                'show-placeholder': {
                  type: 'boolean',
                  description: `If \`false\`, when the notification list has no notifications, it will show a completely empty container. If set to \`true\`, it will instead show a placeholder, containing a description of the types of notifications a user will see.

The default value is \`true\`.`,
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
    </>
  );
};

export default NotificationListHowToUse;
