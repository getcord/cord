import DataLoader from 'dataloader';
import { unique } from 'radash';
import { QueryTypes } from 'sequelize';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasOrg,
  assertViewerHasUser,
  AuthProviderType,
} from 'server/src/auth/index.ts';
import type {
  Location,
  UUID,
  SortDirection,
  Maybe,
} from 'common/types/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { inKeyOrder } from 'server/src/entity/base/util.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import {
  detailsForDisplay,
  loadLinkedSlackUserOrgScoped,
} from 'server/src/entity/user/util.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { PlatformID } from 'server/src/entity/common.ts';
import {
  keyForPlatformID,
  MAX_IDS_PER_QUERY,
} from 'server/src/entity/common.ts';
import { LinkedOrgsLoader } from 'server/src/entity/linked_orgs/LinkedOrgsLoader.ts';
import type { RequestContextLoadersInternal } from 'server/src/RequestContextLoaders.ts';
import type { OrgMembersResult } from 'server/src/schema/resolverTypes.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { isDefined } from 'common/util/index.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';
import { getPageContextHash } from 'server/src/util/hash.ts';

export class UserLoader {
  dataloader: DataLoader<UUID, UserEntity | null>;
  orgCheckedDataloader: DataLoader<UUID, UserEntity | null>;
  loadUsersByEmailDataloader: DataLoader<
    {
      email: string;
      orgID: UUID;
    },
    UserEntity[]
  >;
  platformProfileDataloader: DataLoader<PlatformID, UserEntity | null, string>;

  constructor(
    private viewer: Viewer,
    private loaders: () => RequestContextLoadersInternal | null,
    cache = false,
  ) {
    this.dataloader = new DataLoader(
      async (keys) => {
        const users = await UserEntity.findAll({
          where: {
            id: unique(keys),
          },
        });

        return inKeyOrder(users, keys);
      },
      { cache },
    );

    this.orgCheckedDataloader = new DataLoader(
      async (userIDs) => {
        // dataloader does not de-duplicate keys (probably because we set "cache: false")
        const uniqUserIDs = unique(userIDs);
        const orgIDs = await (
          this.loaders()?.linkedOrgsLoader ?? new LinkedOrgsLoader(this.viewer)
        ).getOrgIDs();

        const users = await getSequelize().query<UserEntity>(
          `SELECT users.* FROM users, org_members
             WHERE users.id = ANY($1)
             AND users.id = org_members."userID"
             AND org_members."orgID" = ANY($2);`,
          {
            bind: [uniqUserIDs, orgIDs],
            type: QueryTypes.SELECT,
            model: UserEntity,
          },
        );

        return inKeyOrder(users, userIDs);
      },
      { cache },
    );

    this.loadUsersByEmailDataloader = new DataLoader(
      async (emailOrgs) => {
        const emails = unique(emailOrgs.map(({ email }) => email));
        const orgIDs = unique(emailOrgs.map(({ orgID }) => orgID));

        const users = await getSequelize().query<UserEntity>(
          `
          SELECT users.*, org_members."orgID" FROM org_members, users
          WHERE users."email" = ANY($1)
          AND users.id = org_members."userID"
          AND org_members."orgID" = ANY($2)
          AND users."state" !=  'deleted'
          `,
          {
            bind: [emails, orgIDs],
            type: QueryTypes.SELECT,
            model: UserEntity,
          },
        );

        const makeKey = (email: string, orgID: UUID) => `${email}/${orgID}`;

        const index = new Map<string, UserEntity[]>();
        for (const user of users) {
          const key = makeKey(
            user.email!,
            (user.get({ plain: true }) as any).orgID, // orgID is not a column on UserEntity but is returned by this query, so it needs to be converted to a basic object to retrieve orgID
          );
          if (index.has(key)) {
            index.get(key)!.push(user);
          } else {
            index.set(key, [user]);
          }
        }

        return emailOrgs.map(
          ({ email, orgID }) => index.get(makeKey(email, orgID)) ?? [],
        );
      },
      { cache },
    );

    this.platformProfileDataloader = new DataLoader(
      async (keys) => {
        // By far the most common calling pattern is loading a bunch of users
        // all from the same application, in which case we can turn this into a
        // set of efficient queries (ideally one) that do an equality check on
        // platformApplicationID and an IN filter on externalID.
        const usersByApplication = new Map<UUID, Set<string>>();
        for (const key of keys) {
          if (!usersByApplication.has(key.platformApplicationID)) {
            usersByApplication.set(key.platformApplicationID, new Set());
          }
          usersByApplication
            .get(key.platformApplicationID)!
            .add(key.externalID);
        }
        const promises = [];
        for (const [platformApplicationID, userIDSet] of usersByApplication) {
          const externalUserIDs = [...userIDSet];

          for (
            let offset = 0;
            offset < externalUserIDs.length;
            offset += MAX_IDS_PER_QUERY
          ) {
            promises.push(
              getSequelize().query<UserEntity>(
                `
          SELECT users.* FROM users
            WHERE users."platformApplicationID" = $1
            AND users."externalID" = ANY($2)
            AND users.state != 'deleted'
          `,
                {
                  bind: [
                    platformApplicationID,
                    externalUserIDs.slice(offset, offset + MAX_IDS_PER_QUERY),
                  ],
                  type: QueryTypes.SELECT,
                  model: UserEntity,
                },
              ),
            );
          }
        }
        const users = (await Promise.all(promises)).flat();
        const index = new Map<string, UserEntity>();
        for (const user of users) {
          index.set(
            keyForPlatformID({
              platformApplicationID: user.platformApplicationID!,
              externalID: user.externalID,
            }),
            user,
          );
        }
        return keys.map(
          (platformId) => index.get(keyForPlatformID(platformId)) ?? null,
        );
      },
      { cache },
    );
  }

  async loadUser(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('Failed to loadUser', e);
      return null;
    }
  }

  async loadUsers(ids: UUID[]) {
    const users = await Promise.all(ids.map((uid) => this.loadUser(uid)));
    return users.filter(isDefined);
  }

  async loadUserInAnyViewerOrg(id: UUID) {
    try {
      if (id === this.viewer.userID) {
        // Don't do an org check when loading yourself, since if you aren't in
        // any orgs at all, you won't share any orgs with yourself, and so can't
        // see yourself, which is silly.
        return await this.loadUser(id);
      }
      return await this.orgCheckedDataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('Failed to loadUserInAnyViewerOrg', e);
      return null;
    }
  }

  async loadUsersInViewerOrgs(userIDs: UUID[]) {
    const orgIDs = await (
      this.loaders()?.orgMembersLoader ?? new OrgMembersLoader(this.viewer)
    ).loadAllOrgIDsForUser();

    return await getSequelize().query<UserEntity>(
      `SELECT users.* FROM users, org_members
         WHERE users.id = ANY($1)
         AND users.id = org_members."userID"
         AND org_members."orgID" = ANY($2);`,
      {
        bind: [userIDs, orgIDs],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
  }

  async loadUsersInApplication(appID: UUID, limit: number) {
    return await UserEntity.findAll({
      where: { platformApplicationID: appID },
      order: [['createdTimestamp', 'DESC']],
      limit,
    });
  }

  async loadUsersInOrg(userIDs: UUID[], orgID: UUID) {
    return await getSequelize().query<UserEntity>(
      `
      SELECT users.* FROM users, org_members
      WHERE users.id = ANY($1)
      AND users.id = org_members."userID"
      AND org_members."orgID" = $2;
    `,
      {
        bind: [userIDs, orgID],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
  }

  async loadUserInOrg(userID: UUID, orgID: UUID) {
    const results = await this.loadUsersInOrg([userID], orgID);
    return results.length > 0 ? results[0] : null;
  }

  async loadUsersNoOrgCheck(userIDs: UUID[]): Promise<UserEntity[]> {
    const results = await this.dataloader.loadMany(userIDs);
    return results.filter(
      (x): x is UserEntity => isDefined(x) && !(x instanceof Error),
    );
  }

  async loadAllUsersInOrgPaginatedByUserID(
    orgID: UUID,
    after?: UUID,
    limit?: number,
  ): Promise<OrgMembersResult> {
    const bindVariables = [orgID];

    let afterCondition = '';
    if (after) {
      bindVariables.push(after);
      afterCondition = `AND org_members."userID" > $${bindVariables.length}`;
    }

    let limitCondition = '';
    if (limit) {
      bindVariables.push(limit.toString());
      limitCondition = `LIMIT $${bindVariables.length}`;
    }

    const users = await getSequelize().query<UserEntity>(
      `SELECT users.* FROM users, org_members
      WHERE users.id = org_members."userID"
      AND org_members."orgID" = $1
      AND users.state != 'deleted'
      ${afterCondition}
      ORDER BY org_members."userID" ASC
      ${limitCondition}
    `,
      {
        bind: bindVariables,
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );

    return {
      users,
      hasMore: isDefined(limit) ? users.length === limit : false,
      token: users.at(-1)?.id,
    };
  }

  /**
   * We have a valid match if any permutation of the query matches every
   * part of a user's name. E.g.
   * User: "James Bond" -> "James" = Match.
   * User: "James Bond" -> "James B" = Match.
   * User: "James Bond" -> "Bond Jam" = Match.
   * "James Bond" -> "James Wond" = Not a match.
   * "James Bond" -> "ames" = Not a match.
   *
   * Perhaps sub-optimally,
   * "James Bond" -> "James James" = is a match.
   * which it didn't use to be with our old front end
   * approach, but I don't think is particularly bad.
   */
  async loadNameFilteredUsersInOrg(
    orgID: UUID,
    nameQuery: string | null,
    platformApplicationID: UUID | null,
    limit: number,
    location: Maybe<Location> = undefined,
    sortDirection: Maybe<SortDirection> = 'descending',
  ): Promise<UserEntity[]> {
    const userID = assertViewerHasUser(this.viewer);
    const bindVariables = [orgID, userID, limit.toString()];
    let appIDCondition = '';
    let joinedConditionsArray: string[] = [];

    if (platformApplicationID) {
      bindVariables.push(platformApplicationID);
      appIDCondition = `AND users."platformApplicationID" = $${bindVariables.length}`;
    } else {
      appIDCondition = 'AND users."platformApplicationID" IS NULL';
    }

    if (nameQuery) {
      // We will search for matches in the name OR screenName fields
      const nameFieldNames = ['name', 'screenName'];

      const nameMatchConditions: string[][] = Array.from(
        { length: nameFieldNames.length },
        () => [],
      );

      // We want to allow for searches which specify a name in a different order from
      // the database value, e.g. 'Bond James' should still match 'James Bond'
      for (const token of nameQuery.split(' ')) {
        bindVariables.push(token.toLowerCase());
        nameFieldNames.forEach((field, index) =>
          // There is an index on LOWER(user.name) and LOWER(user.screenName), which
          // is faster than using ILIKE.
          // We want to accept words which match our query words from the START only
          // e.g. 'da' should match 'dave' but not 'adam'
          // This means the search word could either be the very start of the db field,
          // so 'searchWord%', or it could be the start of a subsequent word, which we
          // find by '% searchWord%'
          nameMatchConditions[index].push(
            `(LOWER(users."${field}") LIKE $${bindVariables.length} || '%' OR LOWER(users."${field}") LIKE '% ' || $${bindVariables.length} || '%')`,
          ),
        );
      }

      // Whether it's the name or screenName field, each of the queried words must
      // yield a match, so we combine with AND.  I.e. if you search 'James Bond' you
      // must find a name which matches both 'James' AND 'Bond' - not e.g. 'James Dean'
      joinedConditionsArray = nameMatchConditions.map((fieldConditions) =>
        fieldConditions.join(' AND '),
      );
    }

    let leftJoin = '';
    let orderBy = '';

    if (location) {
      const [pageContextHash] = getPageContextHash({
        providerID: null,
        data: location,
      });
      bindVariables.push(pageContextHash);
      leftJoin = `
        LEFT JOIN page_visitors 
          ON org_members."orgID" = page_visitors."orgID" 
          AND org_members."userID" = page_visitors."userID" 
          AND page_visitors."pageContextHash" = $${bindVariables.length}`;

      // 0 goes to the top of the list, and 1 is at the bottom
      const sortOrderCase =
        sortDirection === 'descending' ? 'THEN 1 ELSE 0' : 'THEN 0 ELSE 1';
      // If the viewer has been on the page, put them last so they are between
      // those that have visited, and those that haven't.
      orderBy = `
        ORDER BY
          CASE WHEN page_visitors."lastPresentTimestamp" IS NULL ${sortOrderCase} END,
          CASE WHEN users.id = $2 THEN 1 ELSE 0 END,
          page_visitors."lastPresentTimestamp" ${
            sortDirection === 'descending' ? 'DESC' : 'ASC'
          }`;
    } else {
      // Always put the viewer last
      orderBy = `
      ORDER BY 
        CASE WHEN users.id = $2 THEN 1 ELSE 0 END`;
    }

    const joinedConditions =
      joinedConditionsArray.length > 0
        ? `AND (
      ${joinedConditionsArray.join(' OR ')}
    )`
        : '';

    return await getSequelize().query<UserEntity>(
      `
    SELECT users.* FROM users, org_members
    ${leftJoin}
      WHERE users.id = org_members."userID"
      ${appIDCondition}
      AND org_members."orgID" = $1
      AND users.state != 'deleted'
      ${joinedConditions}
      ${orderBy}
      LIMIT $3;
    `,
      {
        bind: bindVariables,
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
  }

  async loadUsersByExternalIDsInOrg(
    externalIDs: string[],
    orgIDs: UUID[],
  ): Promise<UserEntity[]> {
    const results = await getSequelize().query<UserEntity>(
      `
      SELECT DISTINCT ON (users.id) users.* FROM users, org_members
      WHERE users."externalID" = ANY($1)
      AND users.id = org_members."userID"
      AND org_members."orgID" = ANY($2);
    `,
      {
        bind: [externalIDs, orgIDs],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
    return results;
  }

  async loadUserForEmailInOrg(email: string, orgID: UUID) {
    return await this.loadUsersByEmailDataloader.load({ email, orgID });
  }

  async loadUserForSlackUserWithinViewerOrg(slackUserID: string) {
    const orgID = assertViewerHasOrg(this.viewer);
    const results = await getSequelize().query<UserEntity>(
      `
        SELECT users.* FROM users, org_members
        WHERE users.id = org_members."userID"
        AND org_members."orgID" = $1
        AND users."externalProvider" = $2
        AND users."externalID" = $3
        LIMIT 1;
    `,
      {
        bind: [orgID, AuthProviderType.SLACK, slackUserID],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
    // raw queries will return an array even if we only ask for one row
    return results.length > 0 ? results[0] : null;
  }

  async loadSlackUserForUserOrgScoped(context: RequestContext, userID: UUID) {
    const user = await UserEntity.findByPk(userID);
    const orgID = assertViewerHasOrg(this.viewer);
    if (!user) {
      return undefined;
    }
    return await loadLinkedSlackUserOrgScoped(user, context, orgID);
  }

  // This function does not work if the application uses sock puppets,
  // use loadUndeletedSockPuppets instead.
  async loadUserByExternalID(platformApplicationID: UUID, externalID: string) {
    return await this.platformProfileDataloader.load({
      platformApplicationID,
      externalID,
    });
  }

  async loadUndeletedUser(externalUserID: string, platformApplicationID: UUID) {
    const users = await getSequelize().query<UserEntity>(
      `SELECT * FROM users
         WHERE "externalID" = $1
         AND "platformApplicationID" = $2
         AND state != 'deleted';`,
      {
        bind: [externalUserID, platformApplicationID],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );

    return users.length > 0 ? users[0] : null;
  }

  async loadReferencedUserData(context: RequestContext, userIDs: UUID[]) {
    const users = await this.dataloader.loadMany(userIDs);
    return await Promise.all(
      users
        .filter((p): p is UserEntity => p instanceof UserEntity)
        .map(async (u) => {
          // Will pick the most recent name and profile pic where there is a choice
          // between platform uploaded, Slack linked and user uploaded
          const displayProfile = await detailsForDisplay(u, context);

          return {
            id: u.id,
            name: displayProfile.displayName,
          };
        }),
    );
  }

  clearAll() {
    this.dataloader.clearAll();
    this.orgCheckedDataloader.clearAll();
    this.loadUsersByEmailDataloader.clearAll();
    this.platformProfileDataloader.clearAll();
  }
}
