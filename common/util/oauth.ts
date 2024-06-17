import {
  CORD_TEST_SLACK_TEAM_ID,
  SLACK_APP_CLIENT_ID,
  SLACK_DEV_APP_CLIENT_ID,
} from 'common/const/Ids.ts';
import {
  API_SERVER_HOST,
  API_SERVER_HOST_PRODUCTION,
  SLACK_APP_REDIRECT_HOST,
} from 'common/const/Urls.ts';

const slackAuthRedirectHost = SLACK_APP_REDIRECT_HOST ?? API_SERVER_HOST;
const slackAuthRedirectStatePrefix = SLACK_APP_REDIRECT_HOST
  ? `[${API_SERVER_HOST}]`
  : '';

export const slackAuthRedirectURI = (isDevApp: boolean) =>
  `https://${slackAuthRedirectHost}/auth/slack/redirect/${
    isDevApp ? 'dev' : ''
  }`;

export const slackLoginURL = (
  state: string,
  team?: string | null,
  customClientID?: string,
) => {
  const logInToSlackDevApp = team === CORD_TEST_SLACK_TEAM_ID;

  const redirectURI = slackAuthRedirectURI(logInToSlackDevApp);

  // customClientID for an external Slack app, or our purple dev app for
  // Radical Test Org workspace, otherwise the normal yellow one
  const clientID =
    customClientID ??
    (logInToSlackDevApp ? SLACK_DEV_APP_CLIENT_ID : SLACK_APP_CLIENT_ID);

  const botOAuthScopes = [
    'channels:history',
    'channels:join',
    'channels:read',
    'chat:write',
    'chat:write.customize',
    'im:history',
    'im:write',
    'team:read',
    'users:read',
    'users:read.email',
    'files:read',
  ];

  return [
    'https://slack.com/oauth/v2/authorize?',
    `scope=${botOAuthScopes.join(',')}`,
    `&client_id=${clientID}`,
    `&redirect_uri=${encodeURIComponent(redirectURI)}`,
    `&state=${slackAuthRedirectStatePrefix}${state}`,
    team ? `&team=${team}` : '',
  ].join('');
};

export const JIRA_AUTH_REDIRECT_URL = `https://${API_SERVER_HOST_PRODUCTION}/auth/jira/redirect/`;
export const ASANA_AUTH_REDIRECT_URL = `https://${API_SERVER_HOST}/auth/asana/redirect/`;
export const LINEAR_AUTH_REDIRECT_URL = `https://${API_SERVER_HOST}/auth/linear/redirect/`;
export const TRELLO_AUTH_REDIRECT_URL = `https://${API_SERVER_HOST}/auth/trello/redirect/`;
export const TRELLO_AUTH_LOGIN_URL = `https://${API_SERVER_HOST}/auth/trello/login/`;
export const MONDAY_AUTH_REDIRECT_URL = `https://${API_SERVER_HOST}/auth/monday/redirect/`;
