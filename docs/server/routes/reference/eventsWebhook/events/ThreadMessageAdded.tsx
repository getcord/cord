/** @jsxImportSource @emotion/react */

import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';

const uri = '/reference/events-webhook/events/thread-message-added';
const title = 'thread-message-added';

function ThreadMessageAdded() {
  return (
    <Page
      pretitle={'Events Webhook'}
      pretitleLinkTo={'/reference/events-webhook'}
      title={title}
      showTableOfContents
      pageSubtitle=" This event is fired when a new message is added to a thread, whether
      via the UI or API or anywhere else."
    >
      <section>
        <H2>Payload</H2>
        <SimplePropertiesList
          level={3}
          properties={{
            ...apiData.types.WebhookPayloads.properties.properties[
              'thread-message-added'
            ],
            properties: {
              message:
                apiData.types.WebhookPayloads.properties.properties[
                  'thread-message-added'
                ].properties.message,
              thread:
                apiData.types.WebhookPayloads.properties.properties[
                  'thread-message-added'
                ].properties.thread,
              usersToNotify:
                apiData.types.WebhookPayloads.properties.properties[
                  'thread-message-added'
                ].properties.usersToNotify,
            },
            propertyOrder: ['message', 'thread', 'usersToNotify'],
          }}
          showRequired={false}
        />
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  Element: ThreadMessageAdded,
};
