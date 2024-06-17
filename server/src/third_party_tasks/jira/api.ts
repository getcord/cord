import FormData from 'form-data';
import env from 'server/src/config/Env.ts';
import { JIRA_AUTH_REDIRECT_URL } from 'common/util/oauth.ts';
import type { AtlassianProject } from 'common/types/index.ts';
import type { AtlassianDocument } from 'server/src/third_party_tasks/jira/util.ts';
import { Errors } from 'common/const/Errors.ts';
import type { JiraAuthData } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';

type Identity = {
  account_type: string;
  account_id: string;
  email: string;
  name: string;
  picture: string;
  account_status: string;
  nickname: string;
  locale: string;
  extended_profile: object;
  email_verified: boolean;
};

type Resource = {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarURL: string;
};

type AtlassianUserType = 'atlassian' | 'app' | 'customer' | 'unknown';

type AtlassianUser = {
  accountId: string;
  accountType: AtlassianUserType;
  displayName: string;
  emailAddress: string | null;
  avatarUrls: Record<string, string>;
  active: boolean;
};

type AtlassianIssue = {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: AtlassianDocument;
    subtasks: Array<AtlassianIssue>;
    attachment: Array<{
      id: string;
      mimeType: string;
      content: string; // url
      thumbnail: string; // url
    }>;
    status: {
      statusCategory: {
        id: number;
        key: 'new' | 'indeterminate' | 'done';
        name: string;
      };
    };
    assignee: AtlassianUser | null;
    project: {
      self: string; // url
      id: string;
      key: string;
      name: string;
      avatarUrls: {
        [resolution: string]: string; // url
      };
    };
    priority: {
      name: string;
      iconUrl: string;
    };
  };
};

export async function completeOAuthFlow(code: string) {
  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: env.JIRA_APP_CLIENT_ID,
      client_secret: env.JIRA_APP_CLIENT_SECRET,
      code,
      redirect_uri: JIRA_AUTH_REDIRECT_URL,
    }),
  });

  const { access_token, refresh_token } = await response.json();

  if (!access_token) {
    throw new Error('Access token not received');
  }
  if (!refresh_token) {
    throw new Error('Refresh token not received');
  }

  const [identity, accessible_resources] = await Promise.all([
    me(access_token),
    accessibleResources(access_token),
  ]);

  const cloudID = accessible_resources[0].id;

  const projects = await fetchProjects(access_token, cloudID);

  return {
    refreshToken: refresh_token as string,
    identity,
    cloudID,
    projects: projects.values,
  };
}

async function me(accessToken: string): Promise<Identity> {
  const response = await fetch('https://api.atlassian.com/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
}

async function accessibleResources(accessToken: string): Promise<Resource[]> {
  const response = await fetch(
    'https://api.atlassian.com/oauth/token/accessible-resources',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  return await response.json();
}

// This function fetches the accessToken. However, once we migrate our JIRA app to rotating refreshTokens, then:
// 1) The refreshToken we used for fetching the accessToken becomes invalid.
// 2) JIRA's response will contain a new refreshToken that must replace the current one in the DB.
export async function fetchAccessToken(
  viewer: Viewer,
  refreshToken: string,
  cloudID: string,
) {
  const { userID, orgID } = assertViewerHasIdentity(viewer);
  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: env.JIRA_APP_CLIENT_ID,
      client_secret: env.JIRA_APP_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  const responseJSON = await handleResponseJSON<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>(response);

  // if this JIRA app is using rotating refreshTokens, then we need to update
  // the refreshToken in the DB
  // https://community.developer.atlassian.com/t/4-aug-2021-action-required-deprecating-persistent-refresh-tokens/50348
  if (responseJSON.refresh_token) {
    const newExternalAuthData: JiraAuthData = {
      cloudID,
      refreshToken: responseJSON.refresh_token,
    };
    await ThirdPartyConnectionEntity.update(
      { externalAuthData: newExternalAuthData },
      {
        where: {
          userID,
          orgID,
          type: 'jira',
        },
      },
    );
  }

  return responseJSON;
}

export async function fetchProjects(accessToken: string, cloudID: string) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/project/search?expand=issueTypes`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  return await handleResponseJSON<{
    maxResults: number;
    startAt: number;
    total: number;
    isLast: boolean;
    values: AtlassianProject[];
  }>(response);
}

export async function createIssue(
  accessToken: string,
  cloudID: string,
  summary: string,
  description: AtlassianDocument,
  projectID: string,
  issueType: string,
  assigneeID: string | null,
  parentIssueID?: string,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update: {},
        fields: {
          // Summary must be fewer than 255 chars
          // https://community.atlassian.com/t5/Jira-questions/Summary-must-be-less-than-255-characters/qaq-p/989632
          summary: summary.slice(0, 254),
          description,
          issuetype: { id: issueType },
          project: { id: projectID },
          assignee: { id: assigneeID },
          parent: { id: parentIssueID },
          // components: [{ id: '10000' }],
          // reporter: {
          //   id: '5b10a2844c20165700ede21g',
          // },
          // fixVersions: [{ id: '10001' }],
          // priority: {
          //   id: '20000',
          // },
          // timetracking: {
          //   remainingEstimate: '5',
          //   originalEstimate: '10',
          // },
          // security: {
          //   id: '10000',
          // },
          // environment: {
          //   type: 'doc',
          //   version: 1,
          //   content: [
          //     {
          //       type: 'paragraph',
          //       content: [
          //         {
          //           text: 'UAT',
          //           type: 'text',
          //         },
          //       ],
          //     },
          //   ],
          // },
          // versions: [{ id: '10000' }],
          // duedate: '2019-05-11',
        },
      }),
    },
  );

  return await handleResponseJSON<{
    id: string;
    key: string;
  }>(response);
}

export async function assignIssue(
  accessToken: string,
  cloudID: string,
  issueID: string,
  assigneeID: string | null,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}/assignee`,
    {
      method: 'put',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId: assigneeID }),
    },
  );

  await handleResponse(response);
}

export async function addIssueWatcher(
  accessToken: string,
  cloudID: string,
  issueID: string,
  watcherID: string,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}/watchers`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(watcherID),
    },
  );

  await handleResponse(response);
}

export async function addIssueAttachment(
  accessToken: string,
  cloudID: string,
  issueID: string,
  filename: string,
  contentType: string,
  stream: ReadableStream<Uint8Array>,
  filesize: number,
) {
  const form = new FormData();
  form.append('file', stream, {
    filename,
    contentType,
    knownLength: filesize,
  });

  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}/attachments`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Atlassian-Token': 'no-check',
        Accept: 'application/json',
      },
      body: form.getBuffer(),
    },
  );

  return await handleResponseJSON(response);
}

export async function getIssueTransitions(
  accessToken: string,
  cloudID: string,
  issueID: string,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}/transitions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
  );

  return await handleResponseJSON<{
    transitions: Array<{
      id: string;
      isAvailable: boolean;
      to: {
        id: string;
        statusCategory: {
          id: number;
          key: 'new' | 'indeterminate' | 'done';
          name: string;
        };
      };
    }>;
  }>(response);
}

export async function transitionIssue(
  accessToken: string,
  cloudID: string,
  issueID: string,
  transitionID: string,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}/transitions`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transition: { id: transitionID },
      }),
    },
  );

  return await handleResponse(response);
}

export async function addIssueComment(
  accessToken: string,
  cloudID: string,
  issueID: string,
  comment: AtlassianDocument,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}/comment`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: comment,
      }),
    },
  );

  return await handleResponseJSON(response);
}

export async function getIssue(
  accessToken: string,
  cloudID: string,
  issueID: string,
) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/issue/${issueID}?fields=*all&properties=*all`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  return await handleResponseJSON<AtlassianIssue>(response);
}

export async function getServerInfo(cloudID: string) {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudID}/rest/api/3/serverInfo`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  return await handleResponseJSON<{ baseUrl: string }>(response);
}

async function handleResponseJSON<T>(response: Response) {
  const textResponse = await handleResponse(response);

  try {
    return JSON.parse(textResponse) as T;
  } catch (e) {
    throw new Error('Could not deserialize response JSON: ' + textResponse);
  }
}

async function handleResponse(response: Response) {
  const textResponse = await response.text();

  if (response.status >= 400) {
    if (response.status === 403) {
      throw new Error(Errors.EXTERNAL_API_FORBIDDEN_RESPONSE);
    } else {
      throw new Error(textResponse);
    }
  }

  return textResponse;
}
