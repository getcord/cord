import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const getCustomerIssueQueryResolver: Resolvers['Query']['getCustomerIssue'] =
  async (_, args, context) => {
    const id = args.id;
    const customerID = await consoleUserToCustomerID(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );
    if (!customerID) {
      return null;
    }

    const entity = await AdminCRTCustomerIssueEntity.findOne({
      where: { id, customerID, externallyVisible: true },
      rejectOnEmpty: true,
    });

    return entity;
  };
