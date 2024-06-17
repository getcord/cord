import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const deleteCustomerIssueResolver: Resolvers['Mutation']['deleteCustomerIssue'] =
  async (_, args, context) => {
    const { id } = args;

    const issue = await AdminCRTCustomerIssueEntity.findByPk(id);
    if (!issue) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    await issue.destroy();

    // Log the data in case this was done by accident and we need to recover it
    context.logger.info('Issue deleted', { issue: issue.toJSON() });

    return {
      success: true,
      failureDetails: null,
    };
  };
