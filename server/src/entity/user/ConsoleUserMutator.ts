import type { Transaction } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';
import { ConsoleUserLoader } from 'server/src/entity/user/ConsoleUserLoader.ts';
import { Logger } from 'server/src/logging/Logger.ts';

export class ConsoleUserMutator {
  viewer: Viewer;
  logger: Logger;
  loader: ConsoleUserLoader;

  constructor(viewer: Viewer, loader?: ConsoleUserLoader) {
    this.viewer = viewer;
    this.logger = new Logger(viewer);
    this.loader = loader ?? new ConsoleUserLoader(viewer);
  }

  async upsertUser({
    email,
    name,
    picture,
    verified,
    auth0UserID,
  }: {
    email: string;
    name?: string;
    picture?: string;
    verified?: boolean;
    auth0UserID?: string;
  }): Promise<ConsoleUserEntity> {
    const user = await this.loader.loadUser(email);

    if (user) {
      return await user.update({ name, picture, verified, auth0UserID });
    }

    return await ConsoleUserEntity.create({
      email,
      name,
      picture,
      verified,
      auth0UserID,
    });
  }

  async grantCustomerAccess(
    user: ConsoleUserEntity,
    customerID: UUID,
    transaction?: Transaction,
  ): Promise<boolean> {
    try {
      await ConsoleUserEntity.update(
        { customerID: customerID },
        { where: { id: user.id }, transaction },
      );
      return true;
    } catch (error) {
      this.logger.logException(
        'Unable to grant user access to application',
        error,
        {
          consoleUserId: user.id,
          customerID,
        },
      );
      return false;
    }
  }

  async removeCustomerAccess(
    user: ConsoleUserEntity,
    customerID: UUID,
  ): Promise<boolean> {
    try {
      await ConsoleUserEntity.update(
        { customerID: null },
        { where: { id: user.id, customerID } },
      );
      // no access exists, we consider this successful.
      return true;
    } catch (error) {
      this.logger.logException(
        'Unable to remove user access to application',
        error,
        {
          consoleUserId: user.id,
          customerID,
        },
      );
      return false;
    }
  }

  async grantPendingUserCustomerAccess(
    user: ConsoleUserEntity,
    customerID: UUID,
    transaction?: Transaction,
  ) {
    try {
      const [updatedCount] = await ConsoleUserEntity.update(
        { customerID, pendingCustomerID: null },
        { where: { id: user.id, pendingCustomerID: customerID }, transaction },
      );

      if (updatedCount === 1) {
        return true;
      }
      throw new Error(
        'Could not update console user - grantPendingUserCustomerAccess',
      );
    } catch (error) {
      this.logger.logException(
        'Unable to grant pending user access to application',
        error,
        {
          consoleUserId: user.id,
          pendingCustomerID: user.pendingCustomerID,
          customerID,
        },
      );
      throw error;
    }
  }

  async denyPendingUserCustomerAccess(
    user: ConsoleUserEntity,
    customerID: UUID,
    transaction?: Transaction,
  ) {
    try {
      const [updatedCount] = await ConsoleUserEntity.update(
        { pendingCustomerID: null },
        { where: { id: user.id, pendingCustomerID: customerID }, transaction },
      );
      if (updatedCount === 1) {
        return true;
      }
      throw new Error(
        'Could not update console user - denyPendingUserCustomerAccess',
      );
    } catch (error) {
      this.logger.logException(
        'Unable to deny pending user access to application',
        error,
        {
          consoleUserId: user.id,
          customerID,
        },
      );
      throw error;
    }
  }

  async requestCustomerAccess(
    user: ConsoleUserEntity,
    customerID: UUID,
  ): Promise<boolean> {
    try {
      const [updatedCount] = await ConsoleUserEntity.update(
        { pendingCustomerID: customerID },
        { where: { id: user.id, customerID: null } },
      );
      if (updatedCount === 1) {
        return true;
      }
      throw new Error('Could not update console user - requestCustomerAccess');
    } catch (error) {
      this.logger.logException(
        'Unable to request user access to application',
        error,
        {
          consoleUserId: user.id,
          customerID,
        },
      );
      throw error;
    }
  }

  async revokeRequestCustomerAccess(
    user: ConsoleUserEntity,
    customerID: UUID,
    transaction?: Transaction,
  ): Promise<boolean> {
    try {
      const [updatedCount] = await ConsoleUserEntity.update(
        { pendingCustomerID: null },
        { where: { id: user.id }, transaction },
      );
      if (updatedCount === 1) {
        return true;
      }
      throw new Error(
        'Could not update console user - revokeRequestCustomerAccess',
      );
    } catch (error) {
      this.logger.logException(
        'Unable to revoke request user access to application',
        error,
        {
          consoleUserId: user.id,
          revokeRequestCustomerID: customerID,
        },
      );
      throw error;
    }
  }
}
