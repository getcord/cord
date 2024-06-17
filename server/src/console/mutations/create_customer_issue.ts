import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const createCustomerIssueResolver: Resolvers['Mutation']['createCustomerIssue'] =
  async (_, args, context) => {
    const { body, title, type, priority } = args;

    const userEmail = context.session.viewer.developerUserID!;
    const user = await context.loaders.consoleUserLoader.loadUser(userEmail);
    if (!user) {
      context.logger.error('No console user found.');
      throw new Error('No user found. Please log in.');
    }

    await AdminCRTCustomerIssueEntity.create({
      customerID: user.customerID,
      title,
      body,
      type,
      priority,
      comingFrom: 'them',
      externallyVisible: true,
    });

    return { success: true, failureDetails: null };
  };
