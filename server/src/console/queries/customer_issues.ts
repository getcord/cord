import { Op } from 'sequelize';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const customerIssuesQueryResolver: Resolvers['Query']['customerIssues'] =
  async (_, _args, context) => {
    const customerID = await consoleUserToCustomerID(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );
    if (!customerID) {
      return [];
    }

    return await AdminCRTCustomerIssueEntity.findAll({
      where: {
        customerID,
        externallyVisible: true,
        communicationStatus: { [Op.not]: 'decision_acked' },
      },
    });
  };
