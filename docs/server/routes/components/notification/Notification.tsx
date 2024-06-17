/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Notification } from '@cord-sdk/react';
import { LIVE_COMPONENT_ON_DOCS_EXTERNAL_NOTIFICATION_PREFIX } from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

export default function CordNotification() {
  const { userID } = useContext(AuthContext);
  const notifId = userID
    ? `${LIVE_COMPONENT_ON_DOCS_EXTERNAL_NOTIFICATION_PREFIX}${userID}`
    : null;
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Notification"
      pageSubtitle={'Display a single notification'}
      showTableOfContents
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          {notifId && <Notification notificationId={notifId} />}
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            This component renders a single notification. It's best used to
            build a custom notification experience if the{' '}
            <Link to="/components/cord-notification-list">
              notification list component
            </Link>{' '}
            isn't suitable. In combination with the{' '}
            <Link to="/rest-apis/notifications#Create-a-notification">
              notifications REST API
            </Link>{' '}
            to send notifications, and the{' '}
            <Link to="/js-apis-and-hooks/notification-api/observeData">
              notifications data JS API
            </Link>{' '}
            to retrieve them, you can build a completely custom notifications
            experience.
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
                snippet: `import { Notification } from "@cord-sdk/react";

export const Example = () => {
  return (
    <Notification notificationId="my-awesome-notification-id" />
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet:
                  '<cord-notification notification-id="my-awesome-notification-id"></cord-notification>',
              },
            ]}
          />
          <H3>Example onClick: async callback</H3>
          You can run async code in the <code>onClick</code> callback. To do so,
          you will have to prevent the default navigation that happens when
          users click on the notification, <code>await</code> your logic and
          then resume navigation.
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { Notification } from "@cord-sdk/react";

export const Example = () => {
  return (
      <Notification
        notificationId="my-awesome-notification-id"
        onClick={(event, { destinationUrl }) => {
          // Don't navigate to another page.
          event.preventDefault();
          // Run any logic you need
          myAsyncCallback().then(() => {
            // When you're done, resume navigation!
            window.location.assign(destinationUrl);
          });
        }}
      />
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-notification notification-id="my-awesome-notification-id"></cord-notification>
<script>
  const notification = document.querySelector('[notification-id="my-awesome-notification-id"]');
  notification.addEventListener('cord-notification:click', (e) => {
      const [event, { destinationUrl } ] = e.detail;
      event.preventDefault();
      // Run any logic you need
      myAsyncCallback().then(() => {
        // When you're done, resume navigation!
        window.location.assign(destinationUrl);
      });
  });
</script>
                `,
              },
            ]}
          />
        </section>
        <HR />
        <PropertiesList
          savePreferenceFor="client"
          properties={{
            [ClientLanguageDisplayNames.REACT]: {
              propertyOrder: ['notificationId', 'onClick'],
              required: ['notificationId'],
              properties: {
                notificationId: {
                  type: 'string',
                  description: 'The ID of the notification to render.',
                },
                onClick: {
                  type: 'function',
                  description: `Callback invoked when a user clicks a notification.`,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: ['notification-id', 'cord-notification:click'],
              required: ['notification-id'],
              properties: {
                'notification-id': {
                  type: 'string',
                  description: 'The ID of the notification to render.',
                },
                'cord-notification:click': {
                  type: 'event',
                  description: `This event is fired when a user clicks a notification. The \`event.detail[0]\` is the native click event, and \`event.detail[1]\` is an object containing additional information about the notification.`,
                },
              },
            },
          }}
        />
        <HR />
        <CSSCustomizationLinkCard />
        <HR />
      </ErrorOnBeta>
    </Page>
  );
}
