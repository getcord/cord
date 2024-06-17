import * as cookie from 'cookie';
import type { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import Handlebars from 'common/page_context/templating/handlebars.js';
import { slackLoginURL } from 'common/util/oauth.ts';
import { getSessionFromAuthHeader } from 'server/src/auth/session.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { encodeSlackLinkingToken } from 'server/src/auth/encodeSlackLinkingToken.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { TOP_SERVER_HOST } from 'common/const/Urls.ts';
import {
  CORD_SDK_TEST_APPLICATION_ID,
  CORD_TEST_SLACK_TEAM_ID,
} from 'common/const/Ids.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

export default async function SlackLinkingConfirmationHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const nonce = cookie.parse(req.headers.cookie || '')['nonce'] || nanoid();
  const { authToken } = req.query;
  if (typeof authToken !== 'string' || !authToken) {
    res.status(400).send('Bad request: Missing authToken parameter').end();
    return;
  }
  let session;
  try {
    session = await getSessionFromAuthHeader(`Bearer ${authToken}`, null);
  } catch (e) {
    res.status(400).send('Bad request: Invalid authToken').end();
    return;
  }
  const context = await contextWithSession(session, getSequelize(), null, null);
  const referer = req.headers.referer;
  if (!referer) {
    // NOTE(jozef): I assume that a referer will be always present but in case
    // some new browser privacy rules start omitting it, then we should be
    // notified about it
    context.logger.error('missing referer in SlackLinkingConfirmationHandler');
    res.status(400).send('Bad request: Missing referer header').end();
    return;
  }
  const { token: state, slackTeam } = await encodeSlackLinkingToken(
    context,
    nonce,
    'link_org',
  );

  const team =
    session.viewer.platformApplicationID === CORD_SDK_TEST_APPLICATION_ID
      ? CORD_TEST_SLACK_TEAM_ID
      : slackTeam;

  const application = await ApplicationEntity.findByPk(
    session.viewer.platformApplicationID,
  );

  if (!application) {
    throw new Error('Linking error - unable to find platform app');
  }

  const customAppDetails = application.getCustomSlackAppDetails();

  const slackUrl = slackLoginURL(state, team, customAppDetails?.clientID);

  res.cookie('nonce', nonce, {
    secure: true,
    maxAge: 1000 * 60 * 60 * 24, // expire after a day
    // This linking flow (for SDK) could set "httpOnly: true" and "domain:
    // API_SERVER_HOST". However the Slack linking flow in embed uses the
    // "nonce" cookie too and that flow assumes that the cookie is not httpOnly
    // and is set on TOP_SERVER_HOST (cord.com). If a user goes through the
    // flow in embed and the same day in sdk, then they would end up with the
    // nonce cookie set on different domains and with different httpOnly
    // setting which might break the second flow.
    httpOnly: false,
    domain: TOP_SERVER_HOST,
  });

  res.send(
    html({
      referer,
      slackUrl,
    }),
  );
  res.end();
}

const html = Handlebars.compile(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      .container {
        text-align: center;
        padding: 100px 10px;
        max-width: 600px;
        margin: auto;
        font-family: apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
          'Segoe UI Symbol';
      }
      a {
        text-decoration: none;
        display: block;
        padding: 8px;
        background-color: black;
        color: white;
        text-align: center;
        max-width: 50%;
        margin: auto;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <p><b>{{referer}}</b> wants to connect with Slack.</p>
      <a href="{{slackUrl}}">Continue</a>
    </div>
  </body>
</html>
`);
