import * as querystring from 'querystring';
import type { Request, Response } from 'express';
import { OAuth } from 'oauth';
import env from 'server/src/config/Env.ts';
import { TRELLO_AUTH_REDIRECT_URL } from 'common/util/oauth.ts';
import type {
  JsonObject,
  TrelloCard,
  UUID,
  TrelloConnectionPreferencesType,
} from 'common/types/index.ts';
import type { TrelloAuthData } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

// sending client id and secret to request token will get a response with
// oauth_token and oauth secret.
const requestURL = 'https://trello.com/1/OAuthGetRequestToken';

// appending the oauth_token from above to the below url gives us the url to
// browser login for the client, once user has authorized, the oauth_token and
// an oauth_verifier is sent back
const authorizeURL = 'https://trello.com/1/OAuthAuthorizeToken';

// using the oauth_token, oauth_secret, and oauth_verifier, we can obtain the
// user access token and user access token secret
const accessURL = 'https://trello.com/1/OAuthGetAccessToken';

// for some reason, a space is needed at the end of the appName for it to appear,
// otherwise it is named 'an unknown application'
const appName = 'Cord ';

// Not sure if this is the best place to put the tokenSecret which is eventually
// discarded, also pushed the state from login handler into here to use later
const oauthTempSecrets: { [name: string]: string } = {};

const oauth = new OAuth(
  requestURL,
  accessURL,
  env.TRELLO_APP_CLIENT_ID,
  env.TRELLO_APP_CLIENT_SECRET,
  '1.0A',
  TRELLO_AUTH_REDIRECT_URL,
  'HMAC-SHA1',
);

const baseURL = 'https://api.trello.com/1';

export function getLoginURLWithRequestToken(req: Request, res: Response) {
  oauth.getOAuthRequestToken(function (error, token, tokenSecret) {
    if (error) {
      // not sure what the error handling here should be
      res.send(`Error occurred in OAuth request token: ${error}`);
    }
    const { state } = req.query;
    if (state) {
      oauthTempSecrets.state = state as string;
    } else {
      return res.send(
        // not sure what the error handling here should be
        `Error occurred in OAuth request token: state value not found`,
      );
    }
    oauthTempSecrets.token = tokenSecret;
    return res.redirect(
      [
        authorizeURL,
        `?oauth_token=${token}`,
        `&name=${appName}`,
        `&scope=read,write,account`,
        `&expiration=never`,
      ].join(''),
    );
  });
}

export async function completeOAuthFlow(
  oauthToken: UUID,
  oauthVerifier: UUID,
): Promise<[TrelloAuthData, string, TrelloConnectionPreferencesType]> {
  const { accessToken, accessTokenSecret } = await getAccessTokenAndSecret(
    oauthToken,
    oauthVerifier,
  );
  const state = oauthTempSecrets.state;
  const userResources = await getUserResources(accessToken);

  return [{ accessToken, accessTokenSecret }, state, userResources];
}

async function getAccessTokenAndSecret(
  oauthToken: UUID,
  oauthVerifier: UUID,
): Promise<TrelloAuthData> {
  //saved in variable, obtained in /auth/trello/login route
  const tokenSecret = oauthTempSecrets.token;

  return await new Promise((resolve, reject) => {
    oauth.getOAuthAccessToken(
      oauthToken,
      tokenSecret,
      oauthVerifier,
      function (error, accessToken, accessTokenSecret) {
        if (error) {
          reject(
            JSON.stringify({
              message: 'Error occurred while getting access token',
              error: error,
            }),
          );
        } else {
          resolve({ accessToken, accessTokenSecret });
        }
      },
    );
  });
}

export async function getUserResources(
  accessToken: UUID,
): Promise<TrelloConnectionPreferencesType> {
  const queryParams = querystring.stringify({
    fields: 'organizations,boards,email',
    organizations: 'all',
    organization_fields: 'name,id',
    boards: 'all',
    board_fields: 'name, id',
    board_lists: 'all',
  });

  const response = await fetch(`${baseURL}/members/me/?${queryParams}`, {
    method: 'get',
    headers: generateRequestHeader(accessToken),
  });

  return await response.json();
}

export async function createCard(
  accessToken: UUID,
  cardContent: TrelloCard,
): Promise<JsonObject> {
  const queryParams = querystring.stringify(cardContent);
  const response = await fetch(`${baseURL}/cards/?${queryParams}`, {
    method: 'post',
    headers: generateRequestHeader(accessToken),
  });

  const json = await response.json();

  if (json.errors) {
    anonymousLogger().error(`trello createCard`, json);
  }

  return json;
}

export async function addMemberToCard(
  accessToken: UUID,
  cardID: UUID,
  memberID: UUID,
) {
  const memberQuery = querystring.stringify({ id: cardID, value: memberID });
  const response = await fetch(
    `${baseURL}/cards/${cardID}/idMembers/?${memberQuery}`,
    {
      method: 'post',
      headers: generateRequestHeader(accessToken),
    },
  );
  return response.status === 200;
}

function generateRequestHeader(accessToken: UUID) {
  return {
    Accept: 'application/json',
    Authorization: `OAuth oauth_consumer_key="${env.TRELLO_APP_CLIENT_ID}", oauth_token="${accessToken}"`,
  };
}
