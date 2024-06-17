/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function UpdateMembers() {
  return (
    <section>
      <H3>Update group members</H3>
      <p>Use this endpoint to add and/or remove members from a group.</p>

      <p>
        Requests to add a user that is already a member of that group, or remove
        a user that is not a member, will have no effect (but will not return an
        error).
      </p>

      <EmphasisCard>
        <p>
          Note: It is an error to add and remove the same user in a single
          request.
        </p>
      </EmphasisCard>

      <H4>HTTP Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'http',
            languageDisplayName: 'HTTP',
            snippet: `POST https://api.cord.com/v1/groups/<ID>/members`,
          },
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl https://api.cord.com/v1/groups/<ID>/members \\
-X POST \\
-H 'Authorization: Bearer <ACCESS_TOKEN>' \\
-H 'Content-Type: application/json' \\`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
# add
cord group add-member <GROUP_ID> 
# remove
cord group remove-member <GROUP_ID>
`,
          },
        ]}
      />
      <H4 data-collapsible>Request Body</H4>
      <p>
        Listed below are the fields of the request body to be added as part of
        the HTTP POST request.
      </p>
      {/* */}
      <SimplePropertiesList
        properties={apiData.types.ServerUpdateGroupMembers.properties}
        level={5}
      />
      <HR />
      <H4>Example Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl "https://api.cord.com/v1/groups/456/members" \\
  -X POST \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "add": ["4", "66"],
    "remove": ["42"]
  }'
`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group add-member 456 --user=4
cord group add-member 456 --user=66
cord group remove-member 456 --user=42
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
  "success": true,
  "message": "✅ You successfully updated group members"
}`,
          },
        ]}
      />
    </section>
  );
}

export default UpdateMembers;
