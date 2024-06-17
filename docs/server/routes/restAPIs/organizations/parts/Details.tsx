/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function Details() {
  return (
    <section>
      <H3>Get group details</H3>
      <H4>HTTP Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'http',
            languageDisplayName: 'HTTP',
            snippet: `GET https://api.cord.com/v1/groups/<ID>`,
          },
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl https://api.cord.com/v1/groups/<ID> \\
-H 'Authorization: Bearer <ACCESS_TOKEN>'`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group get <ID>`,
          },
        ]}
      />
      <p>
        For more information about IDs, check out our{' '}
        <Link to="/reference/identifiers">Identifiers concept</Link> breakdown.
      </p>
      <H4>Request Body</H4>
      <p>
        <em>This endpoint does not require a request body.</em>
      </p>
      <H4 data-collapsible>Response</H4>
      <p>The response is a JSON Object with the following fields:</p>
      <SimplePropertiesList
        level={5}
        showRequired={false}
        properties={apiData.types.ServerGetGroup.properties}
      />
      <H4>Example Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl "https://api.cord.com/v1/groups" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group get <ID>`,
          },
        ]}
      />
      <p>
        If the request is successful and the group exists, the response payload
        will be of the form:
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'json',
            languageDisplayName: 'JSON',
            snippet: `{
  "id": "10",
  "name": "Planet Express",
  "members": ["4", "42"],
  "connectedToSlack": false
}`,
          },
        ]}
      />
    </section>
  );
}

export default Details;
