import * as cookie from 'cookie';
import { nanoid } from 'nanoid';
import {
  ASANA_AUTH_REDIRECT_URL,
  JIRA_AUTH_REDIRECT_URL,
  LINEAR_AUTH_REDIRECT_URL,
  MONDAY_AUTH_REDIRECT_URL,
  TRELLO_AUTH_LOGIN_URL,
} from 'common/util/oauth.ts';
import { APP_ORIGIN, TOP_SERVER_HOST } from 'common/const/Urls.ts';

export function getParamFromLocation(param: string): string | undefined {
  if (window.location.hash) {
    const regex = new RegExp(`${param}=([a-zA-Z0-9-_.]+)`);

    const matches = window.location.hash.match(regex);
    if (matches) {
      return matches[1];
    }
  }

  return undefined;
}

export const openPopupWindow = (url: string, width = 700, height = 700) => {
  return window.open(url, '_blank', `width=${width},height=${height}`);
};

export const jiraLoginURL = (state: string) => {
  return [
    'https://auth.atlassian.com/authorize?',
    `audience=api.atlassian.com`,
    `&client_id=${process.env.JIRA_APP_CLIENT_ID!}`,
    `&scope=${encodeURIComponent(
      [
        'read:me',
        'read:jira-user',
        'read:jira-work',
        'write:jira-work',
        'offline_access', // needed so we receive the refresh token
      ].join(' '),
    )}`,
    `&redirect_uri=${encodeURIComponent(JIRA_AUTH_REDIRECT_URL)}`,
    `&state=${encodeURIComponent(state)}`,
    `&response_type=code`,
    `&prompt=consent`,
  ].join('');
};

export const asanaLoginURL = (state: string) => {
  return [
    'https://app.asana.com/-/oauth_authorize',
    `?client_id=${process.env.ASANA_APP_CLIENT_ID!}`,
    `&redirect_uri=${encodeURIComponent(ASANA_AUTH_REDIRECT_URL)}`,
    `&state=${encodeURIComponent(state)}`,
    `&response_type=code`,
    `&scope=default`,
  ].join('');
};

export const linearLoginURL = (state: string) => {
  return [
    `https://linear.app/oauth/authorize`,
    `?response_type=code`,
    `&client_id=${process.env.LINEAR_APP_CLIENT_ID!}`,
    `&redirect_uri=${encodeURIComponent(LINEAR_AUTH_REDIRECT_URL)}`,
    `&state=${encodeURIComponent(state)}`,
    `&scope=${encodeURIComponent('read,write')}`,
  ].join('');
};

export const trelloLoginURL = (state: string) => {
  return [TRELLO_AUTH_LOGIN_URL, `?state=${encodeURIComponent(state)}`].join(
    '',
  );
};

export const mondayConnectInstructionsURL = (state: string) => {
  return `${APP_ORIGIN}/monday-connect.html?state=${encodeURIComponent(state)}`;
};

export const mondayInstallURL = () => {
  return [
    'https://auth.monday.com/oauth2/authorize',
    `?client_id=${process.env.MONDAY_APP_CLIENT_ID!}`,
    '&response_type=install',
  ].join('');
};

export const mondayAuthURL = (state: string) => {
  return [
    'https://auth.monday.com/oauth2/authorize',
    `?client_id=${process.env.MONDAY_APP_CLIENT_ID!}`,
    `&redirect_uri=${encodeURIComponent(MONDAY_AUTH_REDIRECT_URL)}`,
    `&state=${encodeURIComponent(state)}`,
  ].join('');
};

export const getAuthNonceFromCookie = () => {
  let nonce = '';
  const cookies = cookie.parse(document.cookie);
  if (cookies['nonce'] !== undefined && cookies['nonce'] !== null) {
    nonce = cookies['nonce'];
  } else {
    const expiryDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toUTCString();
    nonce = nanoid(10);
    document.cookie = `nonce=${nonce};domain=${TOP_SERVER_HOST};expires=${expiryDate};samesite=lax;secure`;
  }
  return nonce;
};
