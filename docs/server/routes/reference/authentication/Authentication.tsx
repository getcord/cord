/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H3 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';

function Authentication() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Authentication"
      pageSubtitle={`How authentication works in Cord and best practices with JWTs`}
    >
      <EmphasisCard>
        <p>
          ℹ️ Before December 2023, authentication worked a little differently.
          Previously, we required client tokens to be signed with group (org)
          IDs. We now recommend omitting this for a more flexible user
          experience. The old approach continues to be supported. See{' '}
          <Link to="/reference/authentication/removing-group-from-token">
            here
          </Link>{' '}
          to learn more.
        </p>
      </EmphasisCard>
      <div
        css={{
          background: '#f7f7f7',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <img
          className="client-auth-diagram"
          src="/static/images/client-auth-diagram.svg"
          alt="Project authentication for the Cord components"
        />
      </div>
      <EmphasisCard>
        <p>
          💡 This page gives the details behind authentication. Our server
          libraries have functions for generating auth tokens, which abstract
          away these details. We recommend using those libraries, unless your
          backend uses a language for which we don't offer a server library.
        </p>
      </EmphasisCard>
      <section>
        <H3>Background</H3>
        <p>
          All authentication in Cord uses{' '}
          <a href="https://jwt.io/">JSON Web Tokens</a> (JWTs). A JWT consists
          of a JSON <i>payload</i>, plus a cryptographic signature generated
          using a <i>secret</i>.
        </p>
        <p>
          The payload contains information from the JWT signer that the verifier
          needs. We use two different payloads: one for client auth tokens and
          another for server auth tokens, so as to include only the information
          we need in each context.
        </p>
        <p>
          You can find your secret in the{' '}
          <a href="https://console.cord.com/projects">Cord console</a>; use it
          to sign all JWTs you send to Cord.
        </p>
        <p>
          You must generate all tokens on your backend. From there, you'll send
          client auth tokens to your frontend, and server auth tokens directly
          to Cord's servers.
        </p>
        <EmphasisCard>
          <p>
            ⚠️ Store your secret securely on your servers. Don't share it with
            anyone, and don't include it in client code.
          </p>
        </EmphasisCard>
      </section>
      <HR />
      <section>
        <H3>Signing</H3>
        <p>
          Sign all JWTs using the <code>HS512</code> (HMAC with SHA-512)
          algorithm.
        </p>
        <p>
          JWTs include an expiration time. For security, you should set the
          expiration of your JWTs to a short interval. Our recommendation is 1
          minute, which very safely accounts for any network delays and clock
          skew.
        </p>
      </section>
      <HR />
      <section>
        <H3>Verifying</H3>
        <p>
          If you set a{' '}
          <Link to="/customization/redirect-link">custom redirect link</Link>,
          you'll need to verify JWTs that Cord's servers send to your servers.
          They will be signed with your secret, using <code>HS256</code>.
        </p>
        <p>
          Use a JWT library for your language to verify the JWTs you receive
          before doing anything with their contents.
        </p>
      </section>
      <HR />
      <section>
        <H3>Client auth token</H3>
        <p>
          A client auth token is a JWT used to authorize a user to Cord in the
          browser. It must include your project ID and the ID for the user.
        </p>
        <p>The client auth token's payload can include these fields:</p>
        <PropertiesList
          headings={{}}
          properties={{
            JSON: {
              propertyOrder: ['project_id', 'user_id', 'user_details'],
              required: ['project_id', 'user_id'],
              properties: {
                project_id: {
                  type: 'uuid',
                  description: `Your project ID`,
                },

                user_id: {
                  type: 'string',
                  description: `This value can be any valid
[identifier](/reference/identifiers). It must be unique per user across your entire
Cord project.`,
                },

                user_details: {
                  type: 'object',
                  description: `If present, update's the user's details,
or creates a user with those details if the \`user_id\` is new to Cord. This is
an object that contains the same fields as the [user management REST
endpoint](/rest-apis/users).`,
                },
              },
            },
          }}
        />
      </section>
      <HR />
      <section>
        <H3>Server auth token</H3>
        <p>
          A server auth token is a JWT used to authorize your server to make
          calls to all of our <Link to="/rest-apis">REST API</Link> endpoints
          except for the <Link to="/rest-apis/projects">Projects API</Link>.
          Refer to the section below on{' '}
          <Link to="/reference/authentication#Project-management-auth-token">
            Project management auth tokens
          </Link>{' '}
          for guidance on the token needed to use the project api.
        </p>
        <p>The server auth token's payload only contains one field:</p>
        <PropertiesList
          headings={{}}
          properties={{
            JSON: {
              propertyOrder: ['project_id'],
              required: ['project_id'],
              properties: {
                project_id: {
                  type: 'uuid',
                  description: `Your project ID`,
                },
              },
            },
          }}
        />
        <HR />
      </section>{' '}
      <section>
        <H3>Project management auth token</H3>
        <p>
          Since server auth tokens are specific to a project, we require a
          higher level authentication token to make calls to our{' '}
          <Link to="/rest-apis/projects">Projects REST API</Link>.
        </p>
        <p>
          This is where the project management auth token comes in. It is a
          customer-level JWT used to authorize your server to make calls to the
          Projects API. For all other APIs, you should use a{' '}
          <Link to="/reference/authentication#Server-auth-token">
            server auth token
          </Link>
          .
        </p>

        <p>
          When signing this token, the secret key used should be your customer{' '}
          <code>secret</code> which can be found in the{' '}
          <a href="https://console.cord.com/settings/customer">Cord Console</a>.
        </p>

        <p>
          The project management auth token's payload only contains one field:
        </p>
        <PropertiesList
          properties={{
            JSON: {
              propertyOrder: ['customer_id'],
              required: ['customer_id'],
              properties: {
                customer_id: {
                  type: 'uuid',
                  description: `Your customer ID`,
                },
              },
            },
          }}
        />
      </section>
    </Page>
  );
}

export default Authentication;
