import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

export default function Presence() {
  return (
    <Page
      pretitle="Rest API"
      pretitleLinkTo="/rest-apis"
      title="Presence"
      pageSubtitle="All available operations for user presence"
      showTableOfContents
    >
      <section>
        <H3>Update a user's presence</H3>
        <p>
          This endpoint updates a user's{' '}
          <Link to="/js-apis-and-hooks/presence-api">location</Link>.
        </p>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: 'PUT https://api.cord.com/v1/users/<USER_ID>/presence',
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users/<USER_ID>/preferences \\
  -X PUT \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
  -H 'Content-Type: application/json'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user update-presence <USER_ID>`,
            },
          ]}
        />
        <H4 data-collapsible>Request Body</H4>
        <p>
          Listed below are the fields of the request body to be added as part of
          the HTTP PUT request.
        </p>
        <SimplePropertiesList
          properties={{ ...apiData.types.ServerUpdatePresence.properties }}
          level={5}
        />
        <H4>Response</H4>
        <p>If successful, the response will be:</p>
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: `{
    "success": true,
    "message": "✅ You successfully updated user <USER_ID> presence"
}
              `,
            },
          ]}
        />
        <H4>Example Request</H4>
        <p>
          To show a user as present at the location{' '}
          <code>{`{ "page": "docs", "section": "presence" }`}</code>.
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/users/<USER_ID>/presence" \\
  -X PUT \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "location": { "page": "docs", "section": "presence" },
    "groupID": <GROUP_ID>
  }'
  `,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user update-presence <USER_ID>
--location='{ "page": "docs", "section": "presence" }'
--group-id=<GROUP_ID>
              `,
            },
          ]}
        />
      </section>
    </Page>
  );
}
