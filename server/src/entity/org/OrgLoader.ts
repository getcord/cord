import { Op } from 'sequelize';

import DataLoader from 'dataloader';
import type { Viewer } from 'server/src/auth/index.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UUID } from 'common/types/index.ts';
import type { PlatformID } from 'server/src/entity/common.ts';
import {
  MAX_IDS_PER_QUERY,
  keyForPlatformID,
} from 'server/src/entity/common.ts';
import { inKeyOrderOrNull } from 'server/src/entity/base/util.ts';
import { CORD_SLACK_APP_IDS } from 'common/const/Ids.ts';

export class OrgLoader {
  viewer: Viewer;
  platformOrgDataloader: DataLoader<PlatformID, OrgEntity | null, string>;
  orgByIdDataloader: DataLoader<UUID, OrgEntity | null>;

  constructor(viewer: Viewer, cache = false) {
    this.viewer = viewer;
    this.platformOrgDataloader = new DataLoader(
      async (keys) => {
        // By far the most common calling pattern is loading a bunch of orgs all
        // from the same application, in which case we can turn this into a set of
        // efficient queries (ideally one) that do an equality check on
        // platformApplicationID and an IN filter on externalID.
        const orgsByApplication = new Map<UUID, Set<string>>();
        for (const key of keys) {
          if (!orgsByApplication.has(key.platformApplicationID)) {
            orgsByApplication.set(key.platformApplicationID, new Set());
          }
          orgsByApplication.get(key.platformApplicationID)!.add(key.externalID);
        }
        const promises = [];
        for (const [platformApplicationID, orgIDSet] of orgsByApplication) {
          const externalOrgIDs = [...orgIDSet];

          for (
            let offset = 0;
            offset < externalOrgIDs.length;
            offset += MAX_IDS_PER_QUERY
          ) {
            promises.push(
              OrgEntity.findAll({
                where: {
                  externalProvider: AuthProviderType.PLATFORM,
                  platformApplicationID,
                  externalID: externalOrgIDs.slice(
                    offset,
                    offset + MAX_IDS_PER_QUERY,
                  ),
                },
              }),
            );
          }
        }
        const orgs = (await Promise.all(promises)).flat();
        const index = new Map<string, OrgEntity>();
        for (const org of orgs) {
          index.set(
            keyForPlatformID({
              platformApplicationID: org.platformApplicationID!,
              externalID: org.externalID,
            }),
            org,
          );
        }
        return keys.map(
          (platformId) => index.get(keyForPlatformID(platformId)) ?? null,
        );
      },
      { cache },
    );
    this.orgByIdDataloader = new DataLoader(
      async (keys) => {
        const orgs = await OrgEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });
        return inKeyOrderOrNull(orgs, keys);
      },
      { cache },
    );
  }

  async loadOrg(id: UUID) {
    return await this.orgByIdDataloader.load(id);
  }

  async loadSlackOrg(slackTeamID: string, slackAppID: string) {
    // customSlackAppID column is null for our Cord apps.  This was to avoid
    // doing a bigger migration when we introduced the ability to add external
    // Slack apps
    const customSlackAppID = CORD_SLACK_APP_IDS.includes(slackAppID)
      ? null
      : slackAppID;

    return await OrgEntity.findOne({
      where: {
        externalProvider: AuthProviderType.SLACK,
        externalID: slackTeamID,
        customSlackAppID,
        // Technically redundant, but allows postgres to use an index.
        platformApplicationID: null,
      },
    });
  }

  async loadPlatformOrg(platformApplicationID: string, externalOrgID: string) {
    return await this.platformOrgDataloader.load({
      platformApplicationID,
      externalID: externalOrgID,
    });
  }

  async loadByDomain(externalProvider: string, domain: string) {
    return await OrgEntity.findOne({
      where: { externalProvider, domain },
    });
  }

  async loadAllActiveSlackOrgs() {
    return await OrgEntity.findAll({
      where: {
        state: 'active',
        externalProvider: AuthProviderType.SLACK,
        externalAuthData: { [Op.ne]: null },
      },
    });
  }
}
