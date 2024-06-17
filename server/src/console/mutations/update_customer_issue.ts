import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const updateCustomerIssueResolver: Resolvers['Mutation']['updateCustomerIssue'] =
  async (_, args, context) => {
    const { id, title, body, type, priority } = args;

    const userEmail = context.session.viewer.developerUserID!;
    const user = await context.loaders.consoleUserLoader.loadUser(userEmail);
    if (!user) {
      context.logger.error('No console user found.');
      throw new Error('No user found. Please log in.');
    }
    if (!user.customerID) {
      throw new Error('Console user not associated with a customer');
    }

    const [updated] = await AdminCRTCustomerIssueEntity.update(
      {
        title,
        body,
        type,
        priority,
      },
      { where: { id, customerID: user.customerID } },
    );

    return {
      success: updated === 1,
      failureDetails: null,
    };
  };
