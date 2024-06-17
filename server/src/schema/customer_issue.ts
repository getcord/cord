import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { AdminCRTCustomerIssueChangeEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueChangeEntity.ts';
import { AdminCRTCustomerIssueSubscriptionEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueSubscriptionEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const customerIssueResolver: Resolvers['CustomerIssue'] = {
  customer: async (customerIssue, _args, context) => {
    const customer = await context.loaders.customerLoader.load(
      customerIssue.customerID,
    );
    if (!customer) {
      throw new Error('Customer missing');
    }
    return customer;
  },
  nextAction: (customerIssue) => {
    const { decision, communicationStatus } = customerIssue;
    if (communicationStatus === 'none') {
      return 'ack_receipt';
    }
    if (decision === 'pending') {
      return 'make_decision';
    }
    if (communicationStatus === 'request_acked') {
      return 'send_decision';
    }
    if (decision === 'accepted') {
      return 'do_work';
    }
    if (
      (decision === 'done' || decision === 'rejected') &&
      communicationStatus === 'decision_sent'
    ) {
      return 'wait_for_ack';
    }
    if (
      (decision === 'done' || decision === 'rejected') &&
      communicationStatus === 'decision_acked'
    ) {
      return 'done';
    }
    return 'unknown';
  },
  history: async (customerIssue) => {
    return await AdminCRTCustomerIssueChangeEntity.findAll({
      where: { issueID: customerIssue.id },
      order: [['timestamp', 'ASC']],
    });
  },
  assignee: async (customerIssue, _args, context) => {
    return customerIssue.assignee
      ? await context.loaders.userLoader.loadUser(customerIssue.assignee)
      : null;
  },
  subscribed: async (customerIssue, _args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const issueID = customerIssue.id;

    const subscription = await AdminCRTCustomerIssueSubscriptionEntity.findOne({
      where: { issueID, userID },
    });

    return !!subscription;
  },
};
