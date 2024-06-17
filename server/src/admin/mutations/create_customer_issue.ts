import { sendCustomerIssueNotification } from 'server/src/admin/crt_notifications.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { AdminCRTCustomerIssueChangeEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueChangeEntity.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';
import { AdminCRTCustomerIssueSubscriptionEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueSubscriptionEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import env from 'server/src/config/Env.ts';

const DEFAULT_SUBSCRIBERS =
  env.CORD_TIER !== 'dev'
    ? [
        '7db31052-7bee-4eb9-bfd7-8abe89fa0dc2', // Nimrod User ID
        '2c615438-3515-4885-b945-5b0ccf7f9ba7', // Sam User ID
        'fd2096ce-639a-4a04-b3e3-a6fa752c5da2', // Dave User ID
        '3d027fd8-7bb7-4c44-9e73-0c11a5323b01', // Mike User ID
      ]
    : []; // Add your ID here for local testing

export const createCustomerIssueResolver: Resolvers['Mutation']['createCustomerIssue'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const {
      customerID,
      title,
      body,
      comingFrom,
      decision,
      lastTouch,
      communicationStatus,
      type,
      priority,
      assignee,
      externallyVisible,
    } = args;

    const customerName = await CustomerEntity.findByPk(customerID).then(
      (customer) => {
        if (!customer) {
          throw new Error('CustomerID does not exist');
        }
        return customer.name;
      },
    );

    try {
      const issue = await AdminCRTCustomerIssueEntity.create({
        customerID,
        title,
        body,
        comingFrom,
        decision,
        lastTouch,
        communicationStatus,
        type,
        priority,
        assignee,
        externallyVisible,
      });

      await AdminCRTCustomerIssueChangeEntity.create({
        issueID: issue.id,
        userID,
        changeDetail: {
          created: true,
        },
      });

      await Promise.all(
        DEFAULT_SUBSCRIBERS.map((subscriber) =>
          AdminCRTCustomerIssueSubscriptionEntity.create({
            issueID: issue.id,
            userID: subscriber,
          }),
        ),
      );

      await sendCustomerIssueNotification({
        issueID: issue.id,
        actor: userID,
        assignee: assignee,
        template: `{{actor}} created a new issue for ${customerName}, with title: ${title}`,
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
