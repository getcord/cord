/** @jsxImportSource @emotion/react */

import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';

const uri = '/reference/events-webhook/events/notification-created';
const title = 'notification-created';

function NotificationCreated() {
  return (
    <Page
      pretitle={'Events Webhook'}
      pretitleLinkTo={'/reference/events-webhook'}
      title={title}
      showTableOfContents
      pageSubtitle="This event is fired when a new notification is created, whether via
      the UI or API or anywhere else."
    >
      <section>
        <H2>Payload</H2>
        <SimplePropertiesList
          level={3}
          properties={{
            ...apiData.types.WebhookPayloads.properties.properties[
              'notification-created'
            ],
            propertyOrder: [
              'id',
              'senderUserIDs',
              'recipientUserID',
              'iconUrl',
              'header',
              'attachment',
              'readStatus',
              'timestamp',
              'metadata',
            ],
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
  Element: NotificationCreated,
};
