// Brittle code warning! A lot of IDs, page locations, thread metadata depends
// on the values / logic in opensource/sample-apps code.
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import {
  findOrCreatePlatformOrganization,
  forwardHandlerExceptionsToNext,
  ApiCallerError,
  createDummyPlatformUser,
  findOrCreatePlatformApplication,
} from 'server/src/public/routes/platform/util.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  CORD_DEMO_APPS_TOKEN_CUSTOMER_ID,
  DEMO_APPS_APP_GROUP_ID,
} from 'common/const/Ids.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  SALES_TEAM_USERS,
  TEAM_PROFILES,
  BOT_USERS,
} from 'common/const/TeamProfiles.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  populateDashboardDemoWithData,
  populateDocumentDemoWithData,
  populateVideoDemoWithData,
  populateCanvasDemoWithData,
} from 'server/src/public/routes/demo-apps/demos.ts';
import type { UUID } from 'common/types/index.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { DEMO_APPS_WEBHOOK_URL } from 'common/const/Urls.ts';

const ANONYMOUS_ORG_NAME = 'Cord Demo Apps Group';
const NUM_OF_CORD_AVATARS = TEAM_PROFILES.length;
const DUMMY_USERS = TEAM_PROFILES.slice(-3);

const DUMMY_USERS_NAMES = DUMMY_USERS.map((dummyUser) => dummyUser.firstName);

/**
 * Generate a session token to be used in the Cord demo apps on docs.cord.com
 * and cord.com and for new apps, prepopulate them with comments.  One exception
 * is the demo app opensource repos on github - they use sample tokens
 * (see GetSampleSignedTokenHandler).
 *
 * This handler will:
 * 1. Create a platform app (or re-use the one passed in the request).
 * 2. Create and add a "dummy" user and group to said app.
 * 3. Create other dummy users and add messages from them welcoming the new user.
 * 4. Return the session token for dummy user.
 */
async function getDemoAppsTokenHandler(req: Request, res: Response) {
  if (
    (req.body.app_id !== undefined && typeof req.body.app_id !== 'string') ||
    (req.body.token !== undefined && typeof req.body.token !== 'string')
  ) {
    throw new ApiCallerError('invalid_field');
  }

  const app_id: string | undefined = req.body.app_id;
  const user_id: string | undefined = maybeGetUserId(req.body.token);

  let tokenUser =
    user_id && app_id
      ? await UserEntity.findOne({
          where: {
            externalID: user_id,
            platformApplicationID: app_id,
          },
        })
      : undefined;

  let tokenApp = app_id
    ? await ApplicationEntity.findOne({
        where: {
          id: app_id,
        },
      })
    : undefined;

  // Confirm that the requested app is indeed a demo app, and this is not someone
  // trying to hack a prod app
  if (tokenApp && tokenApp.environment !== 'demo') {
    anonymousLogger().warn('Request for non-demo demo token app', {
      ...req.body,
    });
    res.status(401).send('Invalid app_id');
    return;
  }

  if (!tokenUser || !tokenApp) {
    // This user is new (or their previous app was wiped) - create them
    // This function will create a new app if no app exists, or if this is someone
    // being invited to an existing demo room it will add them to the existing app.
    const {
      newUser,
      org: newOrg,
      app: newApp,
      isFirstUserOfOrg,
    } = await createDemoAppsUser(app_id);

    if (isFirstUserOfOrg) {
      await populateDemoAppGroup(newOrg, newUser);
    }

    tokenUser = newUser;
    tokenApp = newApp;
  }

  const session_token = jwt.sign(
    {
      user_id: tokenUser.externalID,
      app_id: tokenApp.id,
    },
    tokenApp.sharedSecret,
    {
      algorithm: 'HS512',
      expiresIn: '24 h',
    },
  );

  res.send({
    session_token,
    client_auth_token: session_token,
    app_id: tokenApp.id,
  });
}

export async function createDemoAppsUser(appID: UUID | undefined) {
  const sharedSecret = process.env.DEMO_APPS_SHARED_SECRET;
  if (!sharedSecret) {
    throw new Error('shared secret env variable should be defined');
  }

  const [app] = await findOrCreatePlatformApplication(
    appID ?? uuid(),
    'Cord Demo Apps',
    'demo',
    CORD_DEMO_APPS_TOKEN_CUSTOMER_ID,
    DEMO_APPS_WEBHOOK_URL,
    ['thread-message-added'],
    sharedSecret,
  );

  const [org] = await findOrCreatePlatformOrganization(
    app.id,
    DEMO_APPS_APP_GROUP_ID, // Must be stable group id for component prop groupIds to work
    ANONYMOUS_ORG_NAME,
    'active',
  );

  const { orgMembersCount, isFirstUserOfOrg } =
    await getSequelize().transaction(async (transaction) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const [[{ count: orgMembersCount }]] = (await getSequelize().query(
        `SELECT count(*) FROM org_members, users
            WHERE org_members."orgID" = $orgID
            AND org_members."userID" = users.id
            AND users."userType" = 'person'
            AND NOT(users."name" = ANY($name))
            AND NOT(users."name" = ANY($salesname));
            `,
        {
          bind: {
            orgID: org.id,
            name: DUMMY_USERS_NAMES,
            salesname: [...SALES_TEAM_USERS, ...BOT_USERS].map(
              (dummyUser) => dummyUser.firstName,
            ),
          },
          transaction,
        },
      )) as [{ count: string }[], unknown];

      const [[{ count: dummyUserCount }]] = (await getSequelize().query(
        `SELECT count(*) FROM org_members, users
            WHERE org_members."orgID" = $orgID
            AND org_members."userID" = users.id
            AND users."userType" = 'person'
            AND users."name" = ANY($name);
           `,
        {
          bind: {
            orgID: org.id,
            name: DUMMY_USERS_NAMES,
          },
          transaction,
        },
      )) as [{ count: string }[], unknown];
      return {
        orgMembersCount: parseInt(orgMembersCount, 10),
        isFirstUserOfOrg: parseInt(dummyUserCount, 10) === 0,
      };
    });

  const index = orgMembersCount % NUM_OF_CORD_AVATARS;

  // This fn also adds the new user to the specified group (which is necessary
  // when we stop signing tokens with groups as the automatic add-to-group-on-login
  // can no longer happen)
  const newUser = await createDummyPlatformUser({
    applicationID: app.id,
    firstName: TEAM_PROFILES[index].firstName,
    orgID: org.id,
    profilePicture: TEAM_PROFILES[index].profilePictureURL,
    dummy: false,
  });

  return {
    newUser,
    app,
    org,
    isFirstUserOfOrg,
  };
}

/**
 * Adds fake users and messages to the newly created demo app group.
 * This is so users who visit the demo apps always have content to look at
 * and interact with.
 */
async function populateDemoAppGroup(org: OrgEntity, anonymousUser: UserEntity) {
  const dummyUsers = await Promise.all(
    [...DUMMY_USERS, ...BOT_USERS].map((dummyUser) =>
      createDummyPlatformUser({
        applicationID: org.platformApplicationID!,
        orgID: org.id,
        firstName: dummyUser.firstName,
        profilePicture: dummyUser.profilePictureURL,
      }),
    ),
  );
  await Promise.all(
    SALES_TEAM_USERS.map((user) =>
      createDummyPlatformUser({
        applicationID: org.platformApplicationID!,
        orgID: org.id,
        firstName: user.firstName,
        profilePicture: user.profilePictureURL,
        email: user.email,
      }),
    ),
  );

  await Promise.all([
    populateDocumentDemoWithData({
      org,
      anonymousUser,
      dummyUsers,
    }),
    populateDashboardDemoWithData({
      org,
      anonymousUser,
      dummyUsers,
    }),
    populateVideoDemoWithData({
      org,
      anonymousUser,
      dummyUsers,
    }),
    populateCanvasDemoWithData({
      org,
      anonymousUser,
      dummyUsers,
    }),
  ]);
}

export default forwardHandlerExceptionsToNext(getDemoAppsTokenHandler);

function maybeGetUserId(token: string | undefined) {
  if (!token) {
    return null;
  }

  const decodedToken = jwt.decode(token);

  if (!(decodedToken instanceof Object) || !decodedToken.user_id) {
    return null;
  }

  return decodedToken.user_id;
}
