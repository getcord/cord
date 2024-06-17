/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function ListMembers() {
  return (
    <section>
      <H3>List group members</H3>
      <p>Use this endpoint to list all members from a group.</p>
      <H4>HTTP Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'http',
            languageDisplayName: 'HTTP',
            snippet: `GET https://api.cord.com/v1/groups/<ID>/members`,
          },
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl https://api.cord.com/v1/groups/<ID>/members \\
-X GET \\
-H 'Authorization: Bearer <ACCESS_TOKEN>' \\
-H 'Content-Type: application/json' \\`,
          },
        ]}
      />
      <H4 data-collapsible>Request Body</H4>
      <p>
        <em>This endpoint does not require a request body.</em>
      </p>
      <H4 data-collapsible>Request Parameters</H4>
      <p>The endpoint supports the following query request parameters:</p>
      <SimplePropertiesList
        properties={apiData.types.ServerListGroupMembersParameters.properties}
        level={5}
      />
      <br />
      <HR />
      <H4 data-collapsible>Response</H4>
      <p>
        The response is an object containing the information about the groups
        members:
      </p>
      <SimplePropertiesList
        level={5}
        showRequired={false}
        properties={apiData.types.ServerListGroupMembers.properties}
      />
      <H4>Example Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl "https://api.cord.com/v1/groups/456/members" \\
  -X GET \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
`,
          },
        ]}
      />
      <p>If successful, the response will be:</p>
      <CodeBlock
        snippetList={[
          {
            language: 'json',
            languageDisplayName: 'JSON',
            snippet: `{
  "users": [
    {
      "id": "3001",
      "name": "Philip J Fry",
      "email": "delivery@planetexpress.nny",
    },
    {
      "id": "123",
      "name": "Leela Turanga",
      "email": "capt@planetexpress.nny"
    }
  ],
  "pagination": {
    "token": "eTJhbGciOiJIUzI1NiIsInR5cCI63kpXVC09=",
    "total": 5
  }
}`,
          },
        ]}
      />
    </section>
  );
}

export default ListMembers;
