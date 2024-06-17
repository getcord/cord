import DataLoader from 'dataloader';
import { QueryTypes } from 'sequelize';
import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { inKeyOrder } from 'server/src/entity/base/util.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';

export class ApplicationLoader {
  viewer: Viewer;
  dataloader: DataLoader<UUID, ApplicationEntity | null>;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.dataloader = new DataLoader(
      async (keys) => {
        const buckets = await ApplicationEntity.findAll({
          where: {
            id: keys as UUID[],
          },
        });

        return inKeyOrder(buckets, keys);
      },
      { cache: false },
    );
  }

  async load(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('Application dataloader error', e);
      return null;
    }
  }

  async loadAll() {
    return await ApplicationEntity.findAll();
  }

  async loadApplicationsForConsoleUser(
    customerID: UUID,
  ): Promise<ApplicationEntity[]> {
    return await ApplicationEntity.findAll({
      where: { customerID },
      order: [['name', 'ASC']],
    });
  }

  async countActiveUsersForApplications(
    applicationIDs: UUID[],
  ): Promise<Map<UUID, number>> {
    if (!applicationIDs.length) {
      return new Map();
    }

    const results = await getSequelize().query<any>(
      `SELECT applications.id AS id, COUNT(users) AS users_count
        FROM cord.applications
        LEFT JOIN cord.users on users."platformApplicationID" = applications.id
        WHERE applications.id IN (:application_ids)
        AND users.state = 'active'
        GROUP BY applications.id;`,
      {
        replacements: { application_ids: applicationIDs },
        type: QueryTypes.SELECT,
      },
    );

    const retval = new Map<UUID, number>();
    results.forEach((r) => retval.set(r.id, r.users_count));
    return retval;
  }

  async countOrgsForApplications(
    applicationIDs: UUID[],
  ): Promise<Map<UUID, number>> {
    if (!applicationIDs.length) {
      return new Map();
    }

    const results = await getSequelize().query<any>(
      `SELECT applications.id AS id, COUNT(orgs) AS orgs_count
      FROM cord.applications
      LEFT JOIN cord.orgs on orgs."platformApplicationID" = applications.id
      WHERE applications.id IN (:application_ids)
      GROUP BY applications.id;`,
      {
        replacements: { application_ids: applicationIDs },
        type: QueryTypes.SELECT,
      },
    );

    const retval = new Map<UUID, number>();
    results.forEach((r) => retval.set(r.id, r.orgs_count));
    return retval;
  }

  async getFirstOrgInApplication(
    applicationID: UUID,
  ): Promise<OrgEntity | undefined> {
    const orgs = await OrgEntity.findAll({
      where: {
        platformApplicationID: applicationID,
      },
      order: [['createdTimestamp', 'ASC']],
      limit: 1,
    });

    return orgs[0];
  }

  async getFirstUserInApplication(
    applicationID: UUID,
  ): Promise<UserEntity | undefined> {
    const users = await UserEntity.findAll({
      where: {
        platformApplicationID: applicationID,
      },
      order: [['createdTimestamp', 'ASC']],
      limit: 1,
    });

    return users[0];
  }

  async isComponentInitializedForApplication(
    applicationID: UUID,
  ): Promise<boolean> {
    const [{ exists: initializedEventExists }] = await getSequelize().query<{
      exists: boolean;
    }>(
      `SELECT EXISTS (
        SELECT 1 FROM events e
        WHERE e.type = 'sdk-components-used'
        AND e."platformApplicationID" = $1
      )`,
      {
        bind: [applicationID],
        type: QueryTypes.SELECT,
      },
    );

    return initializedEventExists;
  }
}
