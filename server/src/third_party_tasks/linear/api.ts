import env from 'server/src/config/Env.ts';
import { LINEAR_AUTH_REDIRECT_URL } from 'common/util/oauth.ts';
import type { JsonValue, LinearIssueStateTypes } from 'common/types/index.ts';
import { thirdPartyGraphQLRequest } from 'server/src/third_party_tasks/util.ts';

type UserInfoQueryResult = {
  viewer: {
    id: string;
    email: string;
    teams: {
      nodes: Array<{
        id: string;
        name: string;
        projects: {
          nodes: Array<{
            id: string;
            name: string;
          }>;
        };
      }>;
    };
  };
};

type CreateIssueMutationResult = {
  issueCreate: {
    success: boolean;
    issue: {
      id: string;
    };
  };
};

type UsersInOrgQueryResult = {
  users: {
    nodes: Array<{ id: string; email: string }>;
  };
};

type FileUploadMutationResult = {
  fileUpload: {
    success: boolean;
    uploadFile: {
      contentType: string;
      size: number;
      uploadUrl: string;
      assetUrl: string;
      headers: Array<{
        key: string;
        value: string;
      }>;
    };
  };
};

type WorkflowStatesQueryResult = {
  workflowStates: {
    nodes: Array<{
      id: string;
      type: string;
      team: {
        id: string;
      };
    }>;
  };
};

type UpdateIssueMutationResult = {
  issueUpdate: {
    success: boolean;
  };
};

type IssueDescriptionQueryResult = {
  issue: {
    description: string;
  };
};

type IssueQueryResult = {
  issue: {
    title: string;
    identifier: string;
    url: string;
    priorityLabel: string;
    assignee: {
      name: string;
    };
    state: {
      name: string;
      type: string;
    };
    team: {
      organization: {
        name: string;
      };
    };
  };
};

type CreateWebhookMutationResult = {
  webhookCreate: {
    success: boolean;
    webhook: {
      id: string;
      enabled: boolean;
    };
  };
};

type TeamsInOrgQueryResult = {
  viewer: {
    organization: {
      teams: {
        nodes: Array<{
          id: string;
          name: string;
        }>;
      };
    };
  };
};

async function apiRequest<T extends JsonValue = JsonValue>(
  query: string,
  accessToken: string,
  variables: object | null = null,
): Promise<T> {
  return await thirdPartyGraphQLRequest(
    'linear',
    query,
    accessToken,
    variables,
  );
}

export async function completeOAuthFlow(
  code: string,
): Promise<[string, UserInfoQueryResult['viewer']]> {
  // Linear expects params to be form encoded like for Asana.
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', env.LINEAR_APP_CLIENT_ID);
  params.append('client_secret', env.LINEAR_APP_CLIENT_SECRET);
  params.append('redirect_uri', LINEAR_AUTH_REDIRECT_URL);
  params.append('code', code);
  const response = await fetch('https://api.linear.app/oauth/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const { access_token } = await response.json();

  const userInfo = await getUserInfo(access_token);
  if (!userInfo) {
    throw new Error('Could not fetch Linear user information.');
  }

  return [access_token, userInfo];
}

export async function getUserInfo(
  accessToken: string,
): Promise<UserInfoQueryResult['viewer'] | null> {
  const query = `
    query UserInfo {
      viewer {
        id
        email
        teams {
          nodes {
            id
            name
            projects {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    }`;

  const responseJson = await apiRequest<UserInfoQueryResult>(
    query,
    accessToken,
  );

  return responseJson ? responseJson.viewer : null;
}

export async function createIssue(
  accessToken: string,
  teamId: string,
  title: string,
  description: string | null = null,
  assigneeId: string | null = null,
  parentId: string | null = null,
  projectId: string | null = null,
): Promise<string | null> {
  const input = {
    title,
    teamId,
    description,
    assigneeId,
    parentId,
    projectId,
  };

  const mutation = `
    mutation CreateIssue ($input: IssueCreateInput!){
      issueCreate(
        input:$input
      ) {
        success 
        issue {
          id
        }
      }
    }`;

  const responseJson = await apiRequest<CreateIssueMutationResult>(
    mutation,
    accessToken,
    { input },
  );

  return responseJson.issueCreate.issue.id;
}

export async function getUsersInOrg(
  accessToken: string,
): Promise<UsersInOrgQueryResult['users']['nodes'] | null> {
  const query = `
    query UsersInOrg {
      users {
        nodes {
          id
          email
        }
      }
    }`;

  const responseJson = await apiRequest<UsersInOrgQueryResult>(
    query,
    accessToken,
  );

  return responseJson ? responseJson.users.nodes : null;
}

async function getLinearUploadData(
  accessToken: string,
  filename: string,
  contentType: string,
  filesize: number,
): Promise<FileUploadMutationResult['fileUpload']['uploadFile'] | null> {
  const mutation = `
    mutation FileUpload($size: Int!, $contentType: String!, $filename: String!) {
      fileUpload(size: $size, contentType: $contentType, filename: $filename) {
        success
        uploadFile {
          contentType
          size
          uploadUrl
          assetUrl
          headers {
            key
            value
          }
        }
      } 
    }`;
  const variables = { size: filesize, contentType, filename };

  const responseJson = await apiRequest<FileUploadMutationResult>(
    mutation,
    accessToken,
    variables,
  );

  return responseJson ? responseJson.fileUpload.uploadFile : null;
}

export async function uploadFileToLinear(
  accessToken: string,
  filename: string,
  contentType: string,
  stream: ReadableStream<Uint8Array>,
  filesize: number,
): Promise<string | undefined> {
  const linearUploadData = await getLinearUploadData(
    accessToken,
    filename,
    contentType,
    filesize,
  );
  if (!linearUploadData) {
    return;
  }

  const { uploadUrl, assetUrl, headers } = linearUploadData;

  const authHeaders = new Headers();
  headers.map((header: { key: string; value: string }) => {
    authHeaders.append(header.key, header.value);
  });

  authHeaders.append('cache-control', 'max-age=31536000');
  authHeaders.append('Content-Type', `${contentType}`);

  const uploadResponse = await fetch(`${uploadUrl}`, {
    method: 'PUT',
    headers: authHeaders,
    body: stream,
  });

  if (uploadResponse.status === 200) {
    return assetUrl;
  } else {
    return undefined;
  }
}

async function getWorkflowStates(
  accessToken: string,
  teamID: string,
): Promise<Array<{ id: string; type: string }> | null> {
  const query = `
    query WorkflowStates {
      workflowStates {
        nodes {
          id
          type
          team {
            id
          }
        }
      }
    }`;
  const responseJson = await apiRequest<WorkflowStatesQueryResult>(
    query,
    accessToken,
  );

  const workflowStates = responseJson
    ? responseJson.workflowStates.nodes
    : null;

  if (!workflowStates || workflowStates.length === 0) {
    return null;
  }
  return workflowStates
    .filter((state) => state.team.id === teamID)
    .map((state) => ({ id: state.id, type: state.type }));
}

export async function updateIssueState(
  accessToken: string,
  newState: LinearIssueStateTypes,
  issueID: string,
  teamID: string,
) {
  const workflowStates = await getWorkflowStates(accessToken, teamID);
  if (!workflowStates) {
    return;
  }

  const [{ id }] = workflowStates.filter((state) => state.type === newState);

  const mutation = `
    mutation UpdateIssueState($id: String!, $stateId: String) {
      issueUpdate(
        id: $id
        input: {
          stateId: $stateId
        }
      ) {
          success
        }
    }`;

  const variables = { id: issueID, stateId: id };
  const responseJson = await apiRequest<UpdateIssueMutationResult>(
    mutation,
    accessToken,
    variables,
  );

  return responseJson.issueUpdate.success;
}

export async function updateIssueAssigneeAndSubscribers(
  accessToken: string,
  issueID: string,
  assigneeID: string,
  subscriberIDs: string[],
  updatedDescription: string,
) {
  const mutation = `
    mutation UpdateIssueAssignee ($id:String!, $assigneeId:String,  $subscriberIds:[String!], $description: String){
      issueUpdate(
        id: $id
        input: {
          assigneeId: $assigneeId
          description: $description
          subscriberIds: $subscriberIds
        }
      ) {
          success
        }
    }`;

  const variables = {
    id: issueID,
    assigneeId: assigneeID,
    description: updatedDescription,
    subscriberIds: subscriberIDs,
  };

  const responseJson = await apiRequest<UpdateIssueMutationResult>(
    mutation,
    accessToken,
    variables,
  );

  return responseJson.issueUpdate.success;
}

export async function getIssueDescription(
  issueID: string,
  accessToken: string,
): Promise<string> {
  const query = `
    query IssueDescription ($id: String!){
      issue(id: $id) {
          description
        }
      }`;

  const variables = { id: issueID };
  const responseJson = await apiRequest<IssueDescriptionQueryResult>(
    query,
    accessToken,
    variables,
  );

  return responseJson ? responseJson.issue.description : '';
}

export async function updateIssueDescription(
  issueID: string,
  accessToken: string,
  updatedDescription: string,
) {
  const mutation = `
    mutation UpdateIssueDescription ($id: String!, $description: String) {
      issueUpdate(
        id: $id
        input: {
          description: $description
        }
      ) {
        success
      }
    }`;

  const variables = {
    id: issueID,
    description: updatedDescription,
  };

  const responseJson = await apiRequest<UpdateIssueMutationResult>(
    mutation,
    accessToken,
    variables,
  );

  return responseJson.issueUpdate.success;
}

export async function getIssue(accessToken: string, issueID: string) {
  const query = `
    query Issue($id: String!) {
      issue(id: $id) {
        title
        identifier
        url
        priorityLabel
        assignee {
          name
        }
        state {
          name
          type
        }
        team {
          organization {
            name
          }
        }
      }
    }`;

  const variables = {
    id: issueID,
  };

  const responseJson = await apiRequest<IssueQueryResult>(
    query,
    accessToken,
    variables,
  );

  return responseJson ? responseJson.issue : null;
}

export async function createWebhook(
  accessToken: string,
  teamID: string,
  url: string,
  resourceTypes: string[],
  label: string | null = null,
): Promise<boolean | null> {
  try {
    const mutation = `
      mutation CreateWebhook($teamId: String!, $url: String!, $resourceTypes: [String!]!, $label: String) {
        webhookCreate(input:{
          label: $label
          teamId: $teamId
          url: $url
          resourceTypes: $resourceTypes
        }) {
          success
          webhook {
            id
            enabled
          }
        }
      }`;

    const variables = {
      teamId: teamID,
      url,
      resourceTypes,
      label,
    };

    const responseJson = await apiRequest<CreateWebhookMutationResult>(
      mutation,
      accessToken,
      variables,
    );

    return responseJson ? responseJson.webhookCreate.success : null;
  } catch (e) {
    return null;
  }
}

export async function getAllTeamsInUserOrg(
  accessToken: string,
): Promise<
  TeamsInOrgQueryResult['viewer']['organization']['teams']['nodes'] | null
> {
  const query = `
      query UserInfo {
        viewer {
          organization {
            teams {
              nodes {
                id
                name
              }
            }
          }
        }
      }`;

  const responseJson = await apiRequest<TeamsInOrgQueryResult>(
    query,
    accessToken,
  );

  return responseJson ? responseJson.viewer.organization.teams.nodes : null;
}
