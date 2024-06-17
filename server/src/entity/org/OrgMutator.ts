import type { Viewer } from 'server/src/auth/index.ts';
import { AuthProviderType, SERVICE_USER_ID } from 'server/src/auth/index.ts';
import type { OrgEntityState } from 'server/src/entity/org/OrgEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { JsonObject, UUID } from 'common/types/index.ts';
import { CORD_SLACK_APP_IDS } from 'common/const/Ids.ts';

export class OrgMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async findOrCreateSlackOrg({
    name,
    domain,
    externalID,
    externalAuthData,
    state,
    slackAppID,
  }: {
    name: string;
    domain: string;
    externalID: string;
    externalAuthData: JsonObject | null;
    state: OrgEntityState;
    slackAppID: string;
  }) {
    if (this.viewer.userID !== SERVICE_USER_ID) {
      throw new Error('Only a service user can create orgs.');
    }

    // customSlackAppID column is null for our Cord apps.  This was to avoid
    // doing a bigger migration when we introduced the ability to add external
    // Slack apps
    const customSlackAppID = CORD_SLACK_APP_IDS.includes(slackAppID)
      ? null
      : slackAppID;

    return await OrgEntity.findOrCreate({
      where: {
        externalProvider: AuthProviderType.SLACK,
        externalID,
        // Technically redundant, but allows postgres to use an index.
        platformApplicationID: null,
        customSlackAppID,
      },
      defaults: {
        name,
        domain,
        externalProvider: AuthProviderType.SLACK,
        externalID,
        externalAuthData,
        state,
        customSlackAppID,
      },
    });
  }

  async toggleInternalFlag(orgID: UUID) {
    const org = await OrgEntity.findByPk(orgID);
    if (!org) {
      throw new Error(`org ${orgID} not found`);
    }
    org.internal = !org.internal;
    return await org.save();
  }
}
