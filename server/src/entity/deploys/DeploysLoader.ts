import { Op } from 'sequelize';
import type { Viewer } from 'server/src/auth/index.ts';
import { DeploysEntity } from 'server/src/entity/deploys/DeploysEntity.ts';
import type { Tier } from 'common/types/index.ts';

// We cache these because we only care if the user's version is more than 60
// days old, so once we've loaded a valid finish time for a particular version,
// we don't need to ever check if it's changed, because it's basically
// irrelevant.  (This cache resets on restart, which will be at least once a
// day generally.)
const mostRecentDeployCache = new Map<string, Date>();

export class DeploysLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadMostRecentSuccessfulDeploymentCached(
    version: string,
    tier: Tier,
  ): Promise<Date | null> {
    try {
      const key = `${tier}/${version}`;
      if (mostRecentDeployCache.has(key)) {
        return mostRecentDeployCache.get(key)!;
      }
      const deploy = await DeploysEntity.findOne({
        where: {
          packageVersion: version,
          tier,
          success: true,
          deployFinishTime: {
            [Op.ne]: null,
          },
        },
        order: [['deployFinishTime', 'DESC']],
      });
      if (deploy?.deployFinishTime) {
        mostRecentDeployCache.set(key, deploy.deployFinishTime);
      }
      return deploy?.deployFinishTime ?? null;
    } catch (e) {
      return null;
    }
  }
}
