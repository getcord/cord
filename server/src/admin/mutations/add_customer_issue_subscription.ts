import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { AdminCRTCustomerIssueSubscriptionEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueSubscriptionEntity.ts';

export const addCustomerIssueSubscriptionResolver: Resolvers['Mutation']['addCustomerIssueSubscription'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const { issueID } = args;

    try {
      await AdminCRTCustomerIssueSubscriptionEntity.findOrCreate({
        where: {
          issueID,
          userID,
        },
      });
    } catch (e: any) {
      return {
        success: false,
        failureDetails: { code: e?.code, message: e?.message },
      };
    }

    return {
      success: true,
      failureDetails: null,
    };
  };
