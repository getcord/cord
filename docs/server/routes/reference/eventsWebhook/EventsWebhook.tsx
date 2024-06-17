/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import SimpleTable from 'docs/server/ui/simpleTable/SimpleTable.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function Subtitle() {
  return (
    <>
      Our Events Webhook lets you stay up to date with Cord activity in your
      app. Choose which events you want to receive and where we should send them
      to. Run your own analytics, integrate with tools like Slack, or even build
      your own{' '}
      <a
        target="_blank"
        href="https://cord.com/blog/build-a-chatbot-with-cord"
        rel="noreferrer"
      >
        AI chatbot assistant
      </a>
      ...
    </>
  );
}

export default function EventsWebhook() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Events Webhook"
      pageSubtitle={{
        metaDescription:
          'Our Events Webhook lets you stay up to date with Cord activity in your app. Choose which events you want to receive and where we should send them to. Run your own analytics, integrate with tools like Slack, or even build your own AI chatbot assistant.',
        element: <Subtitle />,
      }}
      showTableOfContents={true}
    >
      <section>
        <H2>Tell us what events to send and where</H2>
        <p>
          You can select which events to receive and where we should send them
          on the <a href="https://console.cord.com/">Cord Console</a>. Log in to
          your project and go to the Events tab.
        </p>
        <p>
          When you give us your Events Webhook endpoint, we will attempt to{' '}
          <Link to="/reference/events-webhook/events/url-verification">
            verify the URL
          </Link>{' '}
          before saving it to your project. You can also set your endpoint via{' '}
          <Link to="/rest-apis/projects#Update-a-project">REST API</Link>.
        </p>
      </section>
      <br />
      <section>
        <H2>Verify incoming events</H2>
        <p>
          To make sure that requests hitting your endpoint are really from Cord,
          verify the incoming request's signature using your project secret.
        </p>
        <p>
          Use our helper function from the server sdk which will validate the
          signature and timestamp on the webhook requests.
        </p>
        <p>
          Alternatively, you can perform the same verification in your own code.
          Each request has a <code>X-Cord-Signature</code> header set which you
          should be able to match with a signature you create from the incoming
          event, using a HMAC-SHA256 keyed hash and your project's secret.
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: 'javascript',
              snippet: `import { validateWebhookSignature } from '@cord-sdk/server';

validateWebhookSignature(req, <YOUR_CORD_PROJECT_SIGNING_SECRET>);
// process event`,
            },
          ]}
        />
        {/* TODO add fns to do this for you to npm server packages */}
      </section>
      <br />
      <section>
        <H2>Event Structure</H2>
        <p>
          All events have the following common properties at the top level of
          the payload:
        </p>
        <SimplePropertiesList
          level={3}
          properties={apiData.types.WebhookWrapperProperties.properties}
          nested={true}
        />
      </section>
      <br />
      <section>
        <H2>Events</H2>
        <p>
          Detailed information about each available event and its specific body:
        </p>
        <SimpleTable
          firstColumnLabel="Type"
          secondColumnLabel="Description"
          data={[
            [
              <>
                <a href="/reference/events-webhook/events/thread-message-added">
                  thread-message-added
                </a>
              </>,
              <>A new Cord message was added</>,
            ],
            [
              <>
                <a href="/reference/events-webhook/events/notification-created">
                  notification-created
                </a>
              </>,
              <>A new Cord notification was created</>,
            ],
            [
              <>
                <a href="/reference/events-webhook/events/url-verification">
                  url-verification
                </a>
              </>,
              <>Verifies ownership of an events webhook URL</>,
            ],
          ]}
        />
      </section>
    </Page>
  );
}
