/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ServerLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function ServerLibraries() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Server Libraries"
      pageSubtitle={`To simplify development of your Cord integration, we have
        server-side libraries for several languages. These make it easier to
        produce tokens and call our REST API`}
      showTableOfContents={true}
    >
      <section>
        <H4>Installation</H4>
        <CodeBlock
          savePreferenceFor="server"
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: ServerLanguageDisplayNames.NODE,
              snippet: `npm install @cord-sdk/server`,
            },
            {
              language: 'bash',
              languageDisplayName: ServerLanguageDisplayNames.GOLANG,
              snippet: `go get cord.com/server`,
            },
            {
              language: 'gradle',
              languageDisplayName: ServerLanguageDisplayNames.JAVA,
              snippet: `implementation "com.cord:server:0.0.+"`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H4>Generating client auth tokens</H4>
        <p>
          All functions generate a JWT with <code>HS512</code> and an expiration
          time of 1 minute.
        </p>
        <p>
          You can get your project ID and secret from the{' '}
          <a href="https://console.cord.com">Cord console</a>. Store your secret
          securely on your servers.{' '}
          <strong>
            Don't share it with anyone, and don't include it in client code.
          </strong>
        </p>
        <p>
          See our{' '}
          <Link to="/reference/authentication#client-auth-token">
            authentication guide
          </Link>{' '}
          for a description of the behavior invoked by including optional parts
          of the client auth token data.
        </p>
        <CodeBlock
          savePreferenceFor="server"
          snippetList={[
            {
              language: 'typescript',
              languageDisplayName: ServerLanguageDisplayNames.NODE,
              snippet: `type PlatformUserVariables = {
    email: string;
    name?: string;
    profile_picture_url?: string;
    status?: 'active' | 'deleted';
};
type PlatformOrganizationVariables = {
    name: string;
    status?: 'active' | 'deleted';
    members?: Array<string | number>;
};
type ClientAuthTokenData = {
    app_id?: string;
    project_id?: string;
    user_id: string;
    organization_id: string;
    user_details?: PlatformUserVariables;
    organization_details?: PlatformOrganizationVariables;
};

function getClientAuthToken(project_id: string, project_secret: string, payload: Omit<ClientAuthTokenData, 'project_id' | 'app_id'>): string;`,
            },
            {
              language: 'go',
              languageDisplayName: ServerLanguageDisplayNames.GOLANG,
              snippet: `type Status int

const (
        Unspecified Status = iota
        Active
        Deleted
)

// Any values that are left at their zero value are not sent except
// Email, which is required.
type UserDetails struct {
        Email             string
        Name              string
        ProfilePictureURL string
        Status            Status
}

// Any values that are left at their zero value are not
// sent except Name, which is required.
type OrganizationDetails struct {
        Name    string
        Status  Status
        Members []string
}

type ClientAuthTokenData struct {
        UserID              string
        OrganizationID      string
        UserDetails         *UserDetails
        OrganizationDetails *OrganizationDetails
}

func ClientAuthToken(projectID string, secret []byte, data ClientAuthTokenData) (string, error)`,
            },
            {
              language: 'java',
              languageDisplayName: ServerLanguageDisplayNames.JAVA,
              snippet: `/* Example usage */

import com.cord.server.Cord;
import com.cord.server.ClientAuthTokenData;
import com.cord.server.PlatformUserVariables;
import com.cord.server.PlatformOrganizationVariables;

// "user" and "org" are your project's model objects
String clientToken = Cord.getClientAuthToken(
    PROJECT_ID,
    SECRET,
    new ClientAuthTokenData
          .ClientAuthTokenDataBuilder(user.getId(), org.getId())
          .organizationDetails(new PlatformOrganizationVariables
                  .PlatformOrganizationVariablesBuilder(org.getName())
                  .build())
          .userDetails(new PlatformUserVariables
                  .PlatformUserVariablesBuilder(user.getEmail())
                  .profilePictureUrl(user.getProfilePictureUrl())
                  .build())
          .build());`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H4>Generating server auth tokens</H4>
        <p>
          All functions generate a JWT with <code>HS512</code> and an expiration
          time of 1 minute.
        </p>
        <p>
          You can get your project ID and secret from the{' '}
          <a href="https://console.cord.com">Cord console</a>. Store your secret
          securely on your servers.{' '}
          <strong>
            Don't share it with anyone, and don't include it in client code.
          </strong>
          <CodeBlock
            savePreferenceFor="server"
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: `function getServerAuthToken(project_id: string, project_secret: string): string;`,
              },
              {
                language: 'go',
                languageDisplayName: ServerLanguageDisplayNames.GOLANG,
                snippet: `func ServerAuthToken(projectID string, secret []byte) (string, error)`,
              },
              {
                language: 'java',
                languageDisplayName: ServerLanguageDisplayNames.JAVA,
                snippet: `package com.cord.server;

public class Cord {
  public static String getServerAuthToken(String projectId, String secret);
}`,
              },
            ]}
          />
        </p>
      </section>

      <HR />
      <section>
        <H4>Generating Project management auth tokens</H4>
        <p>
          These are customer-level server authentication tokens used to interact
          only with the <Link to="/rest-apis/projects">Projects API</Link>
        </p>
        <p>
          You can get your customer ID and secret from the{' '}
          <a href="https://console.cord.com">Cord console</a>. Store your secret
          securely on your servers.{' '}
          <strong>
            Don't share it with anyone, and don't include it in client code.
          </strong>
        </p>
        <CodeBlock
          savePreferenceFor="server"
          snippetList={[
            {
              language: 'typescript',
              languageDisplayName: ServerLanguageDisplayNames.NODE,
              snippet: `function getProjectManagementAuthToken(customer_id: string, customer_secret: string): string;`,
            },
            {
              language: 'go',
              languageDisplayName: ServerLanguageDisplayNames.GOLANG,
              snippet: `func ProjectManagementAuthToken(customer_id string, secret []byte) (string, error)`,
            },
            {
              language: 'java',
              languageDisplayName: ServerLanguageDisplayNames.JAVA,
              snippet: `package com.cord.server;

public class Cord {
public static String getProjectManagementAuthToken(String customerId, String secret);
}`,
            },
          ]}
        />
      </section>

      <HR />
      <section>
        <H4>Making REST API calls</H4>
        <p>
          Some of our server SDKs provide a wrapper to generate a server auth
          token and make a REST API call. It requires a <code>project_id</code>{' '}
          and <code>project_secret</code> in order to sign a token, just like
          the functions above. It will make a <code>GET</code> request by
          default, but can make other types of request too.
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'typescript',
              languageDisplayName: ServerLanguageDisplayNames.NODE,
              snippet: `type FetchOptions = {
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE'; // Defaults to GET.

  project_id: string;
  project_secret: string;

  body?: string | object; // Defaults to empty body.
};

async function fetchCordRESTApi<T>(endpoint: string, opts: FetchOptions): Promise<T>;

// Some examples:

import { fetchCordRESTApi } from '@cord-sdk/server';
import type { CoreThreadData } from '@cord-sdk/types';

const allThreads = await fetchCordRESTApi<CoreThreadData[]>('v1/threads', {
  project_id: /* ... */,
  project_secret: /* ... */,
});

const { success } = await fetchCordRESTApi<{
  success: boolean;
  message: string;
}>('v1/groups/my_favorite_group/members', {
  method: 'POST',
  body: { add: usersToAdd },
  project_id: /* ... */,
  project_secret: /* ... */,
});
`,
            },
          ]}
        />
      </section>
    </Page>
  );
}

export default ServerLibraries;
