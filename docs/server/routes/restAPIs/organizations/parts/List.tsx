/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function List() {
  return (
    <section>
      <H3>List groups</H3>
      <p>
        Use this endpoint to list all groups that you have created within your
        Cord project.
      </p>

      <H4>HTTP Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'http',
            languageDisplayName: 'HTTP',
            snippet: `GET https://api.cord.com/v1/groups`,
          },
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl https://api.cord.com/v1/groups \\
-H 'Authorization: Bearer <ACCESS_TOKEN>'`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group ls`,
          },
        ]}
      />
      <H4>Request Body</H4>
      <p>
        <em>This endpoint does not require a request body.</em>
      </p>
      <H4 data-collapsible>Response</H4>
      <p>
        The response is an object containing the information about the groups:
      </p>
      <SimplePropertiesList
        level={5}
        showRequired={false}
        properties={apiData.types.ServerListGroup.properties}
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
cord group ls`,
          },
        ]}
      />
      <p>If successful, the response will be:</p>
      <CodeBlock
        snippetList={[
          {
            language: 'json',
            languageDisplayName: 'JSON',
            snippet: `[
  {
    "id": "10",
    "name": "Planet Express"
  }
]`,
          },
        ]}
      />
    </section>
  );
}

export default List;
