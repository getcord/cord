import DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { unique } from 'radash';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import type { UserOrgID } from 'server/src/entity/common.ts';
import { keyFor } from 'server/src/entity/common.ts';

export class LinkedUsersLoader {
  viewer: Viewer;
  connectedUserDataloader: DataLoader<UserOrgID, LinkedUsersEntity | null>;
  loadLinkedUserFromSourceOrgScopedDataloader: DataLoader<
    UserOrgID,
    LinkedUsersEntity | null
  >;
  loadPlatformUserFromLinkedDataloader: DataLoader<
    {
      linkedUserID: UUID;
      linkedOrgID: UUID;
      sourceOrgID: UUID;
    },
    LinkedUsersEntity | null
  >;
  loadPlatformUserFromLinkedUserIDDataloader: DataLoader<
    {
      linkedUserID: UUID;
      sourceOrgID: UUID;
    },
    LinkedUsersEntity | null
  >;
  loadLatestLinkedUserFromSourceAllOrgsDataloader: DataLoader<
    UUID,
    LinkedUsersEntity | null
  >;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.connectedUserDataloader = new DataLoader(
      async (userOrgIDs) => {
        const uniqUserOrgIDs = unique(
          userOrgIDs,
          ({ userID, orgID }) => `${userID}/${orgID}`,
        );
        const linkedUsers = await LinkedUsersEntity.findAll({
          where: {
            [Op.or]: uniqUserOrgIDs.map(({ userID, orgID }) => ({
              [Op.or]: [
                { sourceUserID: userID, sourceOrgID: orgID },
                { linkedUserID: userID, linkedOrgID: orgID },
              ],
            })),
          },
        });

        const index = new Map<string, LinkedUsersEntity>();
        for (const linkedUser of linkedUsers) {
          // the set of "source" userID-orgID pairs and "linked" userID-orgID
          // pairs should not overlap since "sourceOrgID" is for platform orgs
          // (e.g. Typeform) and linkedOrgIDs are non-platform orgs (Slack).
          // Hence, there should not be any ambiguity caused by which
          // index.set() is called first.
          index.set(
            keyFor({
              userID: linkedUser.sourceUserID,
              orgID: linkedUser.sourceOrgID,
            }),
            linkedUser,
          );
          index.set(
            keyFor({
              userID: linkedUser.linkedUserID,
              orgID: linkedUser.linkedOrgID,
            }),
            linkedUser,
          );
        }

        return userOrgIDs.map(
          (userOrgID) => index.get(keyFor(userOrgID)) ?? null,
        );
      },
      { cache: false },
    );

    this.loadLinkedUserFromSourceOrgScopedDataloader = new DataLoader(
      async (userOrgIDs) => {
        const uniqUserOrgIDs = unique(
          userOrgIDs,
          ({ userID, orgID }) => `${userID}/${orgID}`,
        );
        const linkedUsers = await LinkedUsersEntity.findAll({
          where: {
            [Op.or]: uniqUserOrgIDs.map(({ userID, orgID }) => ({
              sourceUserID: userID,
              sourceOrgID: orgID,
            })),
          },
        });

        const index = new Map<string, LinkedUsersEntity>();
        for (const linkedUser of linkedUsers) {
          index.set(
            keyFor({
              userID: linkedUser.sourceUserID,
              orgID: linkedUser.sourceOrgID,
            }),
            linkedUser,
          );
        }

        return userOrgIDs.map(
          (userOrgID) => index.get(keyFor(userOrgID)) ?? null,
        );
      },
      { cache: false },
    );
    this.loadPlatformUserFromLinkedDataloader = new DataLoader(
      async (input) => {
        const uniqCombinations = unique(
          input,
          ({ linkedUserID, linkedOrgID, sourceOrgID }) =>
            `${linkedUserID}/${linkedOrgID}/${sourceOrgID}`,
        );
        const linkedUsers = await LinkedUsersEntity.findAll({
          where: {
            [Op.or]: uniqCombinations.map(
              ({ linkedUserID, linkedOrgID, sourceOrgID }) => ({
                linkedUserID,
                linkedOrgID,
                sourceOrgID,
              }),
            ),
          },
        });

        const keyForLinkedUserLinkedOrgSourceOrg = ({
          linkedUserID,
          linkedOrgID,
          sourceOrgID,
        }: {
          linkedUserID: UUID;
          linkedOrgID: UUID;
          sourceOrgID: UUID;
        }) => `${linkedUserID}/${linkedOrgID}/${sourceOrgID}`;

        const index = new Map<string, LinkedUsersEntity>();
        for (const linkedUser of linkedUsers) {
          index.set(
            keyForLinkedUserLinkedOrgSourceOrg({
              linkedUserID: linkedUser.linkedUserID,
              linkedOrgID: linkedUser.linkedOrgID,
              sourceOrgID: linkedUser.sourceOrgID,
            }),
            linkedUser,
          );
        }

        return input.map(
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          (input) =>
            index.get(
              keyForLinkedUserLinkedOrgSourceOrg({
                linkedUserID: input.linkedUserID,
                linkedOrgID: input.linkedOrgID,
                sourceOrgID: input.sourceOrgID,
              }),
            ) ?? null,
        );
      },
      { cache: false },
    );

    this.loadPlatformUserFromLinkedUserIDDataloader = new DataLoader(
      async (input) => {
        const uniqCombinations = unique(
          input,
          ({ linkedUserID, sourceOrgID }) => `${linkedUserID}/${sourceOrgID}`,
        );

        const linkedUsers = await LinkedUsersEntity.findAll({
          where: {
            [Op.or]: uniqCombinations.map(({ linkedUserID, sourceOrgID }) => ({
              linkedUserID,
              sourceOrgID,
            })),
          },
        });

        const keyForLinkedUserSourceOrg = ({
          linkedUserID,
          sourceOrgID,
        }: {
          linkedUserID: UUID;
          sourceOrgID: UUID;
        }) => `${linkedUserID}/${sourceOrgID}`;

        const index = new Map<string, LinkedUsersEntity>();
        for (const linkedUser of linkedUsers) {
          index.set(
            keyForLinkedUserSourceOrg({
              linkedUserID: linkedUser.linkedUserID,
              sourceOrgID: linkedUser.sourceOrgID,
            }),
            linkedUser,
          );
        }

        const toReturn = input.map(
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          (input) =>
            index.get(
              keyForLinkedUserSourceOrg({
                linkedUserID: input.linkedUserID,
                sourceOrgID: input.sourceOrgID,
              }),
            ) ?? null,
        );

        return toReturn;
      },
      { cache: false },
    );

    this.loadLatestLinkedUserFromSourceAllOrgsDataloader = new DataLoader(
      async (sourceUserIDs) => {
        const uniqUserIDs = unique(sourceUserIDs);
        const linkedUsers = await LinkedUsersEntity.findAll({
          where: {
            sourceUserID: uniqUserIDs,
          },
          order: [['linkedTimestamp', 'ASC']],
        });

        // Multiple linkings may be returned for each user but as the results are
        // sorted by ascending timestamp, the final index should have the latest linking
        const index = new Map<string, LinkedUsersEntity>();
        for (const linkedUser of linkedUsers) {
          index.set(linkedUser.sourceUserID, linkedUser);
        }

        return sourceUserIDs.map(
          (sourceUserID) => index.get(sourceUserID) ?? null,
        );
      },
      { cache: false },
    );
  }

  // If we ever need to use this function, then its implementation needs to be
  // fixed. The bug in the current implementation is that a single Slack user
  // can be linked to multiple platform users. This can happen if EITHER within
  // the same platform org multiple users decide to link with the same Slack
  // user OR if multiple platform orgs link with the same Slack org.
  loadConnectedUser_DEPRECATED(userID: UUID, orgID: UUID) {
    return this.connectedUserDataloader.load({ userID, orgID });
  }

  async loadLinkedUserFromSourceOrgScoped(
    sourceUserID: UUID,
    sourceOrgID: UUID,
  ): Promise<LinkedUsersEntity | null> {
    return await this.loadLinkedUserFromSourceOrgScopedDataloader.load({
      userID: sourceUserID,
      orgID: sourceOrgID,
    });
  }

  async loadLatestLinkedUserFromSourceAllOrgs(
    sourceUserID: UUID,
  ): Promise<LinkedUsersEntity | null> {
    return await this.loadLatestLinkedUserFromSourceAllOrgsDataloader.load(
      sourceUserID,
    );
  }

  // find linking of a Slack user to a user in a known platform org
  loadPlatformUserFromLinked({
    linkedUserID,
    linkedOrgID,
    sourceOrgID,
  }: {
    linkedUserID: UUID;
    linkedOrgID: UUID;
    sourceOrgID: UUID;
  }) {
    return this.loadPlatformUserFromLinkedDataloader.load({
      linkedUserID,
      linkedOrgID,
      sourceOrgID,
    });
  }

  // find linking of a Slack user to a user in a known platform org (w/o passing
  // slack org id too)
  loadPlatformUserFromLinkedUserID({
    linkedUserID,
    sourceOrgID,
  }: {
    linkedUserID: UUID;
    sourceOrgID: UUID;
  }) {
    return this.loadPlatformUserFromLinkedUserIDDataloader.load({
      linkedUserID,
      sourceOrgID,
    });
  }

  static async loadConnectedUsers(userID: UUID, orgIDs: UUID[]) {
    const links = await LinkedUsersEntity.findAll({
      where: {
        [Op.or]: [
          { sourceUserID: userID, sourceOrgID: orgIDs },
          { linkedUserID: userID, linkedOrgID: orgIDs },
        ],
      },
    });
    return links.map((link) =>
      link.sourceUserID === userID
        ? { userID: link.linkedUserID, orgID: link.linkedOrgID }
        : { userID: link.sourceUserID, orgID: link.sourceOrgID },
    );
  }
}
