/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';

function Authentication() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Authentication"
      pageSubtitle={`Our REST API enables your backend services to send us
        information we need to implement Cord, such as the identities of your
        users and organizations`}
    >
      <p>
        All REST API requests must include a valid{' '}
        <strong>server auth token</strong> in the HTTP headers:{' '}
        <code>Authorization: Bearer &lt;SERVER_AUTH_TOKEN&gt;</code>.
      </p>
      <p>
        <img
          src="/static/images/sync_orgs.svg"
          alt="A diagram of how project_id and secret are used to create a JWT for authenticating with Cord servers"
        />
      </p>
      <p>
        To generate auth tokens, you'll need your <strong>project ID</strong>{' '}
        and <strong>secret</strong>, which you can get from the{' '}
        <a href="https://console.cord.com">Cord console</a>.
      </p>
      <EmphasisCard>
        <p>Never share your secret with anyone or include it in client code.</p>
      </EmphasisCard>
      <p>
        If your backend uses Node.js, Go, or Java, use our{' '}
        <Link to="/reference/server-libraries#generating-server-auth-tokens">
          server libraries
        </Link>{' '}
        to generate server auth tokens.
      </p>
      <p>
        Otherwise, please see our{' '}
        <Link to="/reference/authentication">
          in-depth guide to authentication
        </Link>{' '}
        to learn how to generate server auth tokens.
      </p>
      <HR />
      <NextUp>
        <NextUpCard title="Users" linkTo="/rest-apis/users">
          How to sync a user
        </NextUpCard>
        <NextUpCard title="Organizations" linkTo="/rest-apis/users">
          How to sync an organization
        </NextUpCard>
        <NextUpCard title="Batch" linkTo="/rest-apis/batch">
          Batch syncing users and organizations
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Authentication;
