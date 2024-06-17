import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { getClientAuthToken } from '@cord-sdk/server';
import env from 'server/src/config/Env.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { DEV_CONSOLE_APP_ID } from 'server/src/console/queries/console_cord_session_token.ts';

export const customerIssueCordSessionTokenResolver: Resolvers['Query']['customerIssueCordSessionToken'] =
  async (_, args, context) => {
    if (!context.session.viewer.userID) {
      console.log(
        'No user id provided in customerIssueCordSessionTokenResolver',
      );
      return '';
    }
    const user = await context.loaders.userLoader.loadUser(
      context.session.viewer.userID,
    );
    if (!user) {
      console.log('Unable to load user : ', context.session.viewer.userID);
      return '';
    }

    const issueID = args.issueID;
    const issue = await AdminCRTCustomerIssueEntity.findByPk(issueID);
    if (!issue) {
      console.log('Unable to find issue : ', issueID);
      return '';
    }
    const customer = await CustomerEntity.findByPk(issue.customerID);
    if (!customer) {
      console.log(
        'Unable to find a customer associated with issue : ',
        issueID,
      );
      return '';
    }

    return getClientAuthToken(
      DEV_CONSOLE_APP_ID,
      env.DEV_CONSOLE_CORD_APP_SECRET,
      {
        user_id: user.id,
        organization_id: customer.id,
        user_details: {
          name: user.name ?? undefined,
          email: user.email ?? '',
          profile_picture_url: user.profilePictureURL ?? undefined,
        },
        organization_details: {
          name: customer.name,
        },
      },
    );
  };
