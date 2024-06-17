import type { Transaction } from 'sequelize';
import DataLoader from 'dataloader';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasOrg,
  assertViewerHasPlatformApplicationID,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserOrgID } from 'server/src/entity/common.ts';
import { MAX_IDS_PER_QUERY, keyFor } from 'server/src/entity/common.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';

export class OrgMembersLoader {
  viewer: Viewer;
  dataloader: DataLoader<UserOrgID, OrgMembersEntity | null>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => await this.loadBatch(keys),
      { cache: false },
    );
  }

  private async loadBatch(
    keys: readonly UserOrgID[],
    transaction?: Transaction,
  ): Promise<(OrgMembersEntity | null)[]> {
    // By far the most common calling pattern is loading a bunch of memberships
    // either all for the same org or all for the same user, in which case we
    // can turn this into a set of efficient queries that do an equality check
    // on the common one and an IN filter on the other.  If we end up with a
    // calling pattern that tries to load a scattershot set of memberships
    // across lots of different users and orgs (why?) we should improve this.
    const usersByOrg = new Map<UUID, Set<UUID>>();
    const orgsByUser = new Map<UUID, Set<UUID>>();
    for (const key of keys) {
      if (!usersByOrg.has(key.orgID)) {
        usersByOrg.set(key.orgID, new Set());
      }
      usersByOrg.get(key.orgID)!.add(key.userID);
      if (!orgsByUser.has(key.userID)) {
        orgsByUser.set(key.userID, new Set());
      }
      orgsByUser.get(key.userID)!.add(key.orgID);
    }

    const promises = [];
    if (usersByOrg.size < orgsByUser.size) {
      // We have fewer orgs than users, so query by org.
      for (const [orgID, userIDSet] of usersByOrg) {
        const userIDs = [...userIDSet];

        for (
          let offset = 0;
          offset < userIDs.length;
          offset += MAX_IDS_PER_QUERY
        ) {
          promises.push(
            OrgMembersEntity.findAll({
              where: {
                orgID,
                userID: userIDs.slice(offset, offset + MAX_IDS_PER_QUERY),
              },
              transaction,
            }),
          );
        }
      }
    } else {
      // We have fewer users than orgs, so query by user.
      for (const [userID, orgIDSet] of orgsByUser) {
        const orgIDs = [...orgIDSet];

        for (
          let offset = 0;
          offset < orgIDs.length;
          offset += MAX_IDS_PER_QUERY
        ) {
          promises.push(
            OrgMembersEntity.findAll({
              where: {
                userID,
                orgID: orgIDs.slice(offset, offset + MAX_IDS_PER_QUERY),
              },
              transaction,
            }),
          );
        }
      }
    }
    const orgMembers = (await Promise.all(promises)).flat();
    const index = new Map<string, OrgMembersEntity>();
    for (const orgMember of orgMembers) {
      index.set(
        keyFor({ userID: orgMember.userID, orgID: orgMember.orgID }),
        orgMember,
      );
    }
    return keys.map((userOrgId) => index.get(keyFor(userOrgId)) ?? null);
  }

  async loadUserOrgMembership(
    userID: UUID,
    orgID: UUID,
    transaction?: Transaction,
  ) {
    try {
      const key = { userID, orgID };
      if (transaction) {
        return (await this.loadBatch([key], transaction))[0];
      } else {
        return await this.dataloader.load(key);
      }
    } catch (e) {
      anonymousLogger().logException('Org members dataloader error', e);
      return null;
    }
  }

  async viewerCanAccessOrg(
    orgID: UUID,
    transaction?: Transaction,
  ): Promise<boolean> {
    if ((this.viewer.relevantOrgIDs ?? []).includes(orgID)) {
      return true;
    }
    const userID = assertViewerHasUser(this.viewer);
    const membership = await this.loadUserOrgMembership(
      userID,
      orgID,
      transaction,
    );
    return !!membership;
  }

  async viewerCanAccessOrgExternalID(externalOrgID: string): Promise<boolean> {
    const userID = assertViewerHasUser(this.viewer);
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      this.viewer,
    );

    const orgLoader = new OrgLoader(this.viewer);
    const org = await orgLoader.loadPlatformOrg(
      platformApplicationID,
      externalOrgID,
    );

    if (!org) {
      return false;
    }
    const membership = await this.loadUserOrgMembership(userID, org.id);
    return !!membership;
  }

  // I.e. all orgs they are literally a member of, but not Slack connected orgs
  async loadAllImmediateOrgIDsForUser() {
    const entities = await OrgMembersEntity.findAll({
      where: {
        userID: this.viewer.userID,
      },
      raw: true,
    });

    return entities.map((e) => e.orgID);
  }

  // I.e. all orgs they are literally a member of, but not Slack connected orgs
  async loadAllImmediateOrgsForUser() {
    const orgIds = await this.loadAllImmediateOrgIDsForUser();

    return await OrgEntity.findAll({
      where: {
        id: orgIds,
      },
    });
  }

  async loadAllOrgIDsForUser() {
    const platformOrgIDs = await this.loadAllImmediateOrgIDsForUser();

    const slackOrgs = await LinkedOrgsEntity.findAll({
      where: {
        sourceOrgID: platformOrgIDs,
      },
    });

    const slackOrgsIDs = slackOrgs.map((e) => e.linkedOrgID);

    return [...platformOrgIDs, ...slackOrgsIDs];
  }

  // Use this function if you want to load orgMembership for a user that might
  // not exist in a specified platform org but might exist in the Slack org linked
  // to that specified platform org.
  async loadForSpecifiedPlatformOrgOrLinkedSlackOrg(
    context: RequestContext,
    userID: UUID,
    orgID: UUID,
  ) {
    const orgMembership = await this.loadUserOrgMembership(userID, orgID);
    if (orgMembership) {
      return orgMembership;
    }

    const linkedOrgID =
      await context.loaders.linkedOrgsLoader.getConnectedSlackOrgID(orgID);
    if (!linkedOrgID) {
      return null;
    }
    return await this.loadUserOrgMembership(userID, linkedOrgID);
  }

  async loadNotifiableOrgMembers(limit: number | undefined) {
    const orgID = assertViewerHasOrg(this.viewer);

    // find all non-deleted orgMembers of type "person"
    return await OrgMembersEntity.findAll({
      where: {
        orgID,
      },
      include: [
        {
          model: UserEntity,
          required: true,
          where: { userType: 'person' },
          // dont bother fetching UserEntity attributes
          attributes: [],
        },
      ],
      limit,
    });
  }
}
