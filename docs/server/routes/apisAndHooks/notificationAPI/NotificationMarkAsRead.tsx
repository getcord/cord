import apiData from 'docs/server/apiData/apiData.ts';
import NotificationAPI from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationAPI.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';

const uri = '/js-apis-and-hooks/notification-api/markAsRead';
const title = 'Mark notifications as read or unread';
const subtitle =
  'How to use the notification API to mark some or all notifications as read or unread';

const methodData =
  apiData['types']['ICordNotificationSDK']['methods']['methods'];

function NotificationMarkAsRead() {
  return (
    <Page
      pretitle={NotificationAPI.title}
      pretitleLinkTo={NotificationAPI.uri}
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents
    >
      <section>
        <H2>Mark A Specific Notification As Read</H2>
        <section>
          <H3>Usage</H3>
          <CodeBlock
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: methodData.markAsRead.examples.Usage,
              },
            ]}
          />
        </section>
        <section>
          <H3>What this function returns</H3>
          <p>{methodData.markAsRead.returns.description}</p>
        </section>
        <PropertiesList
          headingLevel={3}
          headings={{
            [ClientLanguageDisplayNames.VANILLA_JS]:
              'Arguments this function takes',
          }}
          properties={{
            [ClientLanguageDisplayNames.VANILLA_JS]:
              methodData.markAsRead.parameters,
          }}
        />
      </section>
      <HR />
      <section>
        <H2>Mark A Specific Notification As Unread</H2>
        <section>
          <H3>Usage</H3>
          <CodeBlock
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: methodData.markAsUnread.examples.Usage,
              },
            ]}
          />
        </section>
        <section>
          <H3>What this function returns</H3>
          <p>{methodData.markAsUnread.returns.description}</p>
        </section>
        <PropertiesList
          headingLevel={3}
          headings={{
            [ClientLanguageDisplayNames.VANILLA_JS]:
              'Arguments this function takes',
          }}
          properties={{
            [ClientLanguageDisplayNames.VANILLA_JS]:
              methodData.markAsUnread.parameters,
          }}
        />
      </section>
      <HR />
      <section>
        <H2>Mark All Notifications As Read</H2>
        <section>
          <H3>Usage</H3>
          <CodeBlock
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: methodData.markAllAsRead.examples.Usage,
              },
            ]}
          />
        </section>
        <section>
          <H3>What this function returns</H3>
          <p>{methodData.markAllAsRead.returns.description}</p>
        </section>
        <PropertiesList
          headingLevel={3}
          headings={{
            [ClientLanguageDisplayNames.VANILLA_JS]:
              'Arguments this function takes',
          }}
          properties={{
            [ClientLanguageDisplayNames.VANILLA_JS]:
              methodData.markAllAsRead.parameters,
          }}
        />
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: NotificationMarkAsRead,
};
