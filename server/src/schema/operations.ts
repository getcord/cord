// @generated
// to regenerate, run "npm run codegen"
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { DocumentNode, ExecutionResult } from 'graphql';
import { execute, subscribe } from 'graphql';
import type { Maybe } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { graphQLSchema } from 'server/src/schema/resolvers.ts';

async function executeGraphQL<
  TResult,
  TVariables extends Maybe<{ [key: string]: any }>,
>(
  document: DocumentNode,
  context: RequestContext,
  variables?: TVariables,
): Promise<TResult> {
  return extractResult(
    (await execute({
      schema: graphQLSchema,
      document,
      contextValue: context,
      variableValues: variables,
    })) as ExecutionResult<TResult>,
  );
}

async function subscribeGraphQL<
  TResult,
  TVariables extends Maybe<{ [key: string]: any }>,
>(
  document: DocumentNode,
  context: RequestContext,
  variables?: TVariables,
): Promise<AsyncIterableIterator<ExecutionResult<TResult>>> {
  const result = (await subscribe({
    schema: graphQLSchema,
    document,
    contextValue: context,
    variableValues: variables,
  })) as
    | ExecutionResult<TResult>
    | AsyncIterableIterator<ExecutionResult<TResult>>;
  if (!(Symbol.asyncIterator in result)) {
    // subscribe only returns an ExecutionResult on an error, so extractResult()
    // will never return, but TS doesn't know that.
    extractResult(result);
    throw new Error('Unknown GraphQL error');
  }
  return result;
}

export function extractResult<TResult>(
  result: ExecutionResult<TResult>,
): TResult {
  if (!result.data) {
    if (result.errors?.[0]?.originalError) {
      throw result.errors[0].originalError;
    }
    throw new Error(result.errors?.[0]?.message ?? 'Unknown GraphQL error');
  }
  return result.data;
}

import type {
  DateTime,
  ElementIdentifierVersion,
  SimpleValue,
  JSON,
  JSONObject,
  Context,
  Metadata,
  SimpleTranslationParameters,
  MessageContent,
  UUID,
  JsonObjectReducerData,
  FileUploadStatus,
  ViewerThreadFilter,
  ThreadFilterInput,
  SortBy,
  SortDirection,
  LocationFilter,
  ThreadSortInput,
  NotificationFilterInput,
  UserFilterInput,
  MarkThreadsSeenInput,
  TargetType,
  PresenceLiveQueryInput,
  CustomerType,
  CustomerImplementationStage,
  PricingTier,
  BillingType,
  BillingStatus,
  StripeSubscriptionRecurrence,
  ApplicationTierType,
  ApplicationEnvironment,
  OrgMemberState,
  UserType,
  ThirdPartyConnectionType,
  SlackStateLinkingType,
  ImportedSlackMessageType,
  MessageType,
  PageContextInput,
  OrganizationState,
  LogEventInput,
  LogLevelType,
  FileAttachmentInput,
  Point2DInput,
  AnnotationAttachmentInput,
  ScreenshotAttachmentInput,
  DocumentLocationInput,
  AdditionalTargetDataInput,
  MonacoEditorInput,
  ReactTreeInput,
  KonvaCanvasInput,
  MultimediaConfigInput,
  HighlightedTextConfigInput,
  LocationTextConfigInput,
  ElementIdentifierInput,
  TaskInput,
  TaskTodoInput,
  TaskDoneStatusUpdate,
  TaskInputType,
  CreateThreadMessageInput,
  CreateMessageByExternalIDInput,
  UpdateMessageByExternalIDInput,
  CreateThreadInput,
  ThreadOptionsInput,
  ThreadByExternalID2Input,
  FileUploadStatusEnumType,
  LogoConfigInput,
  NotificationReadStatus,
  AdminGoRedirectInputType,
  AdminCRTComingFrom,
  AdminCRTDecision,
  AdminCRTCommunicationStatus,
  AdminCRTIssueType,
  AdminCRTPriority,
  AdminCRTNextAction,
  SearchLocationOptions,
  TimestampRange,
  SearchSortByOptions,
  SearchSortInput,
  CustomNUXStepContentFragment,
  FileFragment,
  HighlightedTextConfigFragment,
  InboxThreadFragment,
  InboxThreadFragment2Fragment,
  MessageAnnotationAttachmentFragment,
  MessageFileAttachmentFragment,
  MessageFragment,
  MessageLinkPreviewFragment,
  MessageReactionFragment,
  MessageScreenshotAttachmentFragment,
  NotificationsMessageFragment,
  NotificationsNodeFragment,
  OrganizationFragment,
  PageVisitorFragment,
  TaskFragment,
  ThreadActivitySummaryFragment,
  ThreadByExternalIDFragment,
  ThreadFragment,
  ThreadFragmentBaseFragment,
  ThreadParticipantFragment,
  UserFragment,
  ViewerIdentityFragment,
  AccessTokenQueryResult,
  AccessTokenQueryVariables,
  ActivityQueryResult,
  ActivityQueryVariables,
  AddThreadToSlackChannelMutationResult,
  AddThreadToSlackChannelMutationVariables,
  AnnotationsOnPageQueryResult,
  AnnotationsOnPageQueryVariables,
  AnnotationsOnPageSubscriptionResult,
  AnnotationsOnPageSubscriptionVariables,
  ApplicationSpecificationsQueryResult,
  AutocompleteQueryResult,
  AutocompleteQueryVariables,
  BootstrapQueryResult,
  BootstrapQueryVariables,
  CanEditExternalTaskQueryResult,
  CanEditExternalTaskQueryVariables,
  ClearDeepLinkThreadIDMutationResult,
  ConversationThreadsQueryResult,
  ConversationThreadsQueryVariables,
  CreateFileMutationResult,
  CreateFileMutationVariables,
  CreateMessageByExternalIDMutationResult,
  CreateMessageByExternalIDMutationVariables,
  CreateMessageReactionMutationResult,
  CreateMessageReactionMutationVariables,
  CreateThreadMutationResult,
  CreateThreadMutationVariables,
  CreateThreadMessageMutationResult,
  CreateThreadMessageMutationVariables,
  DeepLinkThreadIDQueryResult,
  DeleteMessageReactionMutationResult,
  DeleteMessageReactionMutationVariables,
  DeleteNotificationMutationResult,
  DeleteNotificationMutationVariables,
  DisconnectThirdPartyMutationResult,
  DisconnectThirdPartyMutationVariables,
  FeatureFlagsQueryResult,
  FeatureFlagsQueryVariables,
  HideLinkPreviewMutationResult,
  HideLinkPreviewMutationVariables,
  InboxCountQueryResult,
  InboxQueryResult,
  InboxSubscriptionResult,
  LoadMessagesToDeepLinkedMessageQueryResult,
  LoadMessagesToDeepLinkedMessageQueryVariables,
  LogDeprecationMutationResult,
  LogDeprecationMutationVariables,
  LogEventsMutationResult,
  LogEventsMutationVariables,
  MarkAllNotificationsAsReadMutationResult,
  MarkAllNotificationsAsReadMutationVariables,
  ClearNotificationsForMessageMutationResult,
  ClearNotificationsForMessageMutationVariables,
  MarkNotificationAsReadMutationResult,
  MarkNotificationAsReadMutationVariables,
  MarkNotificationAsUnreadMutationResult,
  MarkNotificationAsUnreadMutationVariables,
  MarkThreadSeenMutationResult,
  MarkThreadSeenMutationVariables,
  MarkThreadsSeenMutationResult,
  MarkThreadsSeenMutationVariables,
  MessageByExternalIDQueryResult,
  MessageByExternalIDQueryVariables,
  MessageByExternalIDWithThreadQueryResult,
  MessageByExternalIDWithThreadQueryVariables,
  MessageContentSearchQueryResult,
  MessageContentSearchQueryVariables,
  NotificationByExternalIDQueryResult,
  NotificationByExternalIDQueryVariables,
  NotificationSummaryQueryResult,
  NotificationSummaryQueryVariables,
  NotificationSummarySubscriptionResult,
  NotificationSummarySubscriptionVariables,
  NotificationsQueryResult,
  NotificationsQueryVariables,
  NotificationEventsSubscriptionResult,
  NotificationEventsSubscriptionVariables,
  OlderThreadMessagesQueryResult,
  OlderThreadMessagesQueryVariables,
  OrgMembersByExtIDPaginatedQueryResult,
  OrgMembersByExtIDPaginatedQueryVariables,
  OrgMembersUpdatedSubscriptionResult,
  OrgMembersUpdatedSubscriptionVariables,
  PingQueryResult,
  PreferencesSubscriptionResult,
  PresenceLiveQuerySubscriptionResult,
  PresenceLiveQuerySubscriptionVariables,
  RefreshFileUploadURLMutationResult,
  RefreshFileUploadURLMutationVariables,
  ResetUserHiddenAnnotationsMutationResult,
  SendSampleWelcomeMessageMutationResult,
  SendSampleWelcomeMessageMutationVariables,
  SetAnnotationVisibleMutationResult,
  SetAnnotationVisibleMutationVariables,
  SetDeepLinkThreadIDMutationResult,
  SetDeepLinkThreadIDMutationVariables,
  SetFileUploadStatusMutationResult,
  SetFileUploadStatusMutationVariables,
  SetPreferenceMutationResult,
  SetPreferenceMutationVariables,
  SetPresentContextMutationResult,
  SetPresentContextMutationVariables,
  SetSubscribedByExternalIDMutationResult,
  SetSubscribedByExternalIDMutationVariables,
  SetSubscribedMutationResult,
  SetSubscribedMutationVariables,
  SetThreadMetadataMutationResult,
  SetThreadMetadataMutationVariables,
  SetThreadNameMutationResult,
  SetThreadNameMutationVariables,
  SetThreadResolvedMutationResult,
  SetThreadResolvedMutationVariables,
  SetTypingMutationResult,
  SetTypingMutationVariables,
  ShareThreadToEmailMutationResult,
  ShareThreadToEmailMutationVariables,
  SlackChannelsQueryResult,
  SlackChannelsQueryVariables,
  SlackConnectedLiveQuerySubscriptionResult,
  SlackConnectedLiveQuerySubscriptionVariables,
  ThirdPartyConnectionConfigurationQueryResult,
  ThirdPartyConnectionConfigurationQueryVariables,
  ThirdPartyConnectionsQueryResult,
  ThirdPartyConnectionsQueryVariables,
  Thread2QueryResult,
  Thread2QueryVariables,
  ThreadActivityQueryResult,
  ThreadActivityQueryVariables,
  ThreadActivitySummarySubscriptionResult,
  ThreadActivitySummarySubscriptionVariables,
  ThreadByExternalID2QueryResult,
  ThreadByExternalID2QueryVariables,
  ThreadEventsSubscriptionResult,
  ThreadEventsSubscriptionVariables,
  ThreadListEventsWithLocationSubscriptionResult,
  ThreadListEventsWithLocationSubscriptionVariables,
  ThreadListQueryResult,
  ThreadListQueryVariables,
  UnlinkOrgMutationResult,
  UnlinkOrgMutationVariables,
  UnreadMessageCountQueryResult,
  UnreadMessageCountQueryVariables,
  UpdateMessageByExternalIDMutationResult,
  UpdateMessageByExternalIDMutationVariables,
  UpdateMessageMutationResult,
  UpdateMessageMutationVariables,
  UpdateThreadByExternalIDMutationResult,
  UpdateThreadByExternalIDMutationVariables,
  UserLiveQuerySubscriptionResult,
  UserLiveQuerySubscriptionVariables,
  UsersByExternalIDQueryResult,
  UsersByExternalIDQueryVariables,
  UsersQueryResult,
  UsersQueryVariables,
  ViewerIdentityLiveQuerySubscriptionResult,
  ViewerIdentityLiveQuerySubscriptionVariables,
  ViewerIdentityQueryResult,
  ViewerIdentityQueryVariables,
} from 'common/graphql/types.ts';
export type {
  DateTime,
  ElementIdentifierVersion,
  SimpleValue,
  JSON,
  JSONObject,
  Context,
  Metadata,
  SimpleTranslationParameters,
  MessageContent,
  UUID,
  JsonObjectReducerData,
  FileUploadStatus,
  ViewerThreadFilter,
  ThreadFilterInput,
  SortBy,
  SortDirection,
  LocationFilter,
  ThreadSortInput,
  NotificationFilterInput,
  UserFilterInput,
  MarkThreadsSeenInput,
  TargetType,
  PresenceLiveQueryInput,
  CustomerType,
  CustomerImplementationStage,
  PricingTier,
  BillingType,
  BillingStatus,
  StripeSubscriptionRecurrence,
  ApplicationTierType,
  ApplicationEnvironment,
  OrgMemberState,
  UserType,
  ThirdPartyConnectionType,
  SlackStateLinkingType,
  ImportedSlackMessageType,
  MessageType,
  PageContextInput,
  OrganizationState,
  LogEventInput,
  LogLevelType,
  FileAttachmentInput,
  Point2DInput,
  AnnotationAttachmentInput,
  ScreenshotAttachmentInput,
  DocumentLocationInput,
  AdditionalTargetDataInput,
  MonacoEditorInput,
  ReactTreeInput,
  KonvaCanvasInput,
  MultimediaConfigInput,
  HighlightedTextConfigInput,
  LocationTextConfigInput,
  ElementIdentifierInput,
  TaskInput,
  TaskTodoInput,
  TaskDoneStatusUpdate,
  TaskInputType,
  CreateThreadMessageInput,
  CreateMessageByExternalIDInput,
  UpdateMessageByExternalIDInput,
  CreateThreadInput,
  ThreadOptionsInput,
  ThreadByExternalID2Input,
  FileUploadStatusEnumType,
  LogoConfigInput,
  NotificationReadStatus,
  AdminGoRedirectInputType,
  AdminCRTComingFrom,
  AdminCRTDecision,
  AdminCRTCommunicationStatus,
  AdminCRTIssueType,
  AdminCRTPriority,
  AdminCRTNextAction,
  SearchLocationOptions,
  TimestampRange,
  SearchSortByOptions,
  SearchSortInput,
  CustomNUXStepContentFragment,
  FileFragment,
  HighlightedTextConfigFragment,
  InboxThreadFragment,
  InboxThreadFragment2Fragment,
  MessageAnnotationAttachmentFragment,
  MessageFileAttachmentFragment,
  MessageFragment,
  MessageLinkPreviewFragment,
  MessageReactionFragment,
  MessageScreenshotAttachmentFragment,
  NotificationsMessageFragment,
  NotificationsNodeFragment,
  OrganizationFragment,
  PageVisitorFragment,
  TaskFragment,
  ThreadActivitySummaryFragment,
  ThreadByExternalIDFragment,
  ThreadFragment,
  ThreadFragmentBaseFragment,
  ThreadParticipantFragment,
  UserFragment,
  ViewerIdentityFragment,
  AccessTokenQueryResult,
  AccessTokenQueryVariables,
  ActivityQueryResult,
  ActivityQueryVariables,
  AddThreadToSlackChannelMutationResult,
  AddThreadToSlackChannelMutationVariables,
  AnnotationsOnPageQueryResult,
  AnnotationsOnPageQueryVariables,
  AnnotationsOnPageSubscriptionResult,
  AnnotationsOnPageSubscriptionVariables,
  ApplicationSpecificationsQueryResult,
  AutocompleteQueryResult,
  AutocompleteQueryVariables,
  BootstrapQueryResult,
  BootstrapQueryVariables,
  CanEditExternalTaskQueryResult,
  CanEditExternalTaskQueryVariables,
  ClearDeepLinkThreadIDMutationResult,
  ConversationThreadsQueryResult,
  ConversationThreadsQueryVariables,
  CreateFileMutationResult,
  CreateFileMutationVariables,
  CreateMessageByExternalIDMutationResult,
  CreateMessageByExternalIDMutationVariables,
  CreateMessageReactionMutationResult,
  CreateMessageReactionMutationVariables,
  CreateThreadMutationResult,
  CreateThreadMutationVariables,
  CreateThreadMessageMutationResult,
  CreateThreadMessageMutationVariables,
  DeepLinkThreadIDQueryResult,
  DeleteMessageReactionMutationResult,
  DeleteMessageReactionMutationVariables,
  DeleteNotificationMutationResult,
  DeleteNotificationMutationVariables,
  DisconnectThirdPartyMutationResult,
  DisconnectThirdPartyMutationVariables,
  FeatureFlagsQueryResult,
  FeatureFlagsQueryVariables,
  HideLinkPreviewMutationResult,
  HideLinkPreviewMutationVariables,
  InboxCountQueryResult,
  InboxQueryResult,
  InboxSubscriptionResult,
  LoadMessagesToDeepLinkedMessageQueryResult,
  LoadMessagesToDeepLinkedMessageQueryVariables,
  LogDeprecationMutationResult,
  LogDeprecationMutationVariables,
  LogEventsMutationResult,
  LogEventsMutationVariables,
  MarkAllNotificationsAsReadMutationResult,
  MarkAllNotificationsAsReadMutationVariables,
  ClearNotificationsForMessageMutationResult,
  ClearNotificationsForMessageMutationVariables,
  MarkNotificationAsReadMutationResult,
  MarkNotificationAsReadMutationVariables,
  MarkNotificationAsUnreadMutationResult,
  MarkNotificationAsUnreadMutationVariables,
  MarkThreadSeenMutationResult,
  MarkThreadSeenMutationVariables,
  MarkThreadsSeenMutationResult,
  MarkThreadsSeenMutationVariables,
  MessageByExternalIDQueryResult,
  MessageByExternalIDQueryVariables,
  MessageByExternalIDWithThreadQueryResult,
  MessageByExternalIDWithThreadQueryVariables,
  MessageContentSearchQueryResult,
  MessageContentSearchQueryVariables,
  NotificationByExternalIDQueryResult,
  NotificationByExternalIDQueryVariables,
  NotificationSummaryQueryResult,
  NotificationSummaryQueryVariables,
  NotificationSummarySubscriptionResult,
  NotificationSummarySubscriptionVariables,
  NotificationsQueryResult,
  NotificationsQueryVariables,
  NotificationEventsSubscriptionResult,
  NotificationEventsSubscriptionVariables,
  OlderThreadMessagesQueryResult,
  OlderThreadMessagesQueryVariables,
  OrgMembersByExtIDPaginatedQueryResult,
  OrgMembersByExtIDPaginatedQueryVariables,
  OrgMembersUpdatedSubscriptionResult,
  OrgMembersUpdatedSubscriptionVariables,
  PingQueryResult,
  PreferencesSubscriptionResult,
  PresenceLiveQuerySubscriptionResult,
  PresenceLiveQuerySubscriptionVariables,
  RefreshFileUploadURLMutationResult,
  RefreshFileUploadURLMutationVariables,
  ResetUserHiddenAnnotationsMutationResult,
  SendSampleWelcomeMessageMutationResult,
  SendSampleWelcomeMessageMutationVariables,
  SetAnnotationVisibleMutationResult,
  SetAnnotationVisibleMutationVariables,
  SetDeepLinkThreadIDMutationResult,
  SetDeepLinkThreadIDMutationVariables,
  SetFileUploadStatusMutationResult,
  SetFileUploadStatusMutationVariables,
  SetPreferenceMutationResult,
  SetPreferenceMutationVariables,
  SetPresentContextMutationResult,
  SetPresentContextMutationVariables,
  SetSubscribedByExternalIDMutationResult,
  SetSubscribedByExternalIDMutationVariables,
  SetSubscribedMutationResult,
  SetSubscribedMutationVariables,
  SetThreadMetadataMutationResult,
  SetThreadMetadataMutationVariables,
  SetThreadNameMutationResult,
  SetThreadNameMutationVariables,
  SetThreadResolvedMutationResult,
  SetThreadResolvedMutationVariables,
  SetTypingMutationResult,
  SetTypingMutationVariables,
  ShareThreadToEmailMutationResult,
  ShareThreadToEmailMutationVariables,
  SlackChannelsQueryResult,
  SlackChannelsQueryVariables,
  SlackConnectedLiveQuerySubscriptionResult,
  SlackConnectedLiveQuerySubscriptionVariables,
  ThirdPartyConnectionConfigurationQueryResult,
  ThirdPartyConnectionConfigurationQueryVariables,
  ThirdPartyConnectionsQueryResult,
  ThirdPartyConnectionsQueryVariables,
  Thread2QueryResult,
  Thread2QueryVariables,
  ThreadActivityQueryResult,
  ThreadActivityQueryVariables,
  ThreadActivitySummarySubscriptionResult,
  ThreadActivitySummarySubscriptionVariables,
  ThreadByExternalID2QueryResult,
  ThreadByExternalID2QueryVariables,
  ThreadEventsSubscriptionResult,
  ThreadEventsSubscriptionVariables,
  ThreadListEventsWithLocationSubscriptionResult,
  ThreadListEventsWithLocationSubscriptionVariables,
  ThreadListQueryResult,
  ThreadListQueryVariables,
  UnlinkOrgMutationResult,
  UnlinkOrgMutationVariables,
  UnreadMessageCountQueryResult,
  UnreadMessageCountQueryVariables,
  UpdateMessageByExternalIDMutationResult,
  UpdateMessageByExternalIDMutationVariables,
  UpdateMessageMutationResult,
  UpdateMessageMutationVariables,
  UpdateThreadByExternalIDMutationResult,
  UpdateThreadByExternalIDMutationVariables,
  UserLiveQuerySubscriptionResult,
  UserLiveQuerySubscriptionVariables,
  UsersByExternalIDQueryResult,
  UsersByExternalIDQueryVariables,
  UsersQueryResult,
  UsersQueryVariables,
  ViewerIdentityLiveQuerySubscriptionResult,
  ViewerIdentityLiveQuerySubscriptionVariables,
  ViewerIdentityQueryResult,
  ViewerIdentityQueryVariables,
};

// eslint-disable-next-line import/no-restricted-paths
import { default as AccessTokenQuery } from 'external/src/graphql/AccessTokenQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ActivityQuery } from 'external/src/graphql/ActivityQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as AnnotationsOnPageQuery } from 'external/src/graphql/AnnotationsOnPageQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as AnnotationsOnPageSubscription } from 'external/src/graphql/AnnotationsOnPageSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ApplicationSpecificationsQuery } from 'external/src/graphql/ApplicationSpecificationsQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as AutocompleteQuery } from 'external/src/graphql/AutocompleteQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as BootstrapQuery } from 'external/src/graphql/BootstrapQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as CanEditExternalTaskQuery } from 'external/src/graphql/CanEditExternalTaskQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ConversationThreadsQuery } from 'external/src/graphql/ConversationThreadsQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as DeepLinkThreadIDQuery } from 'external/src/graphql/DeepLinkThreadIDQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as FeatureFlagsQuery } from 'external/src/graphql/FeatureFlagsQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as InboxCountQuery } from 'external/src/graphql/InboxCountQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as InboxQuery } from 'external/src/graphql/InboxQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as InboxSubscription } from 'external/src/graphql/InboxSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as LoadMessagesToDeepLinkedMessageQuery } from 'external/src/graphql/LoadMessagesToDeepLinkedMessage.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as MessageByExternalIDQuery } from 'external/src/graphql/MessageByExternalIDQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as MessageByExternalIDWithThreadQuery } from 'external/src/graphql/MessageByExternalIDWithThread.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as MessageContentSearchQuery } from 'external/src/graphql/MessageContentSearchQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as NotificationByExternalIDQuery } from 'external/src/graphql/NotificationByExternalIDQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as NotificationSummaryQuery } from 'external/src/graphql/NotificationSummaryQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as NotificationSummarySubscription } from 'external/src/graphql/NotificationSummarySubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as NotificationsQuery } from 'external/src/graphql/NotificationsQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as NotificationEventsSubscription } from 'external/src/graphql/NotificationsSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as OlderThreadMessagesQuery } from 'external/src/graphql/OlderThreadMessagesQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as OrgMembersByExtIDPaginatedQuery } from 'external/src/graphql/OrgMembersByExtIDPaginatedQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as OrgMembersUpdatedSubscription } from 'external/src/graphql/OrgMembersUpdatedSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as PingQuery } from 'external/src/graphql/PingQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as PreferencesSubscription } from 'external/src/graphql/PreferencesSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as PresenceLiveQuerySubscription } from 'external/src/graphql/PresenceLiveQuerySubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as SlackChannelsQuery } from 'external/src/graphql/SlackChannelsQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as SlackConnectedLiveQuerySubscription } from 'external/src/graphql/SlackConnectedSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThirdPartyConnectionConfigurationQuery } from 'external/src/graphql/ThirdPartyConnectionConfigurationQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThirdPartyConnectionsQuery } from 'external/src/graphql/ThirdPartyConnectionsQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as Thread2Query } from 'external/src/graphql/Thread2Query.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThreadActivityQuery } from 'external/src/graphql/ThreadActivityQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThreadActivitySummarySubscription } from 'external/src/graphql/ThreadActivitySubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThreadByExternalID2Query } from 'external/src/graphql/ThreadByExternalID2Query.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThreadEventsSubscription } from 'external/src/graphql/ThreadEventsSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThreadListEventsWithLocationSubscription } from 'external/src/graphql/ThreadListEventsWithLocationSubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ThreadListQuery } from 'external/src/graphql/ThreadListQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as UnreadMessageCountQuery } from 'external/src/graphql/UnreadMessageCountQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as UserLiveQuerySubscription } from 'external/src/graphql/UserLiveQuerySubscription.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as UsersByExternalIDQuery } from 'external/src/graphql/UsersByExternalIDQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as UsersQuery } from 'external/src/graphql/UsersQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ViewerIdentityLiveQuerySubscription } from 'external/src/graphql/ViewerIdentityLiveQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import { default as ViewerIdentityQuery } from 'external/src/graphql/ViewerIdentityQuery.graphql';

export async function executeAccessTokenQuery(options: {
  context: RequestContext;
  variables: AccessTokenQueryVariables;
}) {
  return await executeGraphQL<
    AccessTokenQueryResult,
    AccessTokenQueryVariables
  >(AccessTokenQuery, options.context, options.variables);
}

export async function executeActivityQuery(options: {
  context: RequestContext;
  variables: ActivityQueryVariables;
}) {
  return await executeGraphQL<ActivityQueryResult, ActivityQueryVariables>(
    ActivityQuery,
    options.context,
    options.variables,
  );
}

export async function executeAnnotationsOnPageQuery(options: {
  context: RequestContext;
  variables: AnnotationsOnPageQueryVariables;
}) {
  return await executeGraphQL<
    AnnotationsOnPageQueryResult,
    AnnotationsOnPageQueryVariables
  >(AnnotationsOnPageQuery, options.context, options.variables);
}

export async function subscribeAnnotationsOnPageSubscription(options: {
  context: RequestContext;
  variables: AnnotationsOnPageSubscriptionVariables;
}) {
  return await subscribeGraphQL<
    AnnotationsOnPageSubscriptionResult,
    AnnotationsOnPageSubscriptionVariables
  >(AnnotationsOnPageSubscription, options.context, options.variables);
}

export async function executeApplicationSpecificationsQuery(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await executeGraphQL<
    ApplicationSpecificationsQueryResult,
    Record<string, never>
  >(ApplicationSpecificationsQuery, options.context, options.variables);
}

export async function executeAutocompleteQuery(options: {
  context: RequestContext;
  variables: AutocompleteQueryVariables;
}) {
  return await executeGraphQL<
    AutocompleteQueryResult,
    AutocompleteQueryVariables
  >(AutocompleteQuery, options.context, options.variables);
}

export async function executeBootstrapQuery(options: {
  context: RequestContext;
  variables: BootstrapQueryVariables;
}) {
  return await executeGraphQL<BootstrapQueryResult, BootstrapQueryVariables>(
    BootstrapQuery,
    options.context,
    options.variables,
  );
}

export async function executeCanEditExternalTaskQuery(options: {
  context: RequestContext;
  variables: CanEditExternalTaskQueryVariables;
}) {
  return await executeGraphQL<
    CanEditExternalTaskQueryResult,
    CanEditExternalTaskQueryVariables
  >(CanEditExternalTaskQuery, options.context, options.variables);
}

export async function executeConversationThreadsQuery(options: {
  context: RequestContext;
  variables: ConversationThreadsQueryVariables;
}) {
  return await executeGraphQL<
    ConversationThreadsQueryResult,
    ConversationThreadsQueryVariables
  >(ConversationThreadsQuery, options.context, options.variables);
}

export async function executeDeepLinkThreadIDQuery(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await executeGraphQL<
    DeepLinkThreadIDQueryResult,
    Record<string, never>
  >(DeepLinkThreadIDQuery, options.context, options.variables);
}

export async function executeFeatureFlagsQuery(options: {
  context: RequestContext;
  variables: FeatureFlagsQueryVariables;
}) {
  return await executeGraphQL<
    FeatureFlagsQueryResult,
    FeatureFlagsQueryVariables
  >(FeatureFlagsQuery, options.context, options.variables);
}

export async function executeInboxCountQuery(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await executeGraphQL<InboxCountQueryResult, Record<string, never>>(
    InboxCountQuery,
    options.context,
    options.variables,
  );
}

export async function executeInboxQuery(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await executeGraphQL<InboxQueryResult, Record<string, never>>(
    InboxQuery,
    options.context,
    options.variables,
  );
}

export async function subscribeInboxSubscription(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await subscribeGraphQL<InboxSubscriptionResult, Record<string, never>>(
    InboxSubscription,
    options.context,
    options.variables,
  );
}

export async function executeLoadMessagesToDeepLinkedMessageQuery(options: {
  context: RequestContext;
  variables: LoadMessagesToDeepLinkedMessageQueryVariables;
}) {
  return await executeGraphQL<
    LoadMessagesToDeepLinkedMessageQueryResult,
    LoadMessagesToDeepLinkedMessageQueryVariables
  >(LoadMessagesToDeepLinkedMessageQuery, options.context, options.variables);
}

export async function executeMessageByExternalIDQuery(options: {
  context: RequestContext;
  variables: MessageByExternalIDQueryVariables;
}) {
  return await executeGraphQL<
    MessageByExternalIDQueryResult,
    MessageByExternalIDQueryVariables
  >(MessageByExternalIDQuery, options.context, options.variables);
}

export async function executeMessageByExternalIDWithThreadQuery(options: {
  context: RequestContext;
  variables: MessageByExternalIDWithThreadQueryVariables;
}) {
  return await executeGraphQL<
    MessageByExternalIDWithThreadQueryResult,
    MessageByExternalIDWithThreadQueryVariables
  >(MessageByExternalIDWithThreadQuery, options.context, options.variables);
}

export async function executeMessageContentSearchQuery(options: {
  context: RequestContext;
  variables: MessageContentSearchQueryVariables;
}) {
  return await executeGraphQL<
    MessageContentSearchQueryResult,
    MessageContentSearchQueryVariables
  >(MessageContentSearchQuery, options.context, options.variables);
}

export async function executeNotificationByExternalIDQuery(options: {
  context: RequestContext;
  variables: NotificationByExternalIDQueryVariables;
}) {
  return await executeGraphQL<
    NotificationByExternalIDQueryResult,
    NotificationByExternalIDQueryVariables
  >(NotificationByExternalIDQuery, options.context, options.variables);
}

export async function executeNotificationSummaryQuery(options: {
  context: RequestContext;
  variables: NotificationSummaryQueryVariables;
}) {
  return await executeGraphQL<
    NotificationSummaryQueryResult,
    NotificationSummaryQueryVariables
  >(NotificationSummaryQuery, options.context, options.variables);
}

export async function subscribeNotificationSummarySubscription(options: {
  context: RequestContext;
  variables: NotificationSummarySubscriptionVariables;
}) {
  return await subscribeGraphQL<
    NotificationSummarySubscriptionResult,
    NotificationSummarySubscriptionVariables
  >(NotificationSummarySubscription, options.context, options.variables);
}

export async function executeNotificationsQuery(options: {
  context: RequestContext;
  variables: NotificationsQueryVariables;
}) {
  return await executeGraphQL<
    NotificationsQueryResult,
    NotificationsQueryVariables
  >(NotificationsQuery, options.context, options.variables);
}

export async function subscribeNotificationEventsSubscription(options: {
  context: RequestContext;
  variables: NotificationEventsSubscriptionVariables;
}) {
  return await subscribeGraphQL<
    NotificationEventsSubscriptionResult,
    NotificationEventsSubscriptionVariables
  >(NotificationEventsSubscription, options.context, options.variables);
}

export async function executeOlderThreadMessagesQuery(options: {
  context: RequestContext;
  variables: OlderThreadMessagesQueryVariables;
}) {
  return await executeGraphQL<
    OlderThreadMessagesQueryResult,
    OlderThreadMessagesQueryVariables
  >(OlderThreadMessagesQuery, options.context, options.variables);
}

export async function executeOrgMembersByExtIDPaginatedQuery(options: {
  context: RequestContext;
  variables: OrgMembersByExtIDPaginatedQueryVariables;
}) {
  return await executeGraphQL<
    OrgMembersByExtIDPaginatedQueryResult,
    OrgMembersByExtIDPaginatedQueryVariables
  >(OrgMembersByExtIDPaginatedQuery, options.context, options.variables);
}

export async function subscribeOrgMembersUpdatedSubscription(options: {
  context: RequestContext;
  variables: OrgMembersUpdatedSubscriptionVariables;
}) {
  return await subscribeGraphQL<
    OrgMembersUpdatedSubscriptionResult,
    OrgMembersUpdatedSubscriptionVariables
  >(OrgMembersUpdatedSubscription, options.context, options.variables);
}

export async function executePingQuery(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await executeGraphQL<PingQueryResult, Record<string, never>>(
    PingQuery,
    options.context,
    options.variables,
  );
}

export async function subscribePreferencesSubscription(options: {
  context: RequestContext;
  variables?: Record<string, never>;
}) {
  return await subscribeGraphQL<
    PreferencesSubscriptionResult,
    Record<string, never>
  >(PreferencesSubscription, options.context, options.variables);
}

export async function subscribePresenceLiveQuerySubscription(options: {
  context: RequestContext;
  variables: PresenceLiveQuerySubscriptionVariables;
}) {
  return await subscribeGraphQL<
    PresenceLiveQuerySubscriptionResult,
    PresenceLiveQuerySubscriptionVariables
  >(PresenceLiveQuerySubscription, options.context, options.variables);
}

export async function executeSlackChannelsQuery(options: {
  context: RequestContext;
  variables: SlackChannelsQueryVariables;
}) {
  return await executeGraphQL<
    SlackChannelsQueryResult,
    SlackChannelsQueryVariables
  >(SlackChannelsQuery, options.context, options.variables);
}

export async function subscribeSlackConnectedLiveQuerySubscription(options: {
  context: RequestContext;
  variables: SlackConnectedLiveQuerySubscriptionVariables;
}) {
  return await subscribeGraphQL<
    SlackConnectedLiveQuerySubscriptionResult,
    SlackConnectedLiveQuerySubscriptionVariables
  >(SlackConnectedLiveQuerySubscription, options.context, options.variables);
}

export async function executeThirdPartyConnectionConfigurationQuery(options: {
  context: RequestContext;
  variables: ThirdPartyConnectionConfigurationQueryVariables;
}) {
  return await executeGraphQL<
    ThirdPartyConnectionConfigurationQueryResult,
    ThirdPartyConnectionConfigurationQueryVariables
  >(ThirdPartyConnectionConfigurationQuery, options.context, options.variables);
}

export async function executeThirdPartyConnectionsQuery(options: {
  context: RequestContext;
  variables: ThirdPartyConnectionsQueryVariables;
}) {
  return await executeGraphQL<
    ThirdPartyConnectionsQueryResult,
    ThirdPartyConnectionsQueryVariables
  >(ThirdPartyConnectionsQuery, options.context, options.variables);
}

export async function executeThread2Query(options: {
  context: RequestContext;
  variables: Thread2QueryVariables;
}) {
  return await executeGraphQL<Thread2QueryResult, Thread2QueryVariables>(
    Thread2Query,
    options.context,
    options.variables,
  );
}

export async function executeThreadActivityQuery(options: {
  context: RequestContext;
  variables: ThreadActivityQueryVariables;
}) {
  return await executeGraphQL<
    ThreadActivityQueryResult,
    ThreadActivityQueryVariables
  >(ThreadActivityQuery, options.context, options.variables);
}

export async function subscribeThreadActivitySummarySubscription(options: {
  context: RequestContext;
  variables: ThreadActivitySummarySubscriptionVariables;
}) {
  return await subscribeGraphQL<
    ThreadActivitySummarySubscriptionResult,
    ThreadActivitySummarySubscriptionVariables
  >(ThreadActivitySummarySubscription, options.context, options.variables);
}

export async function executeThreadByExternalID2Query(options: {
  context: RequestContext;
  variables: ThreadByExternalID2QueryVariables;
}) {
  return await executeGraphQL<
    ThreadByExternalID2QueryResult,
    ThreadByExternalID2QueryVariables
  >(ThreadByExternalID2Query, options.context, options.variables);
}

export async function subscribeThreadEventsSubscription(options: {
  context: RequestContext;
  variables: ThreadEventsSubscriptionVariables;
}) {
  return await subscribeGraphQL<
    ThreadEventsSubscriptionResult,
    ThreadEventsSubscriptionVariables
  >(ThreadEventsSubscription, options.context, options.variables);
}

export async function subscribeThreadListEventsWithLocationSubscription(options: {
  context: RequestContext;
  variables: ThreadListEventsWithLocationSubscriptionVariables;
}) {
  return await subscribeGraphQL<
    ThreadListEventsWithLocationSubscriptionResult,
    ThreadListEventsWithLocationSubscriptionVariables
  >(
    ThreadListEventsWithLocationSubscription,
    options.context,
    options.variables,
  );
}

export async function executeThreadListQuery(options: {
  context: RequestContext;
  variables: ThreadListQueryVariables;
}) {
  return await executeGraphQL<ThreadListQueryResult, ThreadListQueryVariables>(
    ThreadListQuery,
    options.context,
    options.variables,
  );
}

export async function executeUnreadMessageCountQuery(options: {
  context: RequestContext;
  variables: UnreadMessageCountQueryVariables;
}) {
  return await executeGraphQL<
    UnreadMessageCountQueryResult,
    UnreadMessageCountQueryVariables
  >(UnreadMessageCountQuery, options.context, options.variables);
}

export async function subscribeUserLiveQuerySubscription(options: {
  context: RequestContext;
  variables: UserLiveQuerySubscriptionVariables;
}) {
  return await subscribeGraphQL<
    UserLiveQuerySubscriptionResult,
    UserLiveQuerySubscriptionVariables
  >(UserLiveQuerySubscription, options.context, options.variables);
}

export async function executeUsersByExternalIDQuery(options: {
  context: RequestContext;
  variables: UsersByExternalIDQueryVariables;
}) {
  return await executeGraphQL<
    UsersByExternalIDQueryResult,
    UsersByExternalIDQueryVariables
  >(UsersByExternalIDQuery, options.context, options.variables);
}

export async function executeUsersQuery(options: {
  context: RequestContext;
  variables: UsersQueryVariables;
}) {
  return await executeGraphQL<UsersQueryResult, UsersQueryVariables>(
    UsersQuery,
    options.context,
    options.variables,
  );
}

export async function subscribeViewerIdentityLiveQuerySubscription(options: {
  context: RequestContext;
  variables: ViewerIdentityLiveQuerySubscriptionVariables;
}) {
  return await subscribeGraphQL<
    ViewerIdentityLiveQuerySubscriptionResult,
    ViewerIdentityLiveQuerySubscriptionVariables
  >(ViewerIdentityLiveQuerySubscription, options.context, options.variables);
}

export async function executeViewerIdentityQuery(options: {
  context: RequestContext;
  variables: ViewerIdentityQueryVariables;
}) {
  return await executeGraphQL<
    ViewerIdentityQueryResult,
    ViewerIdentityQueryVariables
  >(ViewerIdentityQuery, options.context, options.variables);
}
