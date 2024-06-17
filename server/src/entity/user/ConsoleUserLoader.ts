import type { Transaction, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';

export class ConsoleUserLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    // TODO: Add dataloader, that keys on email, not on id.
  }

  async loadUser(email: string, transaction?: Transaction) {
    return await ConsoleUserEntity.findOne({
      where: { email },
      transaction,
    });
  }

  async loadConsoleUsersForCustomer(
    customerID: UUID,
    includingPendingUsers?: boolean,
  ): Promise<ConsoleUserEntity[]> {
    let whereOptions: WhereOptions = {
      customerID,
    };

    if (includingPendingUsers) {
      whereOptions = {
        [Op.or]: {
          customerID,
          pendingCustomerID: customerID,
        },
      };
    }

    return await ConsoleUserEntity.findAll({
      where: whereOptions,
      order: ['pendingCustomerID'],
    });
  }

  async loadPendingUserInCustomer(
    email: string,
    pendingCustomerID: string,
    transaction?: Transaction,
  ) {
    return await ConsoleUserEntity.findOne({
      where: { email, pendingCustomerID },
      transaction,
    });
  }
}
