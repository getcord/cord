/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function Users() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Users"
      pageSubtitle={`All available operations for manipulating users and their information`}
      showTableOfContents={true}
    >
      <EmphasisCard>
        <p>
          Check out our{' '}
          <Link to="/get-started/integration-guide/#Backend:%20Sync%20users%20and%20organizations">
            <strong>integration guide</strong>
          </Link>{' '}
          to understand how user syncing fits in your backend workflow
        </p>
      </EmphasisCard>
      <section>
        <H3>Create or update a user</H3>
        <p>This endpoint creates or updates a user:</p>
        <ul>
          <li>
            if the user does not exist in the Cord backend (based on its ID), it
            will be created; some fields are required.
          </li>
          <li>
            if the user exists, it will be updated; all fields are optional,
            only the fields provided will be updated.
          </li>
        </ul>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: `PUT https://api.cord.com/v1/users/<ID>`,
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users/<ID> \\
  -X PUT \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'\\
  -H 'Content-Type: application/json`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
# create 
cord user create <ID>
# update
cord user update <ID>`,
            },
          ]}
        />
        <p>
          For more information about IDs, check out our{' '}
          <Link to="/reference/identifiers">Identifiers concept</Link>{' '}
          breakdown.
        </p>
        <H4 data-collapsible>Request Body</H4>
        <p>
          Listed below are the fields of the request body to be added as part of
          the HTTP PUT request.
        </p>
        <SimplePropertiesList
          properties={apiData.types.ServerUpdateUser.properties}
          level={5}
        />
        <H4>Example Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/users/123" \\
-X PUT \\
-H "Authorization: Bearer <ACCESS_TOKEN>" \\
-H "Content-Type: application/json" \\
-d '{
  "name": "Leela Turanga",
  "profilePictureURL": "https://cord.com/favicon-32x32.png"
}'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user create 123 
--name="Leela Turanga"
--profile-picture-url=https://cord.com/favicon-32x32.png
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
  "message": "✅ You successfully created user 123"
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
  "message": "✅ You successfully updated user 123"
}`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H3>List users</H3>
        <p>
          This endpoint lists all users created in the context of your project.
        </p>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: `GET https://api.cord.com/v1/users`,
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user ls`,
            },
          ]}
        />
        <H4>Request Body</H4>
        <p>
          <em>This REST endpoint has no request body.</em>
        </p>
        <H4 data-collapsible>Request Parameters</H4>
        <p>The endpoint supports the following query request parameters:</p>
        <SimplePropertiesList
          properties={apiData.types.ServerListUserParameters.properties}
          level={5}
        />
        <br />
        <H4 data-collapsible>Response</H4>
        <p>The response is a JSON object with the following fields:</p>
        <SimplePropertiesList
          level={5}
          showRequired={false}
          properties={apiData.types.ServerListUsers.properties}
        />
        <br />
        <H4>Example Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/users?limit=25" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user ls --limit=25`,
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
  users: [
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
  pagination: {
    token: "eTJhbGciOiJIUzI1NiIsInR5cCI63kpXVC09=",
    total: 200,
  }
}`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H3>Get user details</H3>
        <p>
          This endpoint fetches the information about a user that has been
          stored in Cord's backend. The data you retrieve here contains the same
          values that would be displayed in Cord's UI components when that user
          loads your application.
        </p>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: `GET https://api.cord.com/v1/users/<ID>`,
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users/<ID> \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user get <ID>`,
            },
          ]}
        />
        <H4>Request Body</H4>
        <p>
          <em>This REST endpoint has no request body.</em>
        </p>
        <H4 data-collapsible>Response</H4>
        <p>The response is a JSON Object with the following fields:</p>
        <SimplePropertiesList
          level={5}
          showRequired={false}
          properties={apiData.types.ServerGetUser.properties}
        />
        <H4>Example Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/users/3001" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user get 3001`,
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
  "id": "3001",
  "name": "Philip J Fry",
  "email": "delivery@planetexpress.nny",
  "groups": ["org1", "org2"]
}`,
            },
          ]}
        />
      </section>
      <section>
        <H3>Delete a user</H3>
        <p>
          This endpoint will permanently delete a user and all associated data.
        </p>
        <EmphasisCard level="alert">
          <strong>
            This operation will delete all threads and messages associated with
            the user. Please only use this endpoint if you are okay with that.
          </strong>
        </EmphasisCard>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: `DELETE https://api.cord.com/v1/users/<ID>`,
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl https://api.cord.com/v1/users/<ID> \\
  -X DELETE \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user delete <ID>`,
            },
          ]}
        />
        <H4 data-collapsible>Request Body</H4>
        <p>The request body contains only one field:</p>
        <SimplePropertiesList
          properties={apiData.types.ServerDeleteUser.properties}
          level={5}
        />
        <H4>Example Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/users/123" \\
  -X DELETE \\ 
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  --json '{ "permanently_delete": true }'`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord user delete 123 
--permanently-delete=true
              `,
            },
          ]}
        />
        <p>
          If the request is successful and the user is now deleted, the response
          payload will be of the form:
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: `{
  "success": true,
  "message": "User deleted.",
  "userID": "123",
  // failedDeletionIDs is a list of any files we were unable
  // to delete that the user created.
  // Please reach out to us if it is crucial they be deleted.
  "failedDeletionIDs": [],
}`,
            },
          ]}
        />
      </section>
    </Page>
  );
}

export default Users;
