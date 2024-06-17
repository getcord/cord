import type { CreationAttributes, Transaction } from 'sequelize';
import { Op, Sequelize } from 'sequelize';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { AuthProviderType, SERVICE_USER_ID } from 'server/src/auth/index.ts';
import type { EntityMetadata, UUID } from 'common/types/index.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import type { UserEntityState } from 'server/src/entity/user/UserEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { isDefined } from 'common/util/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';

type UserData = {
  name: string | null;
  screenName: string | null;
  email: string | null;
  profilePictureURL: string | null;
  externalID: string;
  externalProvider: AuthProviderType | null;
  metadata?: EntityMetadata;
  platformApplicationID?: string;
  state?: string;
};

const nowOrNull = (before: any, after: any) => {
  if (!isDefined(before) && !isDefined(after)) {
    return null;
  } else if (before === after) {
    return null;
  } else {
    return Sequelize.fn('NOW') as any as Date;
  }
};

export class UserMutator {
  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders | null,
  ) {}

  async findOrCreateExternalUser(
    userData: UserData,
    transaction?: Transaction,
  ) {
    if (this.viewer.userID !== SERVICE_USER_ID) {
      throw new Error('Only a service user can create users.');
    }

    if (
      userData.externalProvider === AuthProviderType.PLATFORM &&
      !userData.platformApplicationID
    ) {
      throw new Error(
        'platformApplicationID must be defined to create a platform user',
      );
    }

    const { externalProvider, externalID, platformApplicationID } = userData;

    const result = await UserEntity.findOrCreate({
      where: {
        externalProvider,
        externalID,
        ...(platformApplicationID && { platformApplicationID }),
      },
      defaults: {
        ...userData,
        userType: 'person',
        nameUpdatedTimestamp: nowOrNull(undefined, userData.name),
        profilePictureURLUpdatedTimestamp: nowOrNull(
          undefined,
          userData.profilePictureURL,
        ),
      } as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
      transaction,
    });
    this.loaders?.userLoader.clearAll();
    return result;
  }

  async updateOrCreateExternalUserInSlackOrg(
    userData: UserData,
    orgID: UUID,
    userDeletedInSlack: boolean,
    transaction: Transaction,
  ): Promise<[UserEntity | null, boolean]> {
    // We could use UserEntity.upsert here, except that it does not tell
    // us whether it ended up doing an insert or an update, and we have
    // to return that piece of information. So we have to do this in
    // stages instead: first findOrCreate (which does INSERT and if it fails
    // SELECT). If no new row was created, we check if the data of the
    // existing one needs updating.

    const [user, isNewUser] = await this.findOrCreateExternalUser(
      userData,
      transaction,
    );

    // if the user is set to deleted, they would not be able to log in
    if (user.state === 'deleted') {
      return [null, false];
    }

    if (userDeletedInSlack) {
      await OrgMembersEntity.destroy({
        where: { orgID, userID: user.id },
        transaction,
      });
    } else {
      await OrgMembersEntity.findOrCreate({
        where: { orgID, userID: user.id },
        defaults: {} as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
        transaction,
      });
    }

    if (isNewUser) {
      return [user, true];
    } else {
      const { externalProvider, externalID, ...updateFields } = userData;

      // Don't update any undefined fields
      const filteredUpdateFields = Object.fromEntries(
        Object.entries(updateFields).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      const userChanged = Object.entries(filteredUpdateFields).some(
        ([key, value]) => !isEqual(user[key as keyof UserData], value),
      );

      if (!userChanged) {
        return [user, false];
      }

      // Update the timestamps if name or profilePictureURL have changed
      const nameUpdatedTimestamp = nowOrNull(
        user.name,
        filteredUpdateFields.name,
      );
      const profilePictureURLUpdatedTimestamp = nowOrNull(
        user.profilePictureURL,
        filteredUpdateFields.profilePictureURL,
      );

      const [_numberOfRows, users] = await UserEntity.update(
        {
          ...filteredUpdateFields,
          ...(nameUpdatedTimestamp && { nameUpdatedTimestamp }),
          ...(profilePictureURLUpdatedTimestamp && {
            profilePictureURLUpdatedTimestamp,
          }),
        },
        {
          where: { externalProvider, externalID },
          returning: true,
          transaction,
        },
      );
      this.loaders?.userLoader.clearAll();

      if (users.length > 0) {
        return [users[0], true];
      } else {
        throw new Error('User got deleted between SELECT and UPDATE');
      }
    }
  }

  async updateProfilePictureURL(url: string) {
    const fields = { profilePictureURL: url };
    await UserEntity.update(fields, { where: { id: this.viewer.userID } });
    this.loaders?.userLoader.clearAll();
  }

  async updateUser(
    user: UserEntity,
    data: {
      name: string | undefined | null;
      email: string | undefined;
      screenName: string | undefined | null;
      profilePictureURL: string | null | undefined;
      state: UserEntityState | undefined;
      metadata?: EntityMetadata;
    },
    transaction: Transaction,
  ) {
    const { name, email, screenName, profilePictureURL, state, metadata } =
      data;

    if (
      (name !== undefined && user.name !== name) ||
      (email !== undefined && user.email !== email) ||
      (screenName !== undefined && user.screenName !== screenName) ||
      (profilePictureURL !== undefined &&
        user.profilePictureURL !== profilePictureURL) ||
      (state !== undefined && user.state !== state) ||
      (metadata !== undefined && !isEqual(user.metadata, metadata))
    ) {
      const nameUpdatedTimestamp = nowOrNull(user.name, name);
      const profilePictureURLUpdatedTimestamp = nowOrNull(
        user.profilePictureURL,
        profilePictureURL,
      );

      await user.update(
        {
          ...data,
          ...(nameUpdatedTimestamp && { nameUpdatedTimestamp }),
          ...(profilePictureURLUpdatedTimestamp && {
            profilePictureURLUpdatedTimestamp,
          }),
        },
        { transaction },
      );
      this.loaders?.userLoader.clearAll();
      return true;
    }
    return false;
  }

  async findOrCreateAndUpdateApplicationSupportBot(
    application: ApplicationEntity,
    name: string,
    profilePictureURL: string,
    transaction: Transaction,
  ) {
    const bot = application.supportBotID
      ? await UserEntity.findByPk(application.supportBotID, { transaction })
      : await UserEntity.create(
          { userType: 'bot', platformApplicationID: application.id },
          { transaction },
        );

    if (!bot) {
      throw new Error('No support bot found');
    }

    const result = await bot.update(
      {
        name,
        // technically this might not have changed but it doesn't matter
        // since this is the only way to set the support bot's profile (not
        // through Settings or slack linking)
        nameUpdatedTimestamp: Sequelize.fn('NOW'),
        profilePictureURL,
        // same as for nameUpdatedTimestamp
        profilePictureURLUpdatedTimestamp: Sequelize.fn('NOW'),
      },
      { transaction },
    );
    this.loaders?.userLoader.clearAll();
    return result;
  }

  async rawBulkCreate(
    records: CreationAttributes<UserEntity>[],
    transaction?: Transaction,
  ) {
    const result = await UserEntity.bulkCreate(records, {
      transaction,
      updateOnDuplicate: [
        'name',
        'screenName',
        'nameUpdatedTimestamp',
        'email',
        'profilePictureURL',
        'profilePictureURLUpdatedTimestamp',
        'externalProvider',
        'state',
        'metadata',
      ],
      conflictWhere: { platformApplicationID: { [Op.ne]: null } },
    });
    this.loaders?.userLoader.clearAll();
    return result;
  }
}
