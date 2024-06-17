import { Op, Sequelize } from 'sequelize';

import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export const customerSlackChannelsResolver: Resolvers['Query']['customerSlackChannels'] =
  async () => {
    const customerWithSlackChannels = await CustomerEntity.findAll({
      where: {
        slackChannel: { [Op.not]: null },
        implementationStage: { [Op.not]: 'inactive' },
      },
      order: [[Sequelize.fn('lower', Sequelize.col('name')), 'ASC']],
    });

    return customerWithSlackChannels.map((customer) => {
      return {
        id: customer.id,
        name: customer.name,
        // This should never happen because we filter out nullable values above
        slackChannelName: customer.slackChannel ?? 'unknown',
      };
    });
  };
