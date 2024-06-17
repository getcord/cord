import { makeExecutableSchema } from '@graphql-tools/schema';
import { createHeimdallSwitchResolver } from 'server/src/admin/mutations/create_heimdall_switch.ts';
import { createProviderMutationResolver } from 'server/src/admin/mutations/create_provider.ts';
import { createProviderDocumentMutatorMutationResolver } from 'server/src/admin/mutations/create_provider_document_mutator.ts';
import { saveProviderRuleMutationResolver } from 'server/src/admin/mutations/save_provider_rule.ts';
import { createProviderRuleTestMutationResolver } from 'server/src/admin/mutations/create_provider_rule_test.ts';
import { deleteProviderMutationResolver } from 'server/src/admin/mutations/delete_provider.ts';
import { deleteProviderDocumentMutatorMutationResolver } from 'server/src/admin/mutations/delete_provider_document_mutator.ts';
import { deleteProviderRuleMutationResolver } from 'server/src/admin/mutations/delete_provider_rule.ts';
import { deleteProviderRuleTestMutationResolver } from 'server/src/admin/mutations/delete_provider_rule_test.ts';
import { flipHeimdallSwitchResolver } from 'server/src/admin/mutations/flip_heimdall_switch.ts';
import { revertProviderToPublishedStateMutationResolver } from 'server/src/admin/mutations/revert_provider_to_published_state.ts';
import { setProviderPublishedMutationResolver } from 'server/src/admin/mutations/set_provider_published.ts';
import { updateCustomS3BucketSecretResolver } from 'server/src/admin/mutations/update_custom_s3_bucket_secret.ts';
import { updateProviderMutationResolver } from 'server/src/admin/mutations/update_provider.ts';
import { updateProviderDocumentMutatorMutationResolver } from 'server/src/admin/mutations/update_provider_document_mutator.ts';
import { updateProviderRuleMutationResolver } from 'server/src/admin/mutations/update_provider_rule.ts';
import { updateProviderRulesOrderMutationResolver } from 'server/src/admin/mutations/update_provider_rules_order.ts';
import { applicationQueryResolver } from 'server/src/admin/queries/application.ts';
import { heimdallSwitchesQueryResolver } from 'server/src/admin/queries/heimdall_switches.ts';
import { pageContextForURLQueryResolver } from 'server/src/admin/queries/page_context_for_url.ts';
import { providerQueryResolver } from 'server/src/admin/queries/provider.ts';
import { providersQueryResolver } from 'server/src/admin/queries/providers.ts';
import { s3BucketQueryResolver } from 'server/src/admin/queries/s3_bucket.ts';
import { selectQueryResolver } from 'server/src/admin/queries/select.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { heimdallSwitchQueryResolver } from 'server/src/admin/queries/heimdall_switch.ts';
import { pingQueryResolver } from 'server/src/public/queries/ping.ts';
import { viewerQueryResolver } from 'server/src/public/queries/viewer.ts';
import type { withIndexSignature } from 'server/src/schema/resolvers.ts';
import { allResolvers } from 'server/src/schema/resolvers.ts';
import { updateApplicationResolver } from 'server/src/admin/mutations/update_application.ts';
import { createApplicationCustomS3BucketResolver } from 'server/src/admin/mutations/create_application_custom_s3_bucket.ts';
import { deleteApplicationCustomS3BucketResolver } from 'server/src/admin/mutations/delete_application_custom_s3_bucket.ts';
import { featureFlagsQueryResolver } from 'server/src/admin/queries/feature_flags.ts';
import { cordSessionTokenQueryResolver } from 'server/src/admin/queries/cord_session_token.ts';
import { toggleInternalFlagOnOrgMutationResolver } from 'server/src/admin/mutations/toggle_internal_flag_on_org.ts';
import { usersQueryResolver } from 'server/src/public/queries/users.ts';
import { usersByExternalIDQueryResolver } from 'server/src/public/queries/users_by_external_id.ts';
import { createCustomerResolver } from 'server/src/admin/mutations/create_customer.ts';
import { customerQueryResolver } from 'server/src/admin/queries/customer.ts';
import { updateCustomerResolver } from 'server/src/admin/mutations/update_customer.ts';
import { addConsoleUserToCustomerMutationResolver } from 'server/src/admin/mutations/add_console_user_to_customer.ts';
import { removeConsoleUserFromCustomerMutationResolver } from 'server/src/admin/mutations/remove_console_user_from_customer.ts';
import { customerConsoleUsersQueryResolver } from 'server/src/admin/queries/customer_console_users.ts';
import { createApplicationResolver } from 'server/src/admin/mutations/create_application.ts';
import { customerApplicationsResolver } from 'server/src/admin/queries/customer_applications.ts';
import { adminPlatformUsersQueryResolver } from 'server/src/admin/queries/admin_platform_users.ts';
import { goRedirectQueryResolver } from 'server/src/admin/queries/go_redirect.ts';
import { setGoRedirectMutationResolver } from 'server/src/admin/mutations/set_go_redirect.ts';
import { testTokenQueryResolver } from 'server/src/admin/queries/test_token.ts';
import { createCustomerIssueResolver } from 'server/src/admin/mutations/create_customer_issue.ts';
import { customerIssueQueryResolver } from 'server/src/admin/queries/customer_issue.ts';
import { customerIssuesResolver as customerIssuesQueryResolver } from 'server/src/admin/queries/customer_issues.ts';
import { updateCustomerIssueResolver } from 'server/src/admin/mutations/update_customer_issue.ts';
import { customerIssueCordSessionTokenResolver } from 'server/src/admin/queries/customer_issue_cord_session_token.ts';
import { deleteCustomerIssueResolver } from 'server/src/admin/mutations/delete_customer_issue.ts';
import { addCustomerIssueSubscriptionResolver } from 'server/src/admin/mutations/add_customer_issue_subscription.ts';
import { removeCustomerIssueSubscriptionResolver } from 'server/src/admin/mutations/remove_customer_issue_subscription.ts';
import { customerSlackChannelsResolver } from 'server/src/admin/queries/customer_slack_channels.ts';
import { sendSlackMessageToCustomersMutationResolver } from 'server/src/admin/mutations/send_slack_message_to_customers.ts';
import { viewerIdentityLiveQueryResolver } from 'server/src/public/subscriptions/viewer_identity.ts';
import { userLiveQueryResolver } from 'server/src/public/subscriptions/user_live_query.ts';
import { createStripeCustomerResolver } from 'server/src/admin/mutations/create_stripe_customer.ts';
import { createStripeSubscriptionResolver } from 'server/src/admin/create_stripe_subscription.ts';
import Schema from 'server/src/admin/schema.graphql';

const {
  Query: _query,
  Mutation: _mutation,
  Subscription: _subscription,
  ...publicResolvers
} = allResolvers;
export const allAdminResolvers: Resolvers = {
  ...publicResolvers,
  Query: {
    viewer: viewerQueryResolver,
    users: usersQueryResolver,
    usersByExternalID: usersByExternalIDQueryResolver,
    select: selectQueryResolver,
    providers: providersQueryResolver,
    provider: providerQueryResolver,
    pageContextForURL: pageContextForURLQueryResolver,
    ping: pingQueryResolver,
    s3Bucket: s3BucketQueryResolver,
    application: applicationQueryResolver,
    customer: customerQueryResolver,
    customerApplications: customerApplicationsResolver,
    heimdallSwitches: heimdallSwitchesQueryResolver,
    heimdallSwitchAdmin: heimdallSwitchQueryResolver,
    customerConsoleUsers: customerConsoleUsersQueryResolver,
    featureFlags: featureFlagsQueryResolver,
    cordSessionToken: cordSessionTokenQueryResolver,
    adminPlatformUsers: adminPlatformUsersQueryResolver,
    goRedirect: goRedirectQueryResolver,
    testToken: testTokenQueryResolver,
    customerIssue: customerIssueQueryResolver,
    customerIssues: customerIssuesQueryResolver,
    customerIssueCordSessionToken: customerIssueCordSessionTokenResolver,
    customerSlackChannels: customerSlackChannelsResolver,
  },
  Mutation: {
    createProvider: createProviderMutationResolver,
    updateProvider: updateProviderMutationResolver,
    deleteProvider: deleteProviderMutationResolver,
    setProviderPublished: setProviderPublishedMutationResolver,
    revertProviderToPublishedState:
      revertProviderToPublishedStateMutationResolver,
    saveProviderRule: saveProviderRuleMutationResolver,
    updateProviderRule: updateProviderRuleMutationResolver,
    updateProviderRulesOrder: updateProviderRulesOrderMutationResolver,
    deleteProviderRule: deleteProviderRuleMutationResolver,
    createProviderDocumentMutator:
      createProviderDocumentMutatorMutationResolver,
    updateProviderDocumentMutator:
      updateProviderDocumentMutatorMutationResolver,
    deleteProviderDocumentMutator:
      deleteProviderDocumentMutatorMutationResolver,
    createProviderRuleTest: createProviderRuleTestMutationResolver,
    deleteProviderRuleTest: deleteProviderRuleTestMutationResolver,
    createApplicationCustomS3Bucket: createApplicationCustomS3BucketResolver,
    deleteApplicationCustomS3Bucket: deleteApplicationCustomS3BucketResolver,
    updateCustomS3BucketAccessKey: updateCustomS3BucketSecretResolver,
    createHeimdallSwitch: createHeimdallSwitchResolver,
    flipHeimdallSwitch: flipHeimdallSwitchResolver,
    createApplication: createApplicationResolver,
    updateApplication: updateApplicationResolver,
    createCustomer: createCustomerResolver,
    updateCustomer: updateCustomerResolver,
    addConsoleUserToCustomer: addConsoleUserToCustomerMutationResolver,
    removeConsoleUserFromCustomer:
      removeConsoleUserFromCustomerMutationResolver,
    toggleInternalFlagOnOrg: toggleInternalFlagOnOrgMutationResolver,
    setGoRedirect: setGoRedirectMutationResolver,
    createCustomerIssue: createCustomerIssueResolver,
    updateCustomerIssue: updateCustomerIssueResolver,
    deleteCustomerIssue: deleteCustomerIssueResolver,
    addCustomerIssueSubscription: addCustomerIssueSubscriptionResolver,
    removeCustomerIssueSubscription: removeCustomerIssueSubscriptionResolver,
    sendSlackMessageToCustomers: sendSlackMessageToCustomersMutationResolver,
    createStripeCustomer: createStripeCustomerResolver,
    createStripeSubscription: createStripeSubscriptionResolver,
  },
  Subscription: {
    viewerIdentityLiveQuery: viewerIdentityLiveQueryResolver,
    userLiveQuery: userLiveQueryResolver,
  },
  PageContextForURLResult: {},
  SuccessResult: {},
  IDResult: {},
  CustomerSlackChannelsResult: {},
};

const apolloAdminResolvers: withIndexSignature<typeof allAdminResolvers> =
  allAdminResolvers;

export const adminGraphQLSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: apolloAdminResolvers,
});
