import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const customerIssuesResolver: Resolvers['Query']['customerIssues'] =
  async (_, args, __) => {
    return await AdminCRTCustomerIssueEntity.findAll({
      where: {
        ...(args.customerID && { customerID: args.customerID }),
      },
      order: [['lastTouch', 'ASC NULLS FIRST']],
    });
  };
