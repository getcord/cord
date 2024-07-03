import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { threadByExternalID2QueryResolver } from 'server/src/public/queries/thread_by_external_id.ts';
import { GraphQLDateTime } from 'server/src/util/graphql-iso-date.js';
import GraphQLUUID from 'server/src/util/graphql-type-uuid.js';
import { shareThreadToEmailResolver } from 'server/src/public/mutations/share_thread_to_email.ts';
import { addThreadToSelectedSlackChannelResolver } from 'server/src/public/mutations/add_thread_to_slack_channel.ts';
import { createFileMutationResolver } from 'server/src/public/mutations/create_file.ts';
import { createMessageReactionResolver } from 'server/src/public/mutations/create_reaction.ts';
import { createThreadMessageResolver } from 'server/src/public/mutations/create_thread_message.ts';
import { deleteMessageReactionMutationResolver } from 'server/src/public/mutations/delete_reaction.ts';
import { disconnectThirdPartyMutationResolver } from 'server/src/public/mutations/disconnect_third_party.ts';
import { logEventsMutationResolver } from 'server/src/public/mutations/log_events.ts';
import { setFileUploadStatusMutationResolver } from 'server/src/public/mutations/set_file_upload_status.ts';
import { setPreferenceMutationResolver } from 'server/src/public/mutations/set_preference.ts';
import { setSubscribedMutationResolver } from 'server/src/public/mutations/set_subscribed.ts';
import { setTypingMutationResolver } from 'server/src/public/mutations/set_typing.ts';
import { updateMessageResolver } from 'server/src/public/mutations/update_message.ts';
import { featureFlagsQueryResolver } from 'server/src/public/queries/feature_flags.ts';
import { pingQueryResolver } from 'server/src/public/queries/ping.ts';
import { providersQueryResolver } from 'server/src/public/queries/providers.ts';
import { taskQueryResolver } from 'server/src/public/queries/task.ts';
import { threadQueryResolver } from 'server/src/public/queries/thread.ts';
import {
  viewerQueryResolver,
  viewerResolver,
  viewerIdentityResolver,
} from 'server/src/public/queries/viewer.ts';
import { inboxSubscriptionResolver } from 'server/src/public/subscriptions/inbox.ts';
import { preferencesLiveQuerySubscriptionResolver } from 'server/src/public/subscriptions/preferences.ts';
import {
  threadEventsSubscriptionResolver,
  threadEventTypeResolver,
} from 'server/src/public/subscriptions/thread_events.ts';
import {
  ElementIdentifierVersionScalarType,
  JsonObjectReducerDataScalarType,
  MessageContentScalarType,
  RuleProviderScalarType,
  SimpleValueScalarType,
  ContextScalarType,
  MetadataScalarType,
  SimpleTranslationParametersScalarType,
} from 'server/src/schema/common.ts';
import { fileResolver } from 'server/src/schema/file.ts';
import { inboxResolver } from 'server/src/schema/inbox.ts';
import { loadMessagesResultResolver } from 'server/src/schema/load_messages_result.ts';
import {
  messageResolver,
  messageSourceTypeResolver,
} from 'server/src/schema/message.ts';
import { messageAnnotationAttachmentResolver } from 'server/src/schema/message_annotation_attachment.ts';
import { messageAttachmentTypeResolver } from 'server/src/schema/message_attachment.ts';
import { messageFileAttachmentResolver } from 'server/src/schema/message_file_attachment.ts';
import { messageReactionResolver } from 'server/src/schema/message_reaction.ts';
import { linkedOrgResolver, orgResolver } from 'server/src/schema/org.ts';
import { pageThreadAddedResolver } from 'server/src/schema/page_thread_added.ts';
import { pageVisitorResolver } from 'server/src/schema/page_visitor.ts';
import { pageVisitorUpdatedResolver } from 'server/src/schema/page_visitors_updated.ts';
import { providerDocumentMutatorResolver } from 'server/src/schema/provider_document_mutator.ts';
import { providerFullResolver } from 'server/src/schema/provider_full.ts';
import { providerRuleResolver } from 'server/src/schema/provider_rule.ts';
import { providerRuleTestResolver } from 'server/src/schema/provider_rule_test.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { taskResolver } from 'server/src/schema/task.ts';
import { taskThirdPartyReferenceResolver } from 'server/src/schema/task_third_party_reference.ts';
import { thirdPartyConnectionResolver } from 'server/src/schema/third_party_connection.ts';
import { threadResolver } from 'server/src/schema/thread.ts';
import { threadMessageAddedResolver } from 'server/src/schema/thread_message_added.ts';
import { threadMessageUpdatedResolver } from 'server/src/schema/thread_message_updated.ts';
import { threadMessageContentAppendedResolver } from 'server/src/schema/thread_message_content_appended.ts';
import { threadParticipantResolver } from 'server/src/schema/thread_participant.ts';
import { threadParticipantUpdatedIncrementalResolver } from 'server/src/schema/thread_participants_updated_incremental.ts';
import { threadTypingUsersUpdatedResolver } from 'server/src/schema/thread_typing_users_updated.ts';
import {
  userResolver,
  userWithOrgDetailsResolver,
} from 'server/src/schema/user.ts';
import { refreshFileUploadURLMutationResolver } from 'server/src/public/mutations/refresh_file_upload_url.ts';
import { s3BucketVisibleResolver } from 'server/src/schema/s3_bucket.ts';
import { heimdallSwitchResolver } from 'server/src/schema/heimdall_switch.ts';
import { setDeepLinkThreadIDMutationResolver } from 'server/src/public/mutations/set_deep_link_thread_id.ts';
import { clearDeepLinkThreadIDMutationResolver } from 'server/src/public/mutations/clear_deep_link_thread_id.ts';
import { applicationQueryResolver } from 'server/src/public/queries/application.ts';
import { applicationResolver } from 'server/src/schema/application.ts';
import { setThreadResolvedResolver } from 'server/src/public/mutations/set_thread_resolved.ts';
import { pageThreadResolvedResolver } from 'server/src/schema/page_thread_resolved.ts';
import { pageThreadUnresolvedResolver } from 'server/src/schema/page_thread_unresolved.ts';
import { unlinkOrgsMutationResolver } from 'server/src/public/mutations/unlink_orgs.ts';
import { annotationsOnPageQueryResolver } from 'server/src/public/queries/annotations_on_page.ts';
import { setAnnotationVisibleMutationResolver } from 'server/src/public/mutations/set_annotation_visible.ts';
import { annotationsOnPageUpdatedSubscriptionResolver } from 'server/src/public/subscriptions/annotations_on_page_updated.ts';
import { resetUserHiddenAnnotationsResolver } from 'server/src/public/mutations/reset_user_hidden_annotations.ts';
import { setPresentContextMutationResolver } from 'server/src/public/mutations/set_present_context.ts';
import { usersByExternalIDQueryResolver } from 'server/src/public/queries/users_by_external_id.ts';
import { markThreadSeenMutation } from 'server/src/public/mutations/mark_thread_seen.ts';
import { viewerIdentityLiveQueryResolver } from 'server/src/public/subscriptions/viewer_identity.ts';
import { usersQueryResolver } from 'server/src/public/queries/users.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { shouldRateLimit } from 'server/src/util/rateLimiter.ts';
import { Errors } from 'common/const/Errors.ts';
import { sendSampleWelcomeMessageResolver } from 'server/src/public/mutations/send_sample_welcome_message.ts';
import { consoleUserResolver } from 'server/src/schema/console_user.ts';
import { applicationDeploymentInfoResolver } from 'server/src/schema/application_deployment_info.ts';
import { adminChatUserResolver } from 'server/src/schema/admin_chat_user.ts';
import { organizationQueryResolver } from 'server/src/public/queries/organization.ts';
import {
  notificationAttachmentResolver,
  notificationHeaderNodeResolver,
  notificationSenderResolver,
  notificationsResolver,
} from 'server/src/public/queries/notifications.ts';
import {
  markAllNotificationsAsReadResolver,
  markNotificationAsReadResolver,
  markNotificationAsUnreadResolver,
} from 'server/src/public/mutations/notifications/mark_notification_as_read.ts';
import { activityQueryResolver } from 'server/src/public/queries/activity.ts';
import { threadActivitySummarySubscriptionResolver } from 'server/src/public/subscriptions/thread_activity_summary.ts';
import { activityResolver } from 'server/src/schema/activity.ts';
import { threadMessageRemovedResolver } from 'server/src/schema/thread_message_removed.ts';
import { threadShareToSlackResolver } from 'server/src/schema/thread_share_to_slack.ts';
import { setThreadNameResolver } from 'server/src/public/mutations/set_thread_name.ts';
import { deleteNotificationResolver } from 'server/src/public/mutations/notifications/delete_notification.ts';
import {
  notificationEventsSubscriptionResolver,
  notificationEventTypeResolver,
} from 'server/src/public/subscriptions/notification_events.ts';
import { notificationAddedResolver } from 'server/src/schema/notification_added.ts';
import { notificationReadStateUpdatedResolver } from 'server/src/schema/notification_read_state_updated.ts';
import { customerIssueResolver } from 'server/src/schema/customer_issue.ts';
import { customerIssueChangeResolver } from 'server/src/schema/customer_issue_change.ts';
import { notificationSummaryQueryResolver } from 'server/src/public/queries/notification_summary.ts';
import { notificationSummaryUpdatedSubscriptionResolver } from 'server/src/public/subscriptions/notification_summary_updated.ts';
import { notificationSummaryResolver } from 'server/src/schema/notification_summary.ts';
import { setThreadMetadataResolver } from 'server/src/public/mutations/set_thread_metadata.ts';
import { threadPropertiesUpdatedResolver } from 'server/src/schema/thread_properties_updated.ts';
import {
  pageEventTypeResolver,
  pageEventsWithLocationSubscriptionResolver,
} from 'server/src/public/subscriptions/page_events_with_location.ts';
import { messageByExternalIDQueryResolver } from 'server/src/public/queries/message_by_external_id.ts';
import { logDeprecationMutationResolver } from 'server/src/public/mutations/log_deprecation.ts';
import { notificationDeletedResolver } from 'server/src/schema/notification_deleted.ts';
import { notificationByExternalIDResolver } from 'server/src/public/queries/notification_by_external_id.ts';
import { setSubscribedByExternalIDMutationResolver } from 'server/src/public/mutations/set_subscribed_by_external_id.ts';
import { updateThreadByExternalIDResolver } from 'server/src/public/mutations/update_thread_by_external_id.ts';
import { createMessageByExternalIDResolver } from 'server/src/public/mutations/create_message_by_external_id.ts';
import { updateMessageByExternalIDResolver } from 'server/src/public/mutations/update_message_by_external_id.ts';
import { userLiveQueryResolver } from 'server/src/public/subscriptions/user_live_query.ts';
import { markThreadUnseenFromExternalMessageIDResolver } from 'server/src/public/mutations/mark_thread_unseen_from_external_message_id.ts';
import { messageContentSearchResolver } from 'server/src/public/queries/message_content_search.ts';
import { threadsAtLocationQueryResolver } from 'server/src/public/queries/threads_at_location.ts';
import { messageScreenshotAttachmentResolver } from 'server/src/schema/message_screenshot_attachment.ts';
import { threadCreatedResolver } from 'server/src/schema/thread_created.ts';
import { hideLinkPreviewResolver } from 'server/src/public/mutations/hide_link_preview.ts';
import { createThreadResolver } from 'server/src/public/mutations/create_thread.ts';
import { pageThreadReplyAddedResolver } from 'server/src/schema/page_thread_reply_added.ts';
import { clearNotificationsForMessageMutation } from 'server/src/public/mutations/clear_notifications_for_message.ts';
import {
  orgMemberEventTypeResolver,
  orgMembersUpdatedSubscriptionResolver,
} from 'server/src/public/subscriptions/org_members_updated.ts';
import { orgMemberAddedResolver } from 'server/src/schema/org_member_added.ts';
import { orgMemberRemovedResolver } from 'server/src/schema/org_member_removed.ts';
import { orgMembersByExtIDPaginatedResolver } from 'server/src/public/queries/org_members_by_ext_id_paginated.ts';
import { organizationByExternalIDQueryResolver } from 'server/src/public/queries/organization_by_external_id.ts';
import { SlackConnectedLiveQueryResolver } from 'server/src/public/subscriptions/slack_connected.ts';
import { threadSubscriberUpdatedResolver } from 'server/src/schema/thread_subscriber_updated.ts';
import { customerResolver } from 'server/src/schema/customer.ts';
import { presenceLiveQueryResolver } from 'server/src/public/subscriptions/presence_live_query.ts';
import { markThreadsSeenResolver } from 'server/src/public/mutations/mark_threads_seen.ts';
import { threadFilterablePropertiesMatchResolver } from 'server/src/schema/thread_filterable_properties_match.ts';
import { threadFilterablePropertiesUnmatchResolver } from 'server/src/schema/thread_filterable_properties_unmatch.ts';
import Schema from 'server/src/public/schema.graphql';
import { viewerIdentityQueryResolver } from 'server/src/public/queries/viewer_identity.ts';
import { threadDeletedResolver } from 'server/src/schema/thread_deleted.ts';
import { pageThreadDeletedResolver } from 'server/src/schema/page_thread_deleted.ts';

// Resolvers, resolvers everywhere!
// When you create a new Graphql object type OR new
// query/mutation/subscription, then you will need to update this allResolvers
// object. The typechecker should remind you to do this.
//
// Some fields such as `DocumentLocation: {}` (see below) are set to an empty
// object. That just means that all fields of this object exist and no resolver
// is needed for it.

// In exceptional circumstances we can block a user from making any graphQL queries
// by targeting them in the user_is_blocked flag in LaunchDarkly.  We would only
// do this in an emergency, e.g. if one user is causing an excessive load on the
// servers and we fear that the whole service may go down
function checkIfUserIsBlocked<
  T extends Resolvers['Query'] | Resolvers['Mutation'],
>(query: T): T {
  let key: keyof T;
  for (key in query) {
    const originalResolver = query[key];

    query[key] = (async (parent: any, args: any, context: RequestContext) => {
      // only rate limit logged in users
      const [blocked, rateLimited] = await Promise.all([
        getTypedFeatureFlagValue(
          FeatureFlags.USER_IS_BLOCKED,
          flagsUserFromContext(context),
        ),
        shouldRateLimit(context),
      ]);

      if (blocked === true) {
        throw new Error(Errors.USER_IS_BLOCKED);
      }
      if (rateLimited) {
        throw new Error(Errors.RATE_LIMITED);
      }
      return (originalResolver as any)(parent, args, context);
    }) as any;
  }

  return query;
}

export const allResolvers: Resolvers = {
  // custom scalars
  DateTime: GraphQLDateTime,
  ElementIdentifierVersion: ElementIdentifierVersionScalarType,
  SimpleValue: SimpleValueScalarType,
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Context: ContextScalarType,
  Metadata: MetadataScalarType,
  MessageContent: MessageContentScalarType,
  SimpleTranslationParameters: SimpleTranslationParametersScalarType,
  RuleProvider: RuleProviderScalarType,
  UUID: GraphQLUUID,
  JsonObjectReducerData: JsonObjectReducerDataScalarType,

  Query: checkIfUserIsBlocked({
    viewer: viewerQueryResolver,
    organization: organizationQueryResolver,
    organizationByExternalID: organizationByExternalIDQueryResolver,
    messageByExternalID: messageByExternalIDQueryResolver,
    task: taskQueryResolver,
    users: usersQueryResolver,
    usersByExternalID: usersByExternalIDQueryResolver,
    providers: providersQueryResolver,
    ping: pingQueryResolver,
    thread: threadQueryResolver,
    threadByExternalID2: threadByExternalID2QueryResolver,
    threadsAtLocation: threadsAtLocationQueryResolver,
    application: applicationQueryResolver,
    featureFlags: featureFlagsQueryResolver,
    annotationsOnPage: annotationsOnPageQueryResolver,
    notifications: notificationsResolver,
    activity: activityQueryResolver,
    notificationSummary: notificationSummaryQueryResolver,
    notificationByExternalID: notificationByExternalIDResolver,
    messageContentSearch: messageContentSearchResolver,
    orgMembersByExternalIDPaginated: orgMembersByExtIDPaginatedResolver,
    viewerIdentity: viewerIdentityQueryResolver,
  }),
  Mutation: checkIfUserIsBlocked({
    logEvents: logEventsMutationResolver,
    logDeprecation: logDeprecationMutationResolver,
    createThreadMessage: createThreadMessageResolver,
    createMessageByExternalID: createMessageByExternalIDResolver,
    updateMessage: updateMessageResolver,
    updateMessageByExternalID: updateMessageByExternalIDResolver,
    updateThreadByExternalID: updateThreadByExternalIDResolver,
    createFile: createFileMutationResolver,
    refreshFileUploadURL: refreshFileUploadURLMutationResolver,
    setTyping: setTypingMutationResolver,
    setPresentContext: setPresentContextMutationResolver,
    markThreadSeen: markThreadSeenMutation,
    markThreadsSeen: markThreadsSeenResolver,
    clearNotificationsForMessage: clearNotificationsForMessageMutation,
    createMessageReaction: createMessageReactionResolver,
    deleteMessageReaction: deleteMessageReactionMutationResolver,
    addThreadToSlackChannel: addThreadToSelectedSlackChannelResolver,
    setPreference: setPreferenceMutationResolver,
    setFileUploadStatus: setFileUploadStatusMutationResolver,
    setSubscribed: setSubscribedMutationResolver,
    setSubscribedByExternalID: setSubscribedByExternalIDMutationResolver,
    disconnectThirdParty: disconnectThirdPartyMutationResolver,
    setDeepLinkThreadID: setDeepLinkThreadIDMutationResolver,
    clearDeepLinkThreadID: clearDeepLinkThreadIDMutationResolver,
    setThreadResolved: setThreadResolvedResolver,
    unlinkOrgs: unlinkOrgsMutationResolver,
    setAnnotationVisible: setAnnotationVisibleMutationResolver,
    resetUserHiddenAnnotations: resetUserHiddenAnnotationsResolver,
    shareThreadToEmail: shareThreadToEmailResolver,
    sendSampleWelcomeMessage: sendSampleWelcomeMessageResolver,
    markNotificationAsRead: markNotificationAsReadResolver,
    markNotificationAsUnread: markNotificationAsUnreadResolver,
    markAllNotificationsAsRead: markAllNotificationsAsReadResolver,
    deleteNotification: deleteNotificationResolver,
    setThreadName: setThreadNameResolver,
    setThreadMetadata: setThreadMetadataResolver,
    markThreadUnseenFromExternalMessageID:
      markThreadUnseenFromExternalMessageIDResolver,
    hideLinkPreview: hideLinkPreviewResolver,
    createThread: createThreadResolver,
  }),
  Subscription: {
    threadEvents: threadEventsSubscriptionResolver,
    inbox: inboxSubscriptionResolver,
    viewerIdentityLiveQuery: viewerIdentityLiveQueryResolver,
    presenceLiveQuery: presenceLiveQueryResolver,
    userLiveQuery: userLiveQueryResolver,
    pageEventsWithLocation: pageEventsWithLocationSubscriptionResolver,
    preferencesLiveQuery: preferencesLiveQuerySubscriptionResolver,
    annotationsOnPageUpdated: annotationsOnPageUpdatedSubscriptionResolver,
    threadActivitySummary: threadActivitySummarySubscriptionResolver,
    notificationEvents: notificationEventsSubscriptionResolver,
    notificationSummaryUpdated: notificationSummaryUpdatedSubscriptionResolver,
    orgMembersByExternalIDUpdated: orgMembersUpdatedSubscriptionResolver,
    slackConnectedLiveQuery: SlackConnectedLiveQueryResolver,
  },
  PaginationInfo: {},
  AnnotationsOnPage: {},
  Message: messageResolver,
  MessageFileAttachment: messageFileAttachmentResolver,
  File: fileResolver,
  MessageAnnotationAttachment: messageAnnotationAttachmentResolver,
  MessageScreenshotAttachment: messageScreenshotAttachmentResolver,
  DocumentLocation: {},
  LocationTextConfig: {},
  HighlightedTextConfig: {},
  MultimediaConfig: {},
  ElementIdentifier: {},
  AdditionalTargetData: {},
  MonacoEditor: {},
  ReactTree: {},
  KonvaCanvas: {},
  Point2D: {},
  Thread: threadResolver,
  MaybeThread: {},
  LoadMessagesResult: loadMessagesResultResolver,
  ThreadParticipant: threadParticipantResolver,
  User: userResolver,
  UserWithOrgDetails: userWithOrgDetailsResolver,
  Providers: {},
  HeimdallSwitch: heimdallSwitchResolver,
  ProviderFull: providerFullResolver,
  ProviderRule: providerRuleResolver,
  ProviderDocumentMutator: providerDocumentMutatorResolver,
  ProviderRuleTest: providerRuleTestResolver,
  ProviderRuleTestResult: {},
  PageContext: {},
  PageVisitor: pageVisitorResolver,
  S3BucketVisible: s3BucketVisibleResolver,
  Application: applicationResolver,
  Customer: customerResolver,
  ConsoleUser: consoleUserResolver,
  MessageReaction: messageReactionResolver,
  Task: taskResolver,
  Todo: {},
  TaskThirdPartyReference: taskThirdPartyReferenceResolver,
  Viewer: viewerResolver,
  ViewerIdentity: viewerIdentityResolver,
  PresenceLiveQueryData: {},
  UserLiveQueryData: {},
  Organization: orgResolver,
  SlackChannelSchema: {},
  Inbox: inboxResolver,
  ThirdPartyConnection: thirdPartyConnectionResolver,
  CreateFileResult: {},
  SuccessResult: {},
  FailureDetails: {},
  IDResult: {},
  ThreadCreated: threadCreatedResolver,
  ThreadDeleted: threadDeletedResolver,
  ThreadMessageAdded: threadMessageAddedResolver,
  ThreadMessageUpdated: threadMessageUpdatedResolver,
  ThreadMessageContentAppended: threadMessageContentAppendedResolver,
  ThreadMessageRemoved: threadMessageRemovedResolver,
  ThreadParticipantsUpdatedIncremental:
    threadParticipantUpdatedIncrementalResolver,
  ThreadTypingUsersUpdated: threadTypingUsersUpdatedResolver,
  ThreadPropertiesUpdated: threadPropertiesUpdatedResolver,
  EphemeralLocation: {},
  DurableLocation: {},
  UserLocation: {},
  PageThreadAdded: pageThreadAddedResolver,
  PageThreadDeleted: pageThreadDeletedResolver,
  PageThreadReplyAdded: pageThreadReplyAddedResolver,
  PageVisitorsUpdated: pageVisitorUpdatedResolver,
  MessageAttachment: messageAttachmentTypeResolver,
  MessageSource: messageSourceTypeResolver,
  ThreadEvent: threadEventTypeResolver,
  PageEvent: pageEventTypeResolver,
  ApplicationEmailTemplate: {},
  ApplicationColors: {},
  ApplicationLinks: {},
  ApplicationSupportBotInfo: {},
  ApplicationDeploymentInfo: applicationDeploymentInfoResolver,
  ComputedCustomLinks: {},
  PublicApplication: {},
  PageThreadResolved: pageThreadResolvedResolver,
  PageThreadUnresolved: pageThreadUnresolvedResolver,
  ThreadFilterablePropertiesMatch: threadFilterablePropertiesMatchResolver,
  ThreadFilterablePropertiesUnmatch: threadFilterablePropertiesUnmatchResolver,
  ReferencedUserData: {},
  LinkedOrganization: linkedOrgResolver,
  SlackMirroredThreadInfo: {},
  FeatureFlag: {},
  ApplicationNUX: {},
  CustomNUXStepContent: {},
  ThreadShareToSlack: threadShareToSlackResolver,
  DeepLinkInfo: {},
  AdminChatUser: adminChatUserResolver,
  Notification: {},
  NotificationAttachment: notificationAttachmentResolver,
  NotificationMessageAttachment: {},
  NotificationURLAttachment: {},
  NotificationThreadAttachment: {},
  NotificationSender: notificationSenderResolver,
  NotificationPage: {},
  NotificationHeaderTextNode: {},
  NotificationHeaderUserNode: {},
  NotificationHeaderNode: notificationHeaderNodeResolver,
  NotificationEvent: notificationEventTypeResolver,
  NotificationAdded: notificationAddedResolver,
  NotificationReadStateUpdated: notificationReadStateUpdatedResolver,
  NotificationDeleted: notificationDeletedResolver,
  NotificationSummary: notificationSummaryResolver,
  AdminGoRedirect: {},
  Activity: activityResolver,
  ThreadActivitySummary: {},
  TestToken: {},
  CustomerIssue: customerIssueResolver,
  CustomerIssueChange: customerIssueChangeResolver,
  CustomerIssueUpdate: {},
  LogoConfigType: {},
  PageThreadsResult: {},
  MessageLinkPreview: {},
  OrgMemberEvent: orgMemberEventTypeResolver,
  OrgMemberAdded: orgMemberAddedResolver,
  OrgMemberRemoved: orgMemberRemovedResolver,
  OrgMembersResult: {},
  SlackConnectedResult: {},
  ThreadSubscriberUpdated: threadSubscriberUpdatedResolver,
  Addon: {},
  StripeSubscription: {},
  ApplicationConsoleSetupInfo: {},
};

// adds index signature to objects. Numbers,strings, lists are unaffected
export type withIndexSignature<T> = T extends { [key: string]: unknown }
  ? {
      [Key in keyof T]: withIndexSignature<T[Key]>;
    } & { [anyKey: string]: any }
  : T;

// apollo wants objects to have index signature, massage the type of
// allResolvers to please apollo
const apolloResolvers: withIndexSignature<typeof allResolvers> = allResolvers;

export const graphQLSchema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: apolloResolvers,
});
