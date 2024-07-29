import * as url from 'url';
import type { Request, Response, NextFunction } from 'express';
import * as cookie from 'cookie';
import * as Slack from '@slack/web-api';
import { Op, QueryTypes } from 'sequelize';

import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

import type { SlackTeam } from 'server/src/slack/api.ts';
import {
  fetchAuthedSlackUser,
  fetchSlackUserInfo,
  fetchSlackTeamInfo,
  fetchSlackChannelList,
} from 'server/src/slack/api.ts';
import { Viewer, assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { OrgMutator } from 'server/src/entity/org/OrgMutator.ts';
import type { SlackBotUserAuthData } from 'server/src/slack/types.ts';
import { updateOrCreateSlackUserProfile } from 'server/src/slack/util.ts';
import { APP_ORIGIN, SLACK_APP_REDIRECT_HOST } from 'common/const/Urls.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { LogLevel } from 'common/types/index.ts';
import { SlackChannelMutator } from 'server/src/entity/slack_channel/SlackChannelMutator.ts';
import { parametersFromRequest } from 'server/src/util/cookies.ts';
import {
  SLACK_DEV_APP_ID,
  SLACK_APP_ID,
  CORD_TEST_SLACK_TEAM_ID,
  SLACK_APP_CLIENT_ID,
  SLACK_DEV_APP_CLIENT_ID,
} from 'common/const/Ids.ts';
import { slackLoginURL } from 'common/util/oauth.ts';
import env from 'server/src/config/Env.ts';
import { decodeSlackOAuthState } from 'server/src/auth/oauth.ts';
import { LinkedOrgsMutator } from 'server/src/entity/linked_orgs/LinkedOrgsMutator.ts';
import { LinkedUsersMutator } from 'server/src/entity/linked_users/LinkedUsersMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import { Errors } from 'common/const/Errors.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import submitAsync from 'server/src/asyncTier/submitAsync.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { publishUserIdentityUpdate } from 'server/src/pubsub/index.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { extractHostname } from 'server/src/util/host.ts';

async function findOrCreateSlackOrg(
  bot_access_token: string,
  bot_user_id: string,
  team: SlackTeam,
  app_id: string,
) {
  const orgMutator = new OrgMutator(Viewer.createServiceViewer());

  const newAuthData: SlackBotUserAuthData = { bot_access_token, bot_user_id };
  const [orgEntity] = await orgMutator.findOrCreateSlackOrg({
    name: team.name,
    domain: team.domain,
    externalID: team.id,
    externalAuthData: newAuthData,
    state: 'active',
    slackAppID: app_id,
  });

  // If we receive newer access information, update the DB
  if (!isEqual(orgEntity.externalAuthData, newAuthData)) {
    orgEntity.externalAuthData = newAuthData;
    await orgEntity.save();
  }

  // Check if name or domain have changed, and update them in the db if true
  if (orgEntity.name !== team.name || orgEntity.domain !== team.domain) {
    orgEntity.name = team.name;
    orgEntity.domain = team.domain;
    await orgEntity.save();
  }

  return orgEntity;
}

function getNonceFromRequest(req: Request) {
  const cookies = req.headers.cookie;
  if (!cookies) {
    anonymousLogger().warn('No cookies found');
    return '';
  }
  const parsedCookies = cookie.parse(cookies);

  const nonce = parsedCookies['nonce'];

  if (!nonce) {
    return '';
  }

  return nonce;
}

function doCSRFCheck(nonceCookie: string, nonceState: string) {
  if (!nonceCookie) {
    anonymousLogger().warn('Nonce cookie not found');
    return false;
  }

  if (!nonceState) {
    anonymousLogger().warn('Nonce state not found');
    return false;
  }

  if (nonceState !== nonceCookie) {
    anonymousLogger().warn(
      'Login CSRF attempt detected. Nonce does not equal state value. Preventing Login',
    );
    return false;
  }

  return true;
}

export default function SlackAuthRedirectHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  let logger = anonymousLogger();
  let { state } = req.query;
  const slackAppRedirectHost = extractHostname(SLACK_APP_REDIRECT_HOST);
  const configDomainRegex = new RegExp(`^([\\w-]+\\.)*${slackAppRedirectHost?.replace('.', '\\.')}(?::\\d+)?$`);

  // Our Slack app has a short whitelist of redirect URLs. Slack does not allow
  // us to use localhost or hostnames resolving to localhost. Neither does it
  // allow wildcard hostnames.
  // To circumvent this restriction, we can use our prod/staging servers as
  // redirect targets, and serve a further http redirect to allow using Slack
  // login with our local dev environment.
  // Redirecting here happens when the state query parameter has a prefix like
  // `[hostname]`. In this case we redirect to the given hostname. We do not
  // validate that the state is a correctly signed JSON web token. That's
  // because local dev environments use different signing secrets, so they
  // wouldn't appear to be valid to the prod or staging server.
  // Instead, we restrict redirect destinations to hostnames in the cord.com
  // domain (or any level of subdomain), optionally with a port number. (As such
  // `local.cord.com:8161` is a valid redirect host.) If we allowed redirecting
  // anywhere, then bad actors could prompt Slack login, asking to give Cord
  // access to a user's Slack org, but then have the Slack auth token sent to
  // them, via this redirect.
  if (typeof state === 'string' && state[0] === '[') {
    const match = /^\[([\w.:-]+)\](.*)$/.exec(state);
    if (match) {
      // The state looks like `[redirectHost]trueState`.
      const [_, redirectHost, trueState] = match;
      if (/^([\w-]+\.)*cord\.com(:\d+)?$/.test(redirectHost) || configDomainRegex.test(redirectHost)) {
        // The redirect host is in the cord.com domain. Redirect there!
        res.redirect(
          url.format({
            protocol: 'https',
            host: redirectHost,
            pathname: req.path,
            query: {
              ...req.query,
              state: trueState,
            },
          }),
        );
        return;
      }
    }
    // If the state begins with `[` but we didn't return from this function by
    // now. The redirect host prefix isn't well-formed or the host name is not
    // whitelisted. We just continue. Decoding `state` will fail below and
    // trigger an error.
  }

  const isDevApp = req.path.slice(-3) === 'dev';

  const { code, error } = req.query;

  if (typeof state !== 'string') {
    logger.error(
      'state was not a string as expected - continuing with empty state',
      { state },
    );
    state = '';
  }

  const decodedState = decodeSlackOAuthState(state);

  // returns the nonce otherwise returns an empty string
  const nonceCookie = getNonceFromRequest(req);

  const csrfCheckPassed = doCSRFCheck(nonceCookie, decodedState.nonce);

  let utmParameters;

  try {
    utmParameters = parametersFromRequest(req).utmParameters;
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  } catch (error) {
    logger.warn('Error parsing utm parameters from cookie');
    utmParameters = undefined;
  }

  (async (): Promise<string> => {
    function redirectURLWithError(errorMessage: string) {
      return `${APP_ORIGIN}/auth-slack-linking-error.html#message=${errorMessage}&service=slack`;
    }
    if (!code || !csrfCheckPassed) {
      // Slack login failed

      let errorMessage: string;
      if (error === 'access_denied') {
        // The user pressed "Cancel" in Slack's auth dialog
        errorMessage = 'slack-login-access-denied';
      } else if (!csrfCheckPassed) {
        // CSRF check did not pass
        errorMessage = 'slack-csrf-check-failed';
      } else {
        // Something else went wrong
        errorMessage = 'slack-login-failed';
      }

      const anonymousEventMutator = new EventMutator({
        viewer: Viewer.createAnonymousViewer(),
        utmParameters,
      });

      await anonymousEventMutator.createEvent({
        pageLoadID: null,
        installationID: null,
        eventNumber: null,
        clientTimestamp: null,
        logLevel: LogLevel.DEBUG,
        type: errorMessage,
        payload: { payload: errorMessage },
        metadata: {},
      });

      return redirectURLWithError(errorMessage);
    }

    // The Slack login seems to have succeeded. At least we have received a
    // Slack temporary auth code. We need to call the Slack API to turn that
    // into a permanent access token.
    const slackAuthedUserResponse = await fetchAuthedSlackUser(
      code.toString(),
      isDevApp,
      decodedState,
    );

    if (!slackAuthedUserResponse.authed_user || !slackAuthedUserResponse.team) {
      throw new Error('Slack authed user response malformed');
    }

    const {
      authed_user: { id: user_id },
      team: { id: team_id },
      access_token: bot_access_token,
      bot_user_id,
      app_id,
    } = slackAuthedUserResponse;

    if (!app_id || !user_id || !team_id || !bot_user_id || !bot_access_token) {
      throw new Error('Slack authed user response malformed');
    }

    // Usually the app_id will be that of our regular Cord Slack app. One
    // exception is that when logging into the `radicaltestorg` workspace,
    // we want to do that with the Cord dev Slack app.  The other exception is if
    // we are dealing with a customer who has given us the keys to their own
    // dedicated Cord Slack app.

    if (
      (team_id === CORD_TEST_SLACK_TEAM_ID && app_id !== SLACK_DEV_APP_ID) ||
      (team_id !== CORD_TEST_SLACK_TEAM_ID && app_id === SLACK_DEV_APP_ID)
    ) {
      // The app_id Slack gave us is one of ours, but it's not
      // `expectedAppId`, so it's not the right app id. Either someone
      // tried to login to our test org with the normal Slack app, or to
      // any other org with our dev Slack app.  Either way it doesn't
      // match.

      // Remove the app from the workspace again.
      const slackClient = new Slack.WebClient(bot_access_token);
      if (app_id === SLACK_APP_ID) {
        await slackClient.apps.uninstall({
          client_id: SLACK_APP_CLIENT_ID,
          client_secret: env.SLACK_APP_CLIENT_SECRET,
        });
      } else {
        await slackClient.apps.uninstall({
          client_id: SLACK_DEV_APP_CLIENT_ID,
          client_secret: env.SLACK_DEV_APP_CLIENT_SECRET,
        });
      }

      // Redirect to the login again. We pass the `team_id` to
      // `slackLoginURL`, it will produce the URL for the app matching the
      // team_id.
      return slackLoginURL(state, team_id);
    }

    const [userInfoResponse, teamInfoResponse, channelList] = await Promise.all(
      [
        // TODO(flooey): We should use a single WebClient for all of these calls
        // instead of passing the token to each function
        fetchSlackUserInfo(user_id, bot_access_token),
        fetchSlackTeamInfo(bot_access_token),
        fetchSlackChannelList(new Slack.WebClient(bot_access_token)),
      ],
    );

    // first of all ensure we have an org entity for this slack workspace
    const org = await findOrCreateSlackOrg(
      bot_access_token,
      bot_user_id,
      teamInfoResponse.team,
      app_id,
    );

    if (decodedState.type === 'console_user') {
      await ApplicationEntity.update(
        { supportOrgID: org.id },
        { where: { id: decodedState.data.platformApplicationID } },
      );
    }

    // if a profile already exists for this slack user, return it, otherwise
    // create a new profile and associated user
    const user = await updateOrCreateSlackUserProfile(
      org,
      userInfoResponse.user,
    );

    // if the profile returns as null then the user state is 'deleted'
    if (!user) {
      return redirectURLWithError('DeletedUser');
    }

    let viewerOfSourceUser = Viewer.createAnonymousViewer();
    logger = new Logger(viewerOfSourceUser);

    if (decodedState.type === 'link_org') {
      try {
        await getSequelize().transaction(async (transaction) => {
          if (decodedState.type === 'link_org') {
            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            const [user, org] = await Promise.all([
              UserEntity.findByPk(decodedState.data.userID),
              OrgEntity.findByPk(decodedState.data.orgID),
            ]);

            if (!user?.externalID || !org?.externalID) {
              throw new Error('Cannot find external ids when linking org');
            }

            viewerOfSourceUser = await Viewer.createLoggedInPlatformViewer({
              user,
              org,
            });
          }

          const { userID: sourceUserID, orgID: sourceOrgID } =
            assertViewerHasIdentity(viewerOfSourceUser);

          const [
            isPlatformOrgAlreadyLinkedToAnotherOrg,
            isSlackOrgAlreadyLinkedToAnotherOrg,
          ] = await Promise.all([
            Boolean(
              await LinkedOrgsEntity.findOne({
                where: {
                  sourceOrgID,
                  linkedOrgID: { [Op.ne]: org.id },
                },
                transaction,
              }),
            ),
            Boolean(
              await LinkedOrgsEntity.findOne({
                where: {
                  sourceOrgID: { [Op.ne]: sourceOrgID },
                  linkedOrgID: org.id,
                },
                transaction,
              }),
            ),
          ]);

          if (isPlatformOrgAlreadyLinkedToAnotherOrg) {
            // the transaction will automatically be rolled back
            throw new Error(Errors.PLATFORM_ORG_ALREADY_LINKED);
          }

          const linkedOrgsMutator = new LinkedOrgsMutator(
            viewerOfSourceUser,
            null,
          );
          const linkedUsersMutator = new LinkedUsersMutator(viewerOfSourceUser);

          // Depending on the slackConnectAllOrgs value on the application, this
          // will link just the viewer org, or all of the user's orgs
          await linkedOrgsMutator.linkOrgs(org.id, transaction);

          await linkedUsersMutator.linkUsers(
            {
              sourceUserID,
              sourceOrgID,
              linkedUserID: user.id,
              linkedOrgID: org.id,
            },
            transaction,
          );

          // if this slack org is already connected to another embed in the same
          // platform i.e. TF, we check if the embed also has the same users
          // if they do, and they are linked to a slack user, we will also link
          // them to the same slack user in this embed org
          if (isSlackOrgAlreadyLinkedToAnotherOrg) {
            const membersInPlatformOrgQuery = `SELECT "userID" FROM cord.org_members WHERE "orgID"= $sourceOrgID AND "userID" != $sourceUserID`;

            const matchedLinkedUsersToLink =
              await getSequelize().query<LinkedUsersEntity>(
                // if more than one other embed org is currently connected to the
                // same slack org we make sure that we only get one row for each
                // sourceUserID
                `SELECT DISTINCT ON ("sourceUserID") * FROM cord.linked_users
              WHERE "sourceUserID" IN (${membersInPlatformOrgQuery})
              AND "sourceOrgID" != $sourceOrgID
              AND "linkedUserID" != $linkedUserID
              AND "linkedOrgID" = $linkedOrgID
              `,
                {
                  bind: {
                    sourceUserID,
                    sourceOrgID,
                    linkedUserID: user.id,
                    linkedOrgID: org.id,
                  },
                  type: QueryTypes.SELECT,
                  model: LinkedUsersEntity,
                  transaction,
                },
              );

            await Promise.all(
              matchedLinkedUsersToLink.map((linkedUser) =>
                linkedUsersMutator.linkUsers(
                  {
                    sourceUserID: linkedUser.sourceUserID,
                    sourceOrgID,
                    linkedUserID: linkedUser.linkedUserID,
                    linkedOrgID: org.id,
                  },
                  transaction,
                ),
              ),
            );
          }

          logger.debug('Linked two users', {
            sourceUserID,
            sourceOrgID,
            linkedUserID: user.id,
            linkedOrgID: org.id,
          });
          transaction.afterCommit(async () => {
            // Notify the logged in user that a Slack connection happened
            await publishUserIdentityUpdate({
              userID: sourceUserID,
              platformApplicationID: viewerOfSourceUser.platformApplicationID!,
            });
          });
        });
      } catch (e: any) {
        let errorMessage = 'error-connecting-platform-and-slack';
        let logLevel: 'error' | 'warn' = 'error';

        if (e.message === Errors.PLATFORM_ORG_ALREADY_LINKED) {
          errorMessage = Errors.PLATFORM_ORG_ALREADY_LINKED;
          logLevel = 'warn';
        }

        logger.logException(
          'Error connecting platform org with Slack org',
          e,
          {
            sourceUserID: viewerOfSourceUser.userID,
            sourceOrgID: viewerOfSourceUser.orgID,
            linkedUserID: user.id,
            linkedOrgID: org.id,
            decodedState,
            isDevApp,
          },
          undefined,
          logLevel,
        );

        return `${APP_ORIGIN}/auth-slack-linking-error.html#message=${errorMessage}&service=slack`;
      }
    }

    const viewer = Viewer.createLoggedInViewer(user.id, org.id);

    // execute further steps in parallel
    const promises: Promise<any>[] = [];

    // create grey users for other team members if necessary
    // and update any changed details of existing slack/cord users
    // on async tier
    await submitAsync('syncSlackGreyUsers', {
      orgID: org.id,
    });

    // save Slack channels in database
    promises.push(new SlackChannelMutator(viewer).createMany(channelList));

    // Log the successful Slack login.
    const eventMutator = new EventMutator({
      viewer,
      utmParameters,
    });
    promises.push(
      eventMutator.createEvent({
        pageLoadID: null,
        installationID: null,
        eventNumber: null,
        clientTimestamp: null,
        logLevel: LogLevel.DEBUG,
        type: 'slack-login-success',
        payload: {},
        metadata: {},
      }),
    );

    await Promise.all(promises);

    if (decodedState.type === 'link_org') {
      return `${APP_ORIGIN}/auth-puppet-complete.html`;
    }

    if (decodedState.type === 'console_user') {
      return `${APP_ORIGIN}/auth-complete.html#service=slack&origin=console`;
    }

    return redirectURLWithError('UnexpectedOutcome');
  })().then(
    // this is to make sure we do exactly one of the following:
    // * redirect, if the above async function succeeded at constructing the
    // redirect destination
    // * in case of an error, emit a 500 Server Error and log the error
    (redirect) => res.redirect(redirect),
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (error) => {
      res.sendStatus(500);
      logger.logException('Error in SlackAuthRedirectHandler', error, {
        isDevApp,
      });
    },
  );
}
