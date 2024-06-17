/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';

function Delete() {
  return (
    <section>
      <H3>Delete a group</H3>
      <p>
        This endpoint will permanently delete a group and associated data.{' '}
        <strong>
          This operation will delete all threads and message associated with the
          group. Please only use this endpoint if you are okay with that.
        </strong>{' '}
        Users will not be deleted because users can be in multiple groups.
        However, deleting the group also removes all users from the group.
      </p>
      <H4>HTTP Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'http',
            languageDisplayName: 'HTTP',
            snippet: `DELETE https://api.cord.com/v1/groups/<ID>`,
          },
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl https://api.cord.com/v1/groups/<ID> \\
-X DELETE \\
-H 'Authorization: Bearer <ACCESS_TOKEN>'`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group delete <ID>`,
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
      <H4>Example Request</H4>
      <CodeBlock
        snippetList={[
          {
            language: 'bash',
            languageDisplayName: 'cURL',
            snippet: `curl -X DELETE "https://api.cord.com/v1/groups/456" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`,
          },
          {
            language: 'bash',
            languageDisplayName: 'CLI',
            snippet: `# you can install @cord-sdk/cli for a simpler experience
cord group delete <ID>`,
          },
        ]}
      />
      <p>
        If the request is successful and the group is now deleted, the response
        payload will be of the form:
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'json',
            languageDisplayName: 'JSON',
            snippet: `{
  "success": true,
  "message": "✅ You successfully deleted group 456"
}`,
          },
        ]}
      />
    </section>
  );
}

export default Delete;
