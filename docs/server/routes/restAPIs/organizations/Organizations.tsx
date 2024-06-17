/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import CreateOrUpdate from 'docs/server/routes/restAPIs/organizations/parts/CreateOrUpdate.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import UpdateMembers from 'docs/server/routes/restAPIs/organizations/parts/UpdateMembers.tsx';
import List from 'docs/server/routes/restAPIs/organizations/parts/List.tsx';
import Details from 'docs/server/routes/restAPIs/organizations/parts/Details.tsx';
import Delete from 'docs/server/routes/restAPIs/organizations/parts/Delete.tsx';
import ListMembers from 'docs/server/routes/restAPIs/organizations/parts/ListMembers.tsx';

function Organizations() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Groups"
      pageSubtitle={`All available operations for manipulating groups and their information`}
      showTableOfContents={true}
    >
      <EmphasisCard>
        <p>
          Check out our{' '}
          {/* todo quick look suggests this no longer exists? is there an alternative */}
          <Link to="/get-started/integration-guide/#Backend:%20Sync%20users%20and%20groups">
            <strong>integration guide</strong>
          </Link>{' '}
          to understand how user syncing fits in your backend workflow
        </p>
      </EmphasisCard>
      <CreateOrUpdate />
      <HR />
      <UpdateMembers />
      <HR />
      <List />
      <HR />
      <ListMembers />
      <HR />
      <Details />
      <HR />
      <Delete />
      <NextUp>
        <NextUpCard title="Errors" linkTo="/rest-apis/errors">
          Possible errors returned by the Rest APIs
        </NextUpCard>
        <NextUpCard title="Users" linkTo="/rest-apis/users">
          Update individual users
        </NextUpCard>
        <NextUpCard title="Batch" linkTo="/rest-apis/batch">
          Batch syncing for users and groups
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Organizations;
