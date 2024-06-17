import { Op } from 'sequelize';
import DataLoader from 'dataloader';
import { unique } from 'radash';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrgs } from 'server/src/auth/index.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';

export class LinkedOrgsLoader {
  viewer: Viewer;
  linkedSlackOrgIDDataloader: DataLoader<UUID, UUID | null>;
  allConnectedOrgIDsPromise: Promise<UUID[]> | null = null;

  constructor(viewer: Viewer, cache = false) {
    this.viewer = viewer;
    this.linkedSlackOrgIDDataloader = new DataLoader(
      async (sourceOrgIDs) => {
        const uniqOrgIDs = unique(sourceOrgIDs);
        const linkedOrgs = await LinkedOrgsEntity.findAll({
          where: {
            sourceOrgID: uniqOrgIDs,
          },
        });

        const index = new Map(
          linkedOrgs.map((linkedOrg) => [linkedOrg.sourceOrgID, linkedOrg]),
        );

        return sourceOrgIDs.map(
          (sourceOrgID) => index.get(sourceOrgID)?.linkedOrgID || null,
        );
      },
      { cache },
    );
  }

  async getConnectedSlackOrgID(orgID: UUID) {
    return await this.linkedSlackOrgIDDataloader.load(orgID);
  }

  private async getAllConnectedOrgIDsImpl(): Promise<UUID[]> {
    const orgIDs = assertViewerHasOrgs(this.viewer);
    const orgLinks = await LinkedOrgsEntity.findAll({
      where: {
        [Op.or]: [{ sourceOrgID: orgIDs }, { linkedOrgID: orgIDs }],
      },
    });

    const orgIDsSet = new Set(orgIDs);
    return orgLinks.map((orgLink) =>
      orgIDsSet.has(orgLink.sourceOrgID)
        ? orgLink.linkedOrgID
        : orgLink.sourceOrgID,
    );
  }

  async getAllConnectedOrgIDs(): Promise<UUID[]> {
    if (this.allConnectedOrgIDsPromise === null) {
      this.allConnectedOrgIDsPromise = this.getAllConnectedOrgIDsImpl();
    }

    return await this.allConnectedOrgIDsPromise;
  }

  async getOrgIDs(): Promise<UUID[]> {
    const orgIDs = assertViewerHasOrgs(this.viewer);
    const connectedOrgIDs = await this.getAllConnectedOrgIDs();
    return [...orgIDs, ...connectedOrgIDs];
  }

  // Input is an orgID (for the fn to make sense it should be a Slack org id),
  // output is an array containing that orgID plus any platform orgs it is linked to
  async getAllConnectedPlatformOrgs(orgID: UUID) {
    const linkedPlatformOrgIDs = (
      await LinkedOrgsEntity.findAll({
        where: {
          linkedOrgID: orgID,
        },
      })
    ).map((o) => o.sourceOrgID);

    return [orgID, ...linkedPlatformOrgIDs];
  }

  clearAll() {
    this.linkedSlackOrgIDDataloader.clearAll();
    this.allConnectedOrgIDsPromise = null;
  }
}
