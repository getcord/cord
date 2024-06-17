import { JwksClient } from 'jwks-rsa';

import type { UUID } from 'common/types/index.ts';
import env from 'server/src/config/Env.ts';
import type { GACookieType } from 'server/src/util/google-analytics.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

export const SERVICE_USER_ID = 'service_user';

export enum AuthProviderType {
  SLACK = 'slack',
  PLATFORM = 'platform',
}

export const jwksClient = new JwksClient({
  jwksUri: `https://${env.AUTH0_CUSTOM_LOGIN_DOMAIN}/.well-known/jwks.json`,
});

// There is a surprising (and growing) amount of stuff that we'll want to store
// as part of the user session. It makes sense to write this to a DB on the server
// and to use a very small payload for network round trips (i.e. just the key to
// the hash table value). This idea is the basis of the 'datr' cookie within
// Facebook.
export interface Session {
  viewer: Viewer;
  isAdmin?: boolean;
  console?: ConsoleSession;
  utmParameters?: { [key: string]: string | string[] | undefined };
  ga?: GACookieType;
}

interface ConsoleSession {
  email_verified: boolean;
}

export interface Auth0Token {
  iss: string;
  sub: string;
  'https://console.cord.com/email': string;
  'https://console.cord.com/email_verified': boolean;
  auth0UserID: string;
  aud: string | string[];
}

export function createAnonymousSession() {
  return {
    viewer: Viewer.createAnonymousViewer(),
  };
}

export class Viewer {
  private constructor(
    public readonly userID: UUID | undefined,
    public readonly orgID: UUID | undefined,
    public readonly platformApplicationID?: UUID,
    public readonly externalUserID?: string,
    public readonly externalOrgID?: string,
    public readonly developerUserID?: string,
    public readonly originalOrgID?: UUID,
    public readonly relevantOrgIDs?: UUID[],
  ) {
    if (orgID !== undefined && relevantOrgIDs !== undefined) {
      // Note that a constructed Viewer can have both of these fields set at the
      // same time -- we do that in the third case below for backwards-compat.
      // But you can't specify the creation of a Viewer with both of these, to
      // try to force new code to "do the right thing".
      if (relevantOrgIDs.length !== 1 || relevantOrgIDs[0] !== orgID) {
        throw new Error(
          'You specified both a single orgID and relevantOrgIDs. ' +
            'You should pass undefined for the orgID to catch places not using relevantOrgIDs. Be bold!',
        );
      }
    } else if (orgID !== undefined) {
      this.relevantOrgIDs = [orgID];
    }
  }

  static async createLoggedInPlatformViewer({
    user,
    org,
  }: {
    user: UserEntity;
    org: OrgEntity | null;
  }): Promise<Viewer> {
    if (!user.platformApplicationID) {
      throw new Error('Platform viewer must have platformApplicationID');
    }

    const relevantOrgIDs = org
      ? undefined
      : // OrgMembersLoader.loadAllImmediateOrgIDsForUser but we can't call that since we
        // don't have a viewer yet!
        (
          await OrgMembersEntity.findAll({
            where: {
              userID: user.id,
            },
          })
        ).map((e) => e.orgID);

    return new Viewer(
      user.id,
      org?.id,
      user.platformApplicationID,
      user.externalID,
      org?.externalID,
      undefined,
      undefined,
      relevantOrgIDs,
    );
  }

  static createLoggedInViewer(userID: UUID, orgID: UUID): Viewer {
    return new Viewer(userID, orgID);
  }

  static createOrgViewer(orgID: UUID, platformApplicationID?: UUID): Viewer {
    return new Viewer(undefined, orgID, platformApplicationID);
  }

  static createServiceViewer() {
    return new Viewer(SERVICE_USER_ID, undefined);
  }

  static createAnonymousViewer() {
    return new Viewer(undefined, undefined);
  }

  static createConsoleViewer(devUserID: string): Viewer {
    return new Viewer(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      devUserID,
    );
  }

  static createFromSerializedState(serializedViewer: Viewer): Viewer {
    const {
      userID,
      orgID,
      platformApplicationID,
      externalUserID,
      externalOrgID,
      developerUserID,
      originalOrgID,
      relevantOrgIDs,
      ...rest
    } = serializedViewer;
    const _: Record<string, never> = rest;

    return new Viewer(
      userID,
      orgID,
      platformApplicationID,
      externalUserID,
      externalOrgID,
      developerUserID,
      originalOrgID,
      relevantOrgIDs,
    );
  }

  /**
   * Returns a version of this Viewer with the orgID set to the given org ID,
   * used in situations where a user logged into one org wants to take an action
   * as themselves in another org, such as sending a message from the unified
   * inbox.  If the orgID given is the same as this Viewer's org ID, just
   * returns this Viewer again.
   */
  public viewerInOtherOrg(
    orgID: UUID | undefined,
    externalOrgID: string | undefined,
    relevantOrgIDs?: UUID[],
  ): Viewer {
    if (orgID === this.orgID && orgID !== undefined) {
      return this;
    }
    if (orgID === undefined && relevantOrgIDs === undefined) {
      throw new Error('viewerInOtherOrg provided with no orgs at all');
    }
    return new Viewer(
      this.userID,
      orgID,
      this.platformApplicationID,
      this.externalUserID,
      externalOrgID,
      this.developerUserID,
      this.originalOrgID ?? this.orgID,
      relevantOrgIDs,
    );
  }
}

export const assertViewerHasIdentity = (
  viewer: Viewer,
): {
  userID: UUID;
  orgID: UUID;
} => {
  if (!viewer.userID || !viewer.orgID) {
    throw new Error('Viewer must not be anonymous.');
  }

  return {
    userID: viewer.userID,
    orgID: viewer.orgID,
  };
};

export function assertViewerHasPlatformIdentity(viewer: Viewer): {
  userID: UUID;
  orgID: UUID;
  externalUserID: string;
  externalOrgID: string;
  platformApplicationID: string;
} {
  const { userID, orgID } = assertViewerHasIdentity(viewer);

  if (
    !viewer.externalUserID ||
    !viewer.externalOrgID ||
    !viewer.platformApplicationID
  ) {
    throw new Error('Viewer must be a platform viewer');
  }

  return {
    userID,
    orgID,
    platformApplicationID: viewer.platformApplicationID,
    externalUserID: viewer.externalUserID,
    externalOrgID: viewer.externalOrgID,
  };
}

export function viewerHasIdentity(viewer: Viewer) {
  return !!viewer.userID && !!viewer.orgID;
}

export function assertViewerHasUser(viewer: Viewer): UUID {
  const { userID } = viewer;

  if (!userID) {
    throw new Error('Viewer user must not be anonymous.');
  }

  return userID;
}

export function assertViewerHasOrg(viewer: Viewer): UUID {
  const { orgID } = viewer;

  if (!orgID) {
    throw new Error('Viewer org must not be anonymous.');
  }

  return orgID;
}

/**
 * Does basically the same thing as `assertViewerHasOrg`, except it throws a
 * client-facing error -- the idea being that you call this when it's *their*
 * error for not giving us a single org ID, instead of our internal logic error.
 * This also centralises all of the places we require a single org ID for
 * writes, so we can refactor/rethink/categorize/whatever them later.
 */
export function assertViewerHasSingleOrgForWrite(
  viewer: Viewer,
  error: string,
): UUID {
  const { orgID } = viewer;

  // Specifically check for viewer.orgID, and not
  // viewer.relevantOrgIDs.length === 1, so that we error in the case
  // where they didn't give us an org but the user happens to only be in
  // one -- to prevent sudden explosions when that user is added to
  // another org, require that they always explicitly specify.
  if (!orgID) {
    throw new ClientFacingError(error);
  }

  return orgID;
}

export function assertViewerHasOrgs(viewer: Viewer): UUID[] {
  const { relevantOrgIDs } = viewer;

  if (!relevantOrgIDs) {
    throw new Error('Viewer orgs must be nonempty.');
  }

  return relevantOrgIDs;
}

export function assertViewerHasPlatformUser(viewer: Viewer) {
  const { userID, externalUserID, platformApplicationID } = viewer;

  if (!userID || !externalUserID || !platformApplicationID) {
    throw new Error('Viewer must have a platform user');
  }

  return { userID, externalUserID, platformApplicationID };
}

export function assertViewerHasPlatformApplicationID(viewer: Viewer): UUID {
  const { platformApplicationID } = viewer;

  if (!platformApplicationID) {
    throw new Error('Viewer must have a platform app ID');
  }

  return platformApplicationID;
}

export function assertServiceViewer(viewer: Viewer) {
  if (viewer.userID !== SERVICE_USER_ID) {
    throw new Error('Viewer must be service user.');
  }
}

export function assertConsoleUser(viewer: Viewer) {
  if (!viewer.developerUserID) {
    throw new Error('User must have an email');
  }

  return { email: viewer.developerUserID };
}

export function viewerIsUsingOrgsAsFilter(viewer: Viewer) {
  // Right now, platform viewers are in one of two states:
  //   - everything is org-less, in which case relevantOrgIDs is filled out and
  //     orgID is undefined
  //   - we have an org, either via the token or an explicit `filter`, which
  //     sets orgID and sets relevantOrgIDs to [orgID]
  // This code looks for the second case. This is a bit of a hack -- it is going
  // to break as soon as we allow multiple org IDs as a filter (which will have
  // to stuff them into relevantOrgIDs), but at least there's one codepath to
  // update when we build that, through here.
  return viewer.orgID !== undefined;
}
