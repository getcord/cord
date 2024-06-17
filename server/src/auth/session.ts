import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { verify, decode } from 'jsonwebtoken';

import isUUID from 'validator/lib/isUUID.js';
import { getTokenFromAuthorizationHeader } from 'common/auth/index.ts';
import { Errors } from 'common/const/Errors.ts';
import { CLIENT_VERSION_MAX_DAYS_OLD } from 'common/const/Timing.ts';
import type { JsonObject, Tier } from 'common/types/index.ts';
import type { Session, Auth0Token } from 'server/src/auth/index.ts';
import {
  jwksClient,
  Viewer,
  createAnonymousSession,
  AuthProviderType,
} from 'server/src/auth/index.ts';
import env from 'server/src/config/Env.ts';
import { DeploysLoader } from 'server/src/entity/deploys/DeploysLoader.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import { updateOrganization } from 'server/src/public/routes/platform/orgs/UpdatePlatformOrganizationsHandler.ts';
import { updateOrganizationMembers } from 'server/src/public/routes/platform/org_members/UpdatePlatformOrganizationMembersHandler.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import {
  FeatureFlags,
  getFeatureFlagValue,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { updateUser } from 'server/src/public/routes/platform/users/UpdatePlatformUserHandler.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { isDefined } from 'common/util/index.ts';
import { Counter } from 'server/src/logging/prometheus.ts';
import type { InternalClientAuthTokenData } from 'server/src/public/routes/platform/types.ts';
import {
  CORD_SAMPLE_TOKEN_CUSTOMER_ID,
  DEMO_APPS_APP_GROUP_ID,
} from 'common/const/Ids.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { sampleTokenAppSecret } from 'server/src/util/sampleTokenAppSecret.ts';
import {
  removeEmptyStringEmailIfExists,
  validate,
} from 'server/src/public/routes/platform/validatorFunction.ts';
import { CordError } from 'server/src/util/CordError.ts';
import { ConsoleUserLoader } from 'server/src/entity/user/ConsoleUserLoader.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';

export async function decodeSessionFromJWT(token: string): Promise<Session> {
  const logger = anonymousLogger();
  const decoded = decode(token, { complete: true });
  if (typeof decoded?.payload === 'string') {
    // The decode() return type allows decoded.payload to be a string, which we
    // don't ever expect to happen and is never valid.
    throw new ApiCallerError(
      'invalid_access_token',
      { message: formatInvalidSessionError('Invalid jwt') },
      {
        token,
      },
    );
  }
  if (
    decoded?.header?.alg === 'RS256' &&
    decoded?.payload?.iss === `https://${env.AUTH0_CUSTOM_LOGIN_DOMAIN}/`
  ) {
    // This is an Auth0 token for the developer console
    const key = await jwksClient.getSigningKey(decoded?.header?.kid);
    const validated = verify(token, key.getPublicKey(), {
      algorithms: ['RS256'],
    }) as Auth0Token;

    // All of these below are passed in using the Auth0 Actions Login flow
    // under the add-email-to-token.
    // You can view and edit this in the Auth0 dashboard
    const email = validated['https://console.cord.com/email'];
    const email_verified = validated['https://console.cord.com/email_verified'];
    const auth0UserID = validated['auth0UserID'];

    if (!validated || !validated.sub || !email || !isDefined(email_verified)) {
      throw new ApiCallerError(
        'invalid_access_token',
        { message: formatInvalidSessionError('Invalid jwt') },
        {
          token,
        },
      );
    }

    const viewer = Viewer.createConsoleViewer(email);

    const consoleLoader = new ConsoleUserLoader(viewer);

    // Load the user to check if the they already have an auth0 user_id assigned
    const user = await consoleLoader.loadUser(email);

    if (!auth0UserID) {
      // This should never happen unless theres something wrong with our Auth0
      // actions..
      logger.error('Could not find auth0UserID', {
        attemptedLogin: { email },
      });
      throw new ApiCallerError('invalid_access_token');
    }

    if (!user || !user.auth0UserID) {
      // New sign up or existing user with no autt0 user id stored
      await new ConsoleUserMutator(viewer).upsertUser({
        email,
        verified: email_verified,
        auth0UserID,
      });

      return {
        viewer,
        console: {
          email_verified,
        },
      };
    }

    // Check to see if the auth0 user id in our database match
    if (auth0UserID !== user.auth0UserID) {
      // This is someone trying to log in to the console using another way of
      // authenticatin via Auth0 that they did before hane e.g they might
      // have originally used google, and now they are trying to login using
      // email and password.
      logger.error('Console auth0 user does not match', {
        attemptedLogin: { email, auth0UserID },
      });
      throw new ApiCallerError('invalid_console_user');
    }

    return {
      viewer,
      console: {
        email_verified,
      },
    };
  } else if (!decoded?.payload?.viewer) {
    // This is a session token from a partner
    // (a normal platform user client token)
    // NOTE: This function does some data cleaning as well
    const platformSession = await verifySessionToken(token);

    if (platformSession.group_details && !platformSession.group_id) {
      throw new ApiCallerError('group_not_found', {
        message: `Specified group_details to create/update a group, but not a group_id to create/update.`,
      });
    }

    // They sent user details along with the request, so update that user
    if (platformSession.user_details) {
      await updateUser(
        platformSession.app_id,
        platformSession.user_id,
        platformSession.user_details,
      );
    }
    // They sent org details along with the request, so update the org and link
    // the user and org
    if (platformSession.group_id && platformSession.group_details) {
      await updateOrganization(
        platformSession.app_id,
        platformSession.group_id,
        platformSession.group_details,
      );
    }
    if (
      platformSession.group_id &&
      (platformSession.user_details || platformSession.group_details)
    ) {
      // If either the user or the org had details supplied, they must mean for
      // these to be linked
      await updateOrganizationMembers(
        platformSession.app_id,
        platformSession.group_id,
        { add: [platformSession.user_id] },
      );
    }
    const { user, org } = await loadFromSessionToken(platformSession);

    return {
      viewer: await Viewer.createLoggedInPlatformViewer({
        user,
        org,
      }),
    };
  } else {
    // This is one of our tokens for the Cord application
    const {
      iat: _iat,
      exp: _exp,
      ...serializedSession
    } = verify(token, env.JWT_SIGNING_SECRET) as JwtPayload;
    return {
      ...serializedSession,
      viewer: Viewer.createFromSerializedState(serializedSession.viewer),
    };
  }
}

export async function getSessionFromAuthHeader(
  authHeader: string,
  clientVersion: string | null,
): Promise<Session> {
  let logger = anonymousLogger();
  if (authHeader) {
    let isClientTooOld = false;
    const clientVersionDaysOld = await getClientVersionDaysOld(clientVersion);
    if (clientVersionDaysOld > CLIENT_VERSION_MAX_DAYS_OLD) {
      isClientTooOld = true;
    }

    let session: Session;
    let token: string;
    try {
      token = getTokenFromAuthorizationHeader(authHeader);
    } catch (e) {
      throw new ApiCallerError(
        'invalid_access_token',
        { message: formatInvalidSessionError((e as any).message) },
        {
          error: e as JsonObject,
          authHeader,
        },
        { ...(e instanceof CordError && e.loggingTags) },
      );
    }

    try {
      session = await decodeSessionFromJWT(token);
    } catch (e) {
      throw new ApiCallerError(
        'invalid_access_token',
        { message: formatInvalidSessionError((e as any).message) },
        {
          error: e as JsonObject,
          encodedToken: token,
          decodedToken: decode(token),
        },
        { ...(e instanceof CordError && e.loggingTags) },
      );
    }
    logger = new Logger(session.viewer);

    if (
      isClientTooOld &&
      (await getFeatureFlagValue('enable_blocking_old_clients', {
        platformApplicationID:
          session.viewer.platformApplicationID ?? 'extension',
        userID: session.viewer.userID ?? 'anonymous',
        orgID: session.viewer.orgID,
        version: null,
      })) === true
    ) {
      // Checking after `session` is defined, so we can log more info.
      logger.info('Client too old.', {
        ...session.viewer,
        isAdmin: session.isAdmin,
        utmParameters: session.utmParameters,
        clientVersionDaysOld,
      });
      throw new Error(Errors.CLIENT_TOO_OLD);
    }

    // If we get a session with a user, verify the user exists in this database.
    // This defends against issues where someone switches between a local and
    // production database without logging out. It also defends against session
    // tokens for banned/disabled/deleted users.
    if (session.viewer.userID) {
      const userLoader = new UserLoader(
        Viewer.createServiceViewer(),
        () => null,
      );
      const user = await userLoader.loadUser(session.viewer.userID);
      if (!user || user.state === 'deleted') {
        throw new ClientFacingError(
          formatInvalidSessionError(
            'The user could not be loaded or is deleted in org',
          ),
          {
            user_id: session.viewer.userID,
            org_id: session.viewer.orgID,
            app_id: session.viewer.platformApplicationID ?? 'extension',
          },
        );
      }

      session.isAdmin = user.admin;
    }

    if (session.viewer.orgID) {
      const orgLoader = new OrgLoader(Viewer.createServiceViewer());
      const org = await orgLoader.loadOrg(session.viewer.orgID);
      if (!org || org.state === 'inactive') {
        throw new ClientFacingError(
          formatInvalidSessionError(
            'The org could not be loaded or is inactive',
          ),
          {
            org_id: session.viewer.orgID,
            app_id: session.viewer.platformApplicationID ?? 'extension',
          },
        );
      }
    }

    if (session.viewer.userID && session.viewer.orgID) {
      const orgMembership = await new OrgMembersLoader(
        Viewer.createServiceViewer(),
      ).loadUserOrgMembership(session.viewer.userID, session.viewer.orgID);

      if (!orgMembership) {
        throw new ApiCallerError(
          'user_not_in_organization',
          {
            message: formatInvalidSessionError(
              'The user is not part of the org',
            ),
          },
          {
            user_id: session.viewer.userID,
            org_id: session.viewer.orgID,
            app_id: session.viewer.platformApplicationID ?? 'extension',
          },
        );
      }
    }
    return session;
  } else {
    logger.debug('Anonymous session');
    return createAnonymousSession();
  }
}

async function getClientVersionDaysOld(clientVersion: string | null) {
  if (!clientVersion) {
    return 0;
  }
  const mostRecentDeployment = await new DeploysLoader(
    Viewer.createAnonymousViewer(),
  ).loadMostRecentSuccessfulDeploymentCached(
    clientVersion,
    env.CORD_TIER as Tier,
  );

  if (!mostRecentDeployment) {
    return 0;
  }

  const clientVersionDaysOld = Math.floor(
    (Date.now() - mostRecentDeployment.getTime()) / (1000 * 60 * 60 * 24),
  );

  return clientVersionDaysOld;
}

function formatInvalidSessionError(message: string) {
  return Errors.INVALID_SESSION + ' - ' + message;
}

const tokensWithNoAppIDCounter = Counter({
  name: 'tokensWithNoAppID',
  help: 'Someone attempted to authenticate using a token with no app_id',
});

function appIDInData(data: unknown) {
  if (!data) {
    return false;
  }

  if (typeof data !== 'object') {
    return false;
  }

  if (!('app_id' in data) && !('project_id' in data)) {
    return false;
  }

  const { app_id, project_id } = data as {
    app_id: unknown;
    project_id: unknown;
  };

  const appID = project_id ?? app_id;

  if (!appID || typeof appID !== 'string' || !isUUID.default(appID)) {
    return false;
  }
  return true;
}

export function validateSessionData(
  data: unknown,
): InternalClientAuthTokenData {
  if (!appIDInData(data)) {
    tokensWithNoAppIDCounter.inc({});
    // only want to throw this error if these values are missing,
    // not if it's not a valid input
    if (
      data &&
      typeof data === 'object' &&
      !('app_id' in data) &&
      !('project_id' in data)
    ) {
      throw new ApiCallerError('invalid_session_token', {
        message:
          `Invalid ClientAuthTokenData:\n` +
          `Input ${JSON.stringify(data)} requires field: project_id.\n` +
          'Refer to https://docs.cord.com/reference/authentication/',
        code: 401,
      });
    }
  }

  const {
    app_id,
    user_id,
    organization_id,
    user_details,
    organization_details,
    group_details,
    group_id,
    project_id,
  } = removeEmptyStringEmailIfExists(validate.ClientAuthTokenData(data));

  const orgID = group_id ?? organization_id;
  const appID = project_id ?? app_id;

  return {
    // at this point appID will not be undefined
    app_id: appID!,
    user_id: user_id.toString(), //in case it was a number
    group_id: orgID?.toString(), // in case it was a number
    user_details,
    group_details: group_details ?? organization_details,
  };
}

async function verifySessionToken(sessionToken: string, req?: Request) {
  let platformSession: InternalClientAuthTokenData;
  try {
    const data = decode(sessionToken);
    if (req && data instanceof Object) {
      req.appID = data?.app_id;
    }
    platformSession = validateSessionData(data);

    const application = await ApplicationEntity.findByPk(
      platformSession.app_id,
    );

    if (application) {
      verify(sessionToken, application.sharedSecret, {
        algorithms: ['HS256', 'HS512'],
      });
      return platformSession;
    }

    const appID = platformSession.app_id ?? platformSession.project_id;

    // The given application does not exist. Let's check if the token is signed with the secret for
    // a sample app.
    const sharedSecret = sampleTokenAppSecret(appID);

    try {
      verify(sessionToken, sharedSecret, {
        algorithms: ['HS256', 'HS512'],
      });
    } catch (_) {
      // The sample app secret was not used to sign the token. So it just
      // references a non-existing app.
      throw new ApiCallerError('project_not_found', {
        message: `Platform project ${platformSession.app_id} not found.`,
      });
    }

    // The token was signed with the sample token secret. Since the referenced
    // application does not exist yet, we must create it now,
    await ApplicationEntity.create({
      id: platformSession.app_id,
      name: 'Cord Sample Token',
      sharedSecret,
      environment: 'sampletoken',
      customerID: CORD_SAMPLE_TOKEN_CUSTOMER_ID,
    });

    // Because we no longer specify org in the token, we need to create the org
    // and user now, and add the user to the org
    const [org, user] = await Promise.all([
      OrgEntity.create({
        state: 'active',
        name: 'Cord Sample Group',
        externalID: DEMO_APPS_APP_GROUP_ID, // same as demo apps group because sometimes sample tokens are used for demo apps client code
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: platformSession.app_id,
      }),
      UserEntity.create({
        name: 'Sample User',
        nameUpdatedTimestamp: new Date(),
        profilePictureURL: `${APP_ORIGIN}/static/Anon-avatar-A.png`,
        externalID: platformSession.user_id,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: platformSession.app_id,
      }),
    ]);

    await OrgMembersEntity.create({
      userID: user.id,
      orgID: org.id,
    });

    return platformSession;
  } catch (e: any) {
    if (e instanceof ApiCallerError) {
      throw e;
    } else {
      throw new ApiCallerError('invalid_session_token', { message: e });
    }
  }
}

async function loadFromSessionToken(
  platformSession: InternalClientAuthTokenData,
) {
  const { app_id, user_id, group_id } = platformSession;

  const userLoader = new UserLoader(Viewer.createAnonymousViewer(), () => null);

  const [user, org] = await Promise.all([
    userLoader.loadUndeletedUser(user_id, app_id),
    group_id
      ? OrgEntity.findOne({
          where: {
            externalID: group_id,
            platformApplicationID: app_id,
          },
        })
      : null,
  ]);

  if (!user) {
    throw new ApiCallerError(
      'user_not_found',
      {
        message: `Unable to load user ${user_id} in application ${app_id}. Perhaps the user is marked 'deleted'.`,
      },
      { app_id },
    );
  }

  if (group_id && !org) {
    throw new ApiCallerError(
      'group_not_found',
      {
        message: `Platform group ${group_id} not found.`,
      },
      { app_id },
    );
  }

  // check the user is part of the organization
  if (org) {
    const orgMembership = await OrgMembersEntity.findOne({
      where: {
        userID: user.id,
        orgID: org.id,
      },
    });

    if (!orgMembership) {
      throw new ApiCallerError('user_not_in_group', undefined, {
        app_id,
        org_id: org.id,
        externalUserID: user.externalID,
        externalOrgID: org.externalID,
      });
    }
  } else {
    const application = await ApplicationEntity.findByPk(app_id);

    const flagsUser: FlagsUser = {
      userID: user.id,
      platformApplicationID: user.platformApplicationID ?? 'extension',
      version: null,
      appEnvironment: application?.environment,
    };
    const allowNullOrg = await getTypedFeatureFlagValue(
      FeatureFlags.ALLOW_MAGIC_GRAPHQL_ORG_ID_OVERRIDE,
      flagsUser,
    );
    if (!allowNullOrg) {
      throw new ApiCallerError('group_not_found', {
        message: `group_id missing from access token.`,
      });
    }
  }

  return {
    appID: app_id,
    user,
    org,
  };
}
