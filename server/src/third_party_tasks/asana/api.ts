import FormData from 'form-data';
import env from 'server/src/config/Env.ts';
import { ASANA_AUTH_REDIRECT_URL } from 'common/util/oauth.ts';
import type { AsanaProject, DeepPartial } from 'common/types/index.ts';
import { ASANA_EVENTS_PATH } from 'server/src/public/routes/MainRouter.ts';
import { API_SERVER_HOST } from 'common/const/Urls.ts';
import { Errors } from 'common/const/Errors.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

// exchange OAuth code for a token that can be used to e.g. create tasks
// https://developers.asana.com/docs/oauth (Token Exchange endpoint)
export async function completeOAuthFlow(
  code: string,
): Promise<[string, DeepPartial<AsanaUserInfo>]> {
  // unlike server/src/jira/api.ts completeOAuthFlow(), Asana's server expects
  // params to be form encoded and not JSON encoded
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', env.ASANA_APP_CLIENT_ID);
  params.append('client_secret', env.ASANA_APP_CLIENT_SECRET); // never have this in the browser,
  params.append('redirect_uri', ASANA_AUTH_REDIRECT_URL);
  params.append('code', code);
  const response = await fetch('https://app.asana.com/-/oauth_token', {
    method: 'post',
    headers: {
      Accept: 'application/json',
    },
    body: params,
  });
  const { access_token, refresh_token } = await response.json();

  const userInfo = await getUserInfo(access_token, 'me');
  if (userInfo === undefined) {
    throw new Error('Could not fetch Asana user information');
  }

  return [refresh_token, userInfo];
}

// https://developers.asana.com/docs/oauth (Token Exchange endpoint)
// Note: Unlike Jira (which returns 403), Asana API returns code 400 when
// refreshToken is invalid (invalid_grant error)
export async function getAccessToken(refreshToken: string): Promise<
  | {
      success: true;
      access_token: string;
      expires_in: number;
    }
  | {
      success: false;
      error: string;
      error_description: string;
    }
> {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', env.ASANA_APP_CLIENT_ID);
  params.append('client_secret', env.ASANA_APP_CLIENT_SECRET); // never have this in the browser,
  params.append('redirect_uri', ASANA_AUTH_REDIRECT_URL);

  // params.append('code', code);
  const response = await fetch('https://app.asana.com/-/oauth_token', {
    method: 'post',
    headers: {
      Accept: 'application/json',
    },
    body: params,
  });
  const data = await response.json();
  // Example response:
  // {
  //     access_token: 'ey...',
  //     token_type: 'bearer',
  //     expires_in: 3600,
  //     data: {
  //       id: 1199949433766429,
  //         gid: '1199949433766429',
  //         name: 'Jozef Mokry',
  //         email: 'jozef@cord.com'
  //     }
  // }
  return {
    success: response.status === 200,
    ...data,
  };
}

export type AsanaUserInfo = {
  gid: string;
  email: string;
  name: string;
  photo: string | null;
  resource_type: 'user';
  workspaces: Array<{
    gid: string;
    name: string;
    resource_type: 'workspace';
  }>;
};

// returns DeepPartial<AsanaUserInfo> instead of AsanaUserInfo just to be on
// the safe side since data comes from a 3rd party
export async function getUserInfo(accessToken: string, asanaUserGID = 'me') {
  const response = await fetch(
    `https://app.asana.com/api/1.0/users/${asanaUserGID}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  // Example response:
  //   data: {
  //     gid: '1199954802624710',
  //     email: 'developer@cord.com',
  //     name: 'Developer',
  //     photo: null,
  //     resource_type: 'user',
  //     workspaces: [
  //       {
  //         gid: '1199945221905854',
  //         name: 'cord.com',
  //         resource_type: 'workspace',
  //       },
  //     ],
  //   },
  // };
  const json = await handleResponseJSON<{ data: AsanaUserInfo }>(response);
  return json.data;
}

// https://developers.asana.com/docs/create-a-task
export async function createTask(
  accessToken: string,
  workspaceGID: string,
  project: string | undefined,
  title: string,
  htmlNotes: string,
  parentAsanaTaskGID?: string,
  completed?: boolean,
) {
  const params = {
    data: {
      name: title,
      html_notes: htmlNotes,
      workspace: workspaceGID,
      parent: parentAsanaTaskGID,
      projects: project ? [project] : undefined,
      completed: completed ? true : false,
    },
  };
  const response = await fetch('https://app.asana.com/api/1.0/tasks', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(params),
  });
  const json = await handleResponseJSON<{ data: { gid: string } }>(response);
  return json.data.gid;
}

// https://developers.asana.com/docs/get-a-task
export async function getTask(accessToken: string, taskGID: string) {
  const response = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGID}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const json = await handleResponseJSON<{
    data: {
      assignee: {
        gid: string;
        name: string;
      } | null;
      completed: boolean;
      permalink_url: string;
      name: string;
      // and a bunch of other fields that we don't need right now
    };
  }>(response);
  return json.data;
}

export async function setAsanaTaskAsignee(
  accessToken: string,
  assigneeGID: string,
  taskGID: string,
) {
  const params = {
    data: {
      assignee: assigneeGID,
    },
  };
  const response = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGID}`,
    {
      method: 'put',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    },
  );
  return await handleResponseJSON(response);
}

export async function addAsanaTaskFollowers(
  accessToken: string,
  followerGIDs: string[],
  taskGID: string,
) {
  const params = {
    data: {
      followers: followerGIDs,
    },
  };
  const response = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGID}/addFollowers`,
    {
      method: 'post',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    },
  );
  return await handleResponseJSON(response);
}

export async function addCommentOnAsanaTask(
  accessToken: string,
  comment: string,
  taskGID: string,
  isPinned = false,
) {
  const params = {
    data: {
      text: comment,
      is_pinned: isPinned,
    },
  };
  const response = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGID}/stories`,
    {
      method: 'post',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    },
  );
  return await handleResponseJSON(response);
}

export async function attachFile(
  accessToken: string,
  taskGID: string,
  filename: string,
  contentType: string,
  stream: ReadableStream<Uint8Array>,
  filesize: number,
): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', stream, {
    contentType,
    filename,
    knownLength: filesize,
  });

  const response = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGID}/attachments`,
    {
      method: 'post',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData.getBuffer(),
    },
  );
  return await handleResponseJSON(response);
}

// https://developers.asana.com/docs/update-a-task
export async function setTaskClosed(
  accessToken: string,
  closed: boolean,
  taskGID: string,
) {
  const params = {
    data: {
      completed: closed,
    },
  };
  const response = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGID}`,
    {
      method: 'put',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    },
  );
  return await handleResponseJSON(response);
}

// https://developers.asana.com/docs/establish-a-webhook
export async function subscribeToUpdates(
  logger: Logger,
  accessToken: string,
  taskGID: string,
) {
  let targetHost = API_SERVER_HOST;
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.EXTERNAL_API_HOST_FOR_DEVELOPMENT) {
      logger.error(
        'A publicly available URL is needed to set up Asana webhook. ' +
          'Set EXTERNAL_API_HOST_FOR_DEVELOPMENT in your .env file if you want to receive webhooks ' +
          'locally.',
      );
      return;
    }
    targetHost = process.env.EXTERNAL_API_HOST_FOR_DEVELOPMENT;
  }
  const params = {
    data: {
      target: `https://${targetHost}${ASANA_EVENTS_PATH}`,
      resource: taskGID,
    },
  };
  const response = await fetch(`https://app.asana.com/api/1.0/webhooks`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(params),
  });
  return await handleResponseJSON(response);
}

type AsanaUser = {
  gid: string;
  email: string;
};
export async function getAsanaUsers(
  logger: Logger,
  accessToken: string,
  workspace: string,
): Promise<AsanaUser[] | undefined> {
  const users: AsanaUser[] = [];
  let fetchUrl:
    | string
    | undefined = `https://app.asana.com/api/1.0/users?opt_fields=gid,email&limit=100&workspace=${workspace}`;
  // to avoid infinite while loop, just in case.
  //TODO: This will break for companies with over maxFetchCount*limit=10k Asana users.
  let maxFetchCount = 100;
  while (maxFetchCount-- > 0 && fetchUrl) {
    const response: Response = await fetch(fetchUrl, {
      method: 'get',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await handleResponseJSON<{
      errors?: any;
      data?: AsanaUser[];
      next_page?: { uri: string };
    }>(response);
    if (json.errors || !json.data) {
      logger.error(`Could not fetch Asana users: ${json.errors}`);
      return undefined;
    }
    const newUsers: AsanaUser[] = json.data;
    users.push(...newUsers);
    fetchUrl = json.next_page?.uri;
  }
  return users;
}

export async function getAsanaProjects(accessToken: string, workspace: string) {
  const response = await fetch(
    `https://app.asana.com/api/1.0/projects?workspace=${workspace}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const json = await handleResponseJSON<{ data: AsanaProject[] }>(response);
  return json.data;
}

async function handleResponseJSON<T = unknown>(response: Response) {
  const textResponse = await response.text();

  if (response.status >= 400) {
    // Note: Unlike Jira, Asana returns 401 when we make a request to it with
    // invalid accessToken
    if (response.status === 401) {
      throw new Error(Errors.EXTERNAL_API_FORBIDDEN_RESPONSE);
    } else {
      throw new Error(textResponse);
    }
  }
  try {
    return JSON.parse(textResponse) as T;
  } catch (e) {
    throw new Error('Could not deserialize response JSON: ' + textResponse);
  }
}
