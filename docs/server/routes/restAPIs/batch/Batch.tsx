/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import EmphasisCard, {
  EmphasisCardTitle,
} from 'docs/server/ui/card/EmphasisCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

function Batch() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Batch"
      pageSubtitle={`Using a single API call to update multiple users and groups`}
      showTableOfContents={true}
    >
      <EmphasisCard>
        <p>
          Check out our {/* todo: i dont think this exists */}
          <Link to="/get-started/integration-guide/#Backend:%20Backfill%20users%20and%20groups">
            <strong>integration guide</strong>
          </Link>{' '}
          to understand how batch syncing fits in your backend workflow
        </p>
      </EmphasisCard>
      <p>
        Use this for cases where you need to take actions on several groups or
        users at once. The action taken for each entity is 'create or update':
        If a user or group with that ID already exists, it will be updated with
        the provided data, otherwise it will be created.
      </p>
      <p>
        If any of the changes produces an error, none of the changes will be
        applied, so you're always in a known state.
      </p>
      <section>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: `POST https://api.cord.com/v1/batch`,
            },
          ]}
        />
        <H4 data-collapsible>Request Body</H4>
        <p>
          Listed below are the fields of the request body to be added as part of
          the HTTP POST request.
        </p>
        <SimplePropertiesList
          properties={apiData.types.ServerUpdateBatch.properties}
          level={5}
        />
        <HR />
        <EmphasisCard>
          <EmphasisCardTitle>Deleting users</EmphasisCardTitle>
          <p>
            To remove a user across your project, Cord's data model includes a{' '}
            <code>status</code> field on the <code>User</code> object. If that
            value is set as <code>deleted</code>, the user will no longer be
            able to use Cord. This means they won't be able to load Cord
            components, be marked as present, view past conversations, etc.. The
            user will also disappear from any facepiles they were previously
            shown in. However, any messages they've sent will still exist. This
            applies across all groups that the user was a member of.
          </p>
          <p>
            Setting the <code>status</code> field to <code>active</code>{' '}
            reverses this change, causing the user to reappear where they had
            previously been present and allowing the user to login and use Cord
            again.
          </p>
          <p>
            You may want to remove a user from a particular <code>Group</code>{' '}
            rather than removing them from across the project. For more
            information on this, see the{' '}
            <strong>
              <Link to="/rest-apis/groups/#update-group-members">
                Groups API
              </Link>
            </strong>
            .
          </p>
        </EmphasisCard>
      </section>
      <section>
        <H4>Example Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/batch" \
-X POST \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "groups": [
    {
      "id": "10",
      "name": "Planet Express",
      "members": ["4", "42"]
    }
  ],
  "users": [
    {
      "id": "4",
      "name": "Hubert Farnsworth",
      "email": "hubert@planetexpress.nny"
    },
    {
      "id": "42",
      "name": "Leela Turanga",
      "email": "leela@planetexpress.nny"
    }
  ]
}'`,
            },
          ]}
        />
      </section>
      <NextUp>
        <NextUpCard title="Users" linkTo="/rest-apis/users">
          How to sync a user
        </NextUpCard>
        <NextUpCard title="Groups" linkTo="/rest-apis/groups">
          How to sync a group
        </NextUpCard>
        <NextUpCard title="Errors" linkTo="/rest-apis/errors">
          Possible errors return by the Rest APIs
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Batch;
