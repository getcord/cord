import { makeExecutableSchema } from '@graphql-tools/schema';
import { syncUserMutationResolver } from 'server/src/console/mutations/sync_user.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { applicationsQueryResolver } from 'server/src/console/queries/applications.ts';
import { pingQueryResolver } from 'server/src/public/queries/ping.ts';
import type { withIndexSignature } from 'server/src/schema/resolvers.ts';
import { allResolvers } from 'server/src/schema/resolvers.ts';
import { updateApplicationResolver } from 'server/src/console/mutations/update_application.ts';
import { applicationQueryResolver } from 'server/src/console/queries/application.ts';
import { updateCustomS3BucketSecretResolver } from 'server/src/console/mutations/update_custom_s3_bucket_secret.ts';
import { deleteApplicationCustomS3BucketResolver } from 'server/src/console/mutations/delete_application_custom_s3_bucket.ts';
import { createApplicationCustomS3BucketResolver } from 'server/src/console/mutations/create_application_custom_s3_bucket.ts';
import { s3BucketQueryResolver } from 'server/src/console/queries/s3_bucket.ts';
import { getSignedUploadURLResolver } from 'server/src/console/mutations/get_signed_upload_url.ts';
import { createApplicationResolver } from 'server/src/console/mutations/create_application.ts';
import { logEventsMutationResolver } from 'server/src/public/mutations/log_events.ts';
import { featureFlagsQueryResolver } from 'server/src/console/queries/feature_flags.ts';
import { updateSupportBotResolver } from 'server/src/console/mutations/update_support_bot.ts';
import { encodedSlackTokenResolver } from 'server/src/console/queries/encoded_slack_token.ts';
import { slackChannelsQueryResolver } from 'server/src/console/queries/slackChannels.ts';
import { removeSlackSupportOrgResolver } from 'server/src/console/mutations/remove_slack_support_org.ts';
import { consoleUserQueryResolver } from 'server/src/console/queries/console_user.ts';
import { applicationFlagQueryResolver } from 'server/src/console/queries/application_flag.ts';
import { customerConsoleUsersQueryResolver } from 'server/src/console/queries/customer_console_users.ts';
import { addConsoleUserToCustomerMutationResolver } from 'server/src/console/mutations/add_console_user_to_customer.ts';
import { removeConsoleUserFromCustomerMutationResolver } from 'server/src/console/mutations/remove_console_user_from_customer.ts';
import { getOrgsQueryResolver } from 'server/src/console/queries/get_orgs.ts';
import { getUsersQueryResolver } from 'server/src/console/queries/get_users.ts';
import { consoleUserResolver } from 'server/src/schema/console_user.ts';
import { createCustomerResolver } from 'server/src/console/mutations/create_customer.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { assertConsoleUser } from 'server/src/auth/index.ts';
import { createCustomerIssueResolver } from 'server/src/console/mutations/create_customer_issue.ts';
import { updateCustomerIssueResolver } from 'server/src/console/mutations/update_customer_issue.ts';
import { getCustomerIssueQueryResolver } from 'server/src/console/queries/get_customer_issue.ts';
import { customerIssuesQueryResolver } from 'server/src/console/queries/customer_issues.ts';
import { getConsoleCordSessionTokenResolver } from 'server/src/console/queries/console_cord_session_token.ts';
import { updateCustomerNameResolver } from 'server/src/console/mutations/update_customer_name.ts';
import { updateUserDetailsMutationResolver } from 'server/src/console/mutations/update_user_details.ts';
import { updateAccessToCustomerResolver } from 'server/src/console/mutations/update_access_to_customer.ts';
import { requestAccessToCustomerResolver } from 'server/src/console/mutations/request_access_to_customer.ts';
import { startCheckoutResolver } from 'server/src/console/mutations/start_checkout.ts';
import {
  customerEventTypeResolver,
  customerEventsSubscriptionResolver,
} from 'server/src/console/subscriptions/customer_events.ts';
import { customerSubscriptionUpdatedResolver } from 'server/src/console/customer_subscription_updated.ts';
import { ConsoleGettingStartedUpdatedResolver } from 'server/src/console/getting_started_updated.ts';
import { redirectToStripeCustomerPortalResolver } from 'server/src/console/mutations/redirect_to_stripe_customer_portal.ts';
import { usageStatsQueryResolver } from 'server/src/console/queries/usage_stats.ts';
import {
  applicationEventTypeResolver,
  applicationEventSubscriptionResolver,
} from 'server/src/console/subscriptions/application_events.ts';
import Schema from 'server/src/console/schema.graphql';

function checkIfUserIsConsoleUser<
  T extends Resolvers['Query'] | Resolvers['Mutation'],
>(query: T, exclude: Array<keyof T>): T {
  let key: keyof T;
  for (key in query) {
    const originalResolver = query[key];
    const thisKey = key;

    query[key] = (async (parent: any, args: any, context: RequestContext) => {
      if (!exclude.includes(thisKey)) {
        assertConsoleUser(context.session.viewer);
      }
      return (originalResolver as any)(parent, args, context);
    }) as any;
  }

  return query;
}

const {
  Query: _query,
  Mutation: _mutation,
  Subscription: _subscription,
  ...publicResolvers
} = allResolvers;
export const allConsoleResolvers: Resolvers = {
  ...publicResolvers,
  Query: checkIfUserIsConsoleUser(
    {
      ping: pingQueryResolver,
      applications: applicationsQueryResolver,
      application: applicationQueryResolver,
      consoleUser: consoleUserQueryResolver,
      customerConsoleUsers: customerConsoleUsersQueryResolver,
      s3Bucket: s3BucketQueryResolver,
      featureFlags: featureFlagsQueryResolver,
      encodedSlackToken: encodedSlackTokenResolver,
      slackChannelsForConsole: slackChannelsQueryResolver,
      applicationFlag: applicationFlagQueryResolver,
      getOrgs: getOrgsQueryResolver,
      getUsers: getUsersQueryResolver,
      customerIssues: customerIssuesQueryResolver,
      getCustomerIssue: getCustomerIssueQueryResolver,
      consoleCordSessionToken: getConsoleCordSessionTokenResolver,
      usageStats: usageStatsQueryResolver,
    },
    ['ping', 'featureFlags', 'consoleUser'],
  ),
  Mutation: checkIfUserIsConsoleUser(
    {
      logEvents: logEventsMutationResolver,
      syncUser: syncUserMutationResolver,
      updateApplication: updateApplicationResolver,
      updateCustomS3BucketSecret: updateCustomS3BucketSecretResolver,
      deleteApplicationCustomS3Bucket: deleteApplicationCustomS3BucketResolver,
      createApplicationCustomS3Bucket: createApplicationCustomS3BucketResolver,
      getSignedUploadURL: getSignedUploadURLResolver,
      createApplication: createApplicationResolver,
      updateSupportBot: updateSupportBotResolver,
      removeSlackSupportOrg: removeSlackSupportOrgResolver,
      addConsoleUserToCustomer: addConsoleUserToCustomerMutationResolver,
      removeConsoleUserFromCustomer:
        removeConsoleUserFromCustomerMutationResolver,
      createCustomer: createCustomerResolver,
      createCustomerIssue: createCustomerIssueResolver,
      updateCustomerIssue: updateCustomerIssueResolver,
      updateCustomerName: updateCustomerNameResolver,
      updateUserDetails: updateUserDetailsMutationResolver,
      updateAccessToCustomer: updateAccessToCustomerResolver,
      requestAccessToCustomer: requestAccessToCustomerResolver,
      startCheckout: startCheckoutResolver,
      redirectToStripeCustomerPortal: redirectToStripeCustomerPortalResolver,
    },
    ['logEvents'],
  ),
  Subscription: {
    customerEvents: customerEventsSubscriptionResolver,
    applicationEvents: applicationEventSubscriptionResolver,
  },
  SignedUploadURLResult: {},
  ConsoleApplication: {},
  ConsoleApplicationOrganization: {},
  ConsoleApplicationUser: {},
  ConsoleUser: consoleUserResolver,
  SyncUserDuplicateDomainResult: {},
  StartCheckoutResult: {},
  CustomerSubscriptionUpdated: customerSubscriptionUpdatedResolver,
  CustomerEvent: customerEventTypeResolver,
  RedirectToStripeCustomerPortalResult: {},
  UsageStats: {},
  ConsoleGettingStartedUpdated: ConsoleGettingStartedUpdatedResolver,
  ApplicationEvent: applicationEventTypeResolver,
};

const apolloConsoleResolvers: withIndexSignature<typeof allConsoleResolvers> =
  allConsoleResolvers;

export const consoleGraphQLSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: apolloConsoleResolvers,
});
