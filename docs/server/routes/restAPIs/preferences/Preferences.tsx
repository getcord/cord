/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

export default function Preferences() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Preferences"
      pageSubtitle={`All available operations for sending and manipulating preferences`}
      showTableOfContents={true}
    >
      <section>
        <H3>List all preferences</H3>
        <p>
          This endpoint returns information about all preferences set for a
          specific user.
        </p>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet:
                'GET https://api.cord.com/v1/users/<USER_ID>/preferences',
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users/<USER_ID>/preferences \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user ls-preferences <USER_ID>`,
            },
          ]}
        />
        <H4>Request Body</H4>
        <p>
          <em>This REST endpoint has no request body.</em>
        </p>
        <H4 data-collapsible>Response</H4>
        <p>
          The response is a JSON array of objects with the following fields:
        </p>
        <SimplePropertiesList
          showRequired={false}
          properties={apiData.types.UserPreferences.properties}
          level={5}
        />
      </section>
      <HR />
      <section>
        <H3>Update preferences</H3>
        <p>This endpoint updates preferences for a user.</p>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: `PUT https://api.cord.com/v1/<USER_ID>/preferences`,
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users/<USER_ID>/preferences \\
  -X PUT \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'\\
  -H 'Content-Type: application/json'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user update-preferences <USER_ID>`,
            },
          ]}
        />
        <H4 data-collapsible>Request Body</H4>
        <SimplePropertiesList
          level={5}
          properties={apiData.types.ServerUpdatePreference.properties}
        />
        <HR />
        <H3>Example Request</H3>
        <p>
          In this example, suppose a user with the ID <code>123</code> exists.
          If you want to disable email notifications for this user, you can send
          this request:
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/123/preferences" \\
  -X PUT \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "key": "notification_channels",
    "value": {"sendViaSlack": false}
  }'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
              # you can install @cord-sdk/cli for a simpler experience
cord user update-preferences 123
--key=notification_channels
--value='{ "sendViaSlack": false }'
              `,
            },
          ]}
        />
        <p>If the request succeeds, the response will be:</p>
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: `{
    "success": true,
    "message": "✅ You successfully updated user 123 preferences",
}`,
            },
          ]}
        />
        <p>
          If the request does not succeed, the response will instead contain an
          <code>error</code> and <code>message</code> explaining what went
          wrong:
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: `{
  "error": "<ERROR_CODE>",
  "message": "An explanation of the error code."
}`,
            },
          ]}
        />
      </section>
    </Page>
  );
}
