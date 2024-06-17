import type { Transaction } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';

export class LinkedUsersMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async linkUsers(
    {
      sourceUserID,
      sourceOrgID,
      linkedUserID,
      linkedOrgID,
    }: {
      sourceUserID: UUID;
      sourceOrgID: UUID;
      linkedUserID: UUID;
      linkedOrgID: UUID;
    },
    transaction?: Transaction,
  ) {
    if (!this.viewer.platformApplicationID) {
      throw new Error('Trying to link Slack org to a non-platform org');
    }

    const application = await ApplicationEntity.findByPk(
      this.viewer.platformApplicationID,
    );

    if (!application) {
      throw new Error('No app id found for viewer');
    }

    if (application.slackConnectAllOrgs) {
      // Get all of the user's orgs
      const allUsersPlatformOrgIDs = (
        await OrgMembersEntity.findAll({
          where: {
            userID: sourceUserID,
          },
        })
      ).map((o) => o.orgID);

      const alreadyLinkedOrgIDs = (
        await LinkedOrgsEntity.findAll({
          where: { sourceOrgID: allUsersPlatformOrgIDs },
        })
      ).map((o) => o.sourceOrgID);

      const orgIDsToLink = allUsersPlatformOrgIDs.filter(
        (id) => !alreadyLinkedOrgIDs.includes(id),
      );

      const userLinkings = orgIDsToLink.map((platformOrgID) => ({
        sourceUserID,
        sourceOrgID: platformOrgID,
        linkedUserID,
        linkedOrgID,
      }));

      return await LinkedUsersEntity.bulkCreate(userLinkings, {
        ignoreDuplicates: true,
        transaction,
      });
    } else {
      return await LinkedUsersEntity.upsert(
        {
          sourceUserID,
          sourceOrgID,
          linkedUserID,
          linkedOrgID,
        },
        { transaction },
      );
    }
  }

  async unlinkUsers(
    {
      sourceUserID,
      sourceOrgID,
      linkedUserID,
      linkedOrgID,
    }: {
      sourceUserID: UUID;
      sourceOrgID: UUID;
      linkedUserID: UUID;
      linkedOrgID: UUID;
    },
    transaction?: Transaction,
  ) {
    return await LinkedUsersEntity.destroy({
      where: {
        sourceUserID,
        sourceOrgID,
        linkedUserID,
        linkedOrgID,
      },
      transaction,
    });
  }
}
