import type { Transaction } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasPlatformIdentity,
  AuthProviderType,
} from 'server/src/auth/index.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
export class LinkedOrgsMutator {
  logger: Logger;

  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders | null,
  ) {
    this.logger = new Logger(viewer);
  }
  async linkOrgs(linkedOrgID: UUID, transaction?: Transaction) {
    // assumption that the viewer org is the source org
    const { userID: mergerUserID, orgID: sourceOrgID } =
      assertViewerHasPlatformIdentity(this.viewer);

    const application = await ApplicationEntity.findByPk(
      this.viewer.platformApplicationID,
      { transaction },
    );

    if (!application) {
      throw new Error('No app id found for viewer');
    }

    if (application.slackConnectAllOrgs) {
      // This flag is typically used by customers who use org membership as a hack
      // to implement permissions - for them it is more appropriate for ALL of a
      // user's orgs to be connected to the one Slack, because really all these
      // orgs are one team of people
      // If another of the user's orgs (not the viewer org) is already linked to
      // a Slack workspace, it will remain linked to that same workspace (it won't
      // be overridden).
      const allUsersPlatformOrgIDs = (
        await OrgMembersEntity.findAll({
          where: {
            userID: this.viewer.userID,
          },
          transaction,
        })
      ).map((o) => o.orgID);

      const alreadyLinkedOrgIDs = (
        await LinkedOrgsEntity.findAll({
          where: { sourceOrgID: allUsersPlatformOrgIDs },
          transaction,
        })
      ).map((o) => o.sourceOrgID);

      if (alreadyLinkedOrgIDs.length > 1) {
        this.logger.warn(
          'Linking all of platform users orgs, but some are already linked',
          {
            alreadyLinkedOrgIDs,
            allUsersPlatformOrgIDs,
          },
        );
      }

      const orgIDsToLink = allUsersPlatformOrgIDs.filter(
        (id) => !alreadyLinkedOrgIDs.includes(id),
      );

      const linkings = orgIDsToLink.map((orgID) => ({
        sourceOrgID: orgID,
        sourceExternalProvider: AuthProviderType.PLATFORM,
        linkedOrgID,
        linkedExternalProvider: AuthProviderType.SLACK,
        mergerUserID,
      }));

      const result = await LinkedOrgsEntity.bulkCreate(linkings, {
        ignoreDuplicates: true,
        transaction,
      });
      this.loaders?.linkedOrgsLoader.clearAll();
      return result;
    } else {
      // This is the traditional approach, where a user is only linking their
      // current viewer org to the Slack org, not all of their orgs.
      const result = await LinkedOrgsEntity.bulkCreate(
        [
          {
            sourceOrgID,
            sourceExternalProvider: AuthProviderType.PLATFORM,
            linkedOrgID,
            linkedExternalProvider: AuthProviderType.SLACK,
            mergerUserID,
          },
        ],
        {
          ignoreDuplicates: true,
          transaction,
        },
      );
      this.loaders?.linkedOrgsLoader.clearAll();
      return result;
    }
  }

  async unlinkOrgs() {
    // assumption that the viewer org is the source org
    const { orgID: sourceOrgID } = assertViewerHasPlatformIdentity(this.viewer);

    const application = await ApplicationEntity.findByPk(
      this.viewer.platformApplicationID,
    );

    if (!application) {
      throw new Error('No app id found for viewer');
    }

    // In both cases, all reference linked_user rows will also automatically be
    // deleted
    if (application.slackConnectAllOrgs) {
      const allUsersPlatformOrgIDs = (
        await OrgMembersEntity.findAll({
          where: {
            userID: this.viewer.userID,
          },
        })
      ).map((o) => o.orgID);

      const result = await LinkedOrgsEntity.destroy({
        where: { sourceOrgID: allUsersPlatformOrgIDs },
      });
      this.loaders?.linkedOrgsLoader.clearAll();
      return result;
    } else {
      const result = await LinkedOrgsEntity.destroy({ where: { sourceOrgID } });
      this.loaders?.linkedOrgsLoader.clearAll();
      return result;
    }
  }
}
