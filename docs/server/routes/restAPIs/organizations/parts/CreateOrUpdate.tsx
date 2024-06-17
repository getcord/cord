/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function CreateOrUpdate() {
  return (
    <section>
      <H3>Create or update a group</H3>
      <p>This endpoint creates or updates a group:</p>
      <ul>
        <li>
          if the group does not exist in the Cord backend (based on its ID), it
          will be created; some fields are required.
        </li>
        <li>
          if the group exists, it will be updated: all fields are optional, only
          the fields provided will be updated; if the request is updating the{' '}
          <code>members</code> list, the list is treated as exhaustive: all
          member user IDs must be included, previous members who are not in the
          list will be removed.
        </li>
      </ul>
      <H4>HTTP Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'http',
            languageDisplayName: 'HTTP',
            snippet: `PUT https://api.cord.com/v1/groups/<ID>`,
          },
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl https://api.cord.com/v1/groups/<ID> \\
-X PUT \\
-H 'Authorization: Bearer <ACCESS_TOKEN>' \\
-H 'Content-Type: application/json' \\`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience

# create
cord group create <ID>
# update
cord group update <ID>`,
          },
        ]}
      />
      <p>
        For more information about IDs, check out our{' '}
        <Link to="/reference/identifiers">Identifiers concept</Link> breakdown.
      </p>
      <H4 data-collapsible>Request Body</H4>
      <p>
        Listed below are the fields of the request body to be added as part of
        the HTTP PUT request.
      </p>
      <SimplePropertiesList
        properties={apiData.types.ServerUpdateGroup.properties}
        level={5}
      />
      <HR />
      <H4>Example Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl "https://api.cord.com/v1/groups/456" \\
-X PUT \\
-H "Authorization: Bearer <ACCESS_TOKEN>" \\
-H "Content-Type: application/json" \\
-d '{
  "name": "Planet Express",
  "members": ["4", "42"]
}'`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group create 456
--name="Planet Express"
--members='["4", "42"]'
            `,
          },
        ]}
      />
      <p>If creation was successful, the response will be:</p>
      <CodeBlock
        snippetList={[
          {
            language: 'json',
            languageDisplayName: 'JSON',
            snippet: `{
  "success": true,
  "message": "✅ You successfully created group 456"
}`,
          },
        ]}
      />
      <p>If update was successful, the response will be:</p>
      <CodeBlock
        snippetList={[
          {
            language: 'json',
            languageDisplayName: 'JSON',
            snippet: `{
  "success": true,
  "message": "✅ You successfully updated group 456"
}`,
          },
        ]}
      />
    </section>
  );
}

export default CreateOrUpdate;
