/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

const uri = '/reference/events-webhook/events/url-verification';
const title = 'url-verification';

function URLVerification() {
  return (
    <Page
      pretitle={'Events Webhook'}
      pretitleLinkTo={'/reference/events-webhook'}
      title={title}
      showTableOfContents
      pageSubtitle=" This event is fired when an Events Webhook URL is changed, whether via
      the UI or API or anywhere else."
    >
      <section>
        <p>
          This is for Cord to verify ownership of the Event Webhook URL you
          provided, and for you to confirm that your configuration is at least
          minimally working.
        </p>
        <H2>Payload</H2>
        <SimplePropertiesList
          level={3}
          properties={{
            ...apiData.types.WebhookPayloads.properties.properties[
              'url-verification'
            ],
            propertyOrder: ['message'],
          }}
          showRequired={false}
        />
        <p>
          The event payload consists only of a string to aid debugging, which
          you can ignore.
        </p>
      </section>
      <HR />
      <section>
        <H2>Verifying events webhook URL</H2>
        <EmphasisCard>
          <div css={{ display: 'flex', alignItems: 'start' }}>
            <p css={{ marginRight: 8 }}>⚠️</p>
            <p>
              Creating a new Project with an <code>eventWebhookURL</code> field
              via the{' '}
              <Link to="/rest-apis/projects#Create-a-project">REST API</Link>{' '}
              will skip the URL verification process. Your URL could be invalid.
            </p>
          </div>
        </EmphasisCard>
        <p>
          Whenever you save a new events webhook URL via the Cord Console or set
          it through the API, a URL verification process will be triggered to
          ensure ownership of the URL and to check the URL works. We will
          attempt to send the following HTTP POST request to your URL:{' '}
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: 'JavaScript',
              snippet: `projectID: 'your-project-id',
event: { message: 'Please respond with a HTTP 200 status code.' },
timestamp: '${new Date().getTime()}',
type: 'url-verification'`,
            },
          ]}
        />
        <p>
          Once you receive this event,{' '}
          <Link to="/reference/events-webhook">verify the incoming event</Link>{' '}
          then respond with a HTTP 200 status code:
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: 'javascript',
              snippet: `import { validateWebhookSignature } from '@cord-sdk/server';

validateWebhookSignature(req, <YOUR_CORD_PROJECT_SIGNING_SECRET>);
if (req.body.type === 'url-verification') {
  res.sendStatus(200);
  return;
}`,
            },
          ]}
        />
        <p>
          The connection will be open for <i>three seconds</i>, during which
          time your app should respond to the request. If no response is
          received within three seconds, the verification process will fail and
          you will have to try again.
        </p>
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  Element: URLVerification,
};
