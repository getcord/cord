// @generated
// to regenerate, run "npm run codegen"
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  useQuery,
  useLazyQuery,
  useMutation,
  // admin does not have any subscriptions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useSubscription,
} from '@apollo/client';
import type { DocumentNode } from 'graphql';
import type {
  QueryHookOptions,
  LazyQueryHookOptions,
  LazyQueryReturnType,
  MutationHookOptions,
  MutationReturnType,
  // admin does not have any subscriptions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SubscriptionHookOptions,
} from 'external/src/graphql/options.ts';

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

import { default as AccessTokenQuery } from 'external/src/graphql/AccessTokenQuery.graphql';
export { AccessTokenQuery };
import { default as ActivityQuery } from 'external/src/graphql/ActivityQuery.graphql';
export { ActivityQuery };
import { default as AddThreadToSlackChannelMutation } from 'external/src/graphql/AddThreadToSlackChannelMutation.graphql';
export { AddThreadToSlackChannelMutation };
import { default as AnnotationsOnPageQuery } from 'external/src/graphql/AnnotationsOnPageQuery.graphql';
export { AnnotationsOnPageQuery };
import { default as AnnotationsOnPageSubscription } from 'external/src/graphql/AnnotationsOnPageSubscription.graphql';
export { AnnotationsOnPageSubscription };
import { default as ApplicationSpecificationsQuery } from 'external/src/graphql/ApplicationSpecificationsQuery.graphql';
export { ApplicationSpecificationsQuery };
import { default as AutocompleteQuery } from 'external/src/graphql/AutocompleteQuery.graphql';
export { AutocompleteQuery };
import { default as BootstrapQuery } from 'external/src/graphql/BootstrapQuery.graphql';
export { BootstrapQuery };
import { default as CanEditExternalTaskQuery } from 'external/src/graphql/CanEditExternalTaskQuery.graphql';
export { CanEditExternalTaskQuery };
import { default as ClearDeepLinkThreadIDMutation } from 'external/src/graphql/ClearDeepLinkThreadID.graphql';
export { ClearDeepLinkThreadIDMutation };
import { default as ConversationThreadsQuery } from 'external/src/graphql/ConversationThreadsQuery.graphql';
export { ConversationThreadsQuery };
import { default as CreateFileMutation } from 'external/src/graphql/CreateFileMutation.graphql';
export { CreateFileMutation };
import { default as CreateMessageByExternalIDMutation } from 'external/src/graphql/CreateMessageByExternalIDMutation.graphql';
export { CreateMessageByExternalIDMutation };
import { default as CreateMessageReactionMutation } from 'external/src/graphql/CreateMessageReactionMutation.graphql';
export { CreateMessageReactionMutation };
import { default as CreateThreadMutation } from 'external/src/graphql/CreateThread.graphql';
export { CreateThreadMutation };
import { default as CreateThreadMessageMutation } from 'external/src/graphql/CreateThreadMessageMutation.graphql';
export { CreateThreadMessageMutation };
import { default as DeepLinkThreadIDQuery } from 'external/src/graphql/DeepLinkThreadIDQuery.graphql';
export { DeepLinkThreadIDQuery };
import { default as DeleteMessageReactionMutation } from 'external/src/graphql/DeleteMessageReactionMutation.graphql';
export { DeleteMessageReactionMutation };
import { default as DeleteNotificationMutation } from 'external/src/graphql/DeleteNotificationMutation.graphql';
export { DeleteNotificationMutation };
import { default as DisconnectThirdPartyMutation } from 'external/src/graphql/DisconnectThirdPartyMutation.graphql';
export { DisconnectThirdPartyMutation };
import { default as FeatureFlagsQuery } from 'external/src/graphql/FeatureFlagsQuery.graphql';
export { FeatureFlagsQuery };
import { default as HideLinkPreviewMutation } from 'external/src/graphql/HideLinkPreviewMutation.graphql';
export { HideLinkPreviewMutation };
import { default as InboxCountQuery } from 'external/src/graphql/InboxCountQuery.graphql';
export { InboxCountQuery };
import { default as InboxQuery } from 'external/src/graphql/InboxQuery.graphql';
export { InboxQuery };
import { default as InboxSubscription } from 'external/src/graphql/InboxSubscription.graphql';
export { InboxSubscription };
import { default as LoadMessagesToDeepLinkedMessageQuery } from 'external/src/graphql/LoadMessagesToDeepLinkedMessage.graphql';
export { LoadMessagesToDeepLinkedMessageQuery };
import { default as LogDeprecationMutation } from 'external/src/graphql/LogDeprecationMutation.graphql';
export { LogDeprecationMutation };
import { default as LogEventsMutation } from 'external/src/graphql/LogEventsMutation.graphql';
export { LogEventsMutation };
import { default as MarkAllNotificationsAsReadMutation } from 'external/src/graphql/MarkAllNotificationsAsReadMutation.graphql';
export { MarkAllNotificationsAsReadMutation };
import { default as ClearNotificationsForMessageMutation } from 'external/src/graphql/MarkMessageSeenMutation.graphql';
export { ClearNotificationsForMessageMutation };
import { default as MarkNotificationAsReadMutation } from 'external/src/graphql/MarkNotificationAsReadMutation.graphql';
export { MarkNotificationAsReadMutation };
import { default as MarkNotificationAsUnreadMutation } from 'external/src/graphql/MarkNotificationAsUnreadMutation.graphql';
export { MarkNotificationAsUnreadMutation };
import { default as MarkThreadSeenMutation } from 'external/src/graphql/MarkThreadSeenMutation.graphql';
export { MarkThreadSeenMutation };
import { default as MarkThreadsSeenMutation } from 'external/src/graphql/MarkThreadsSeenMutation.graphql';
export { MarkThreadsSeenMutation };
import { default as MessageByExternalIDQuery } from 'external/src/graphql/MessageByExternalIDQuery.graphql';
export { MessageByExternalIDQuery };
import { default as MessageByExternalIDWithThreadQuery } from 'external/src/graphql/MessageByExternalIDWithThread.graphql';
export { MessageByExternalIDWithThreadQuery };
import { default as MessageContentSearchQuery } from 'external/src/graphql/MessageContentSearchQuery.graphql';
export { MessageContentSearchQuery };
import { default as NotificationByExternalIDQuery } from 'external/src/graphql/NotificationByExternalIDQuery.graphql';
export { NotificationByExternalIDQuery };
import { default as NotificationSummaryQuery } from 'external/src/graphql/NotificationSummaryQuery.graphql';
export { NotificationSummaryQuery };
import { default as NotificationSummarySubscription } from 'external/src/graphql/NotificationSummarySubscription.graphql';
export { NotificationSummarySubscription };
import { default as NotificationsQuery } from 'external/src/graphql/NotificationsQuery.graphql';
export { NotificationsQuery };
import { default as NotificationEventsSubscription } from 'external/src/graphql/NotificationsSubscription.graphql';
export { NotificationEventsSubscription };
import { default as OlderThreadMessagesQuery } from 'external/src/graphql/OlderThreadMessagesQuery.graphql';
export { OlderThreadMessagesQuery };
import { default as OrgMembersByExtIDPaginatedQuery } from 'external/src/graphql/OrgMembersByExtIDPaginatedQuery.graphql';
export { OrgMembersByExtIDPaginatedQuery };
import { default as OrgMembersUpdatedSubscription } from 'external/src/graphql/OrgMembersUpdatedSubscription.graphql';
export { OrgMembersUpdatedSubscription };
import { default as PingQuery } from 'external/src/graphql/PingQuery.graphql';
export { PingQuery };
import { default as PreferencesSubscription } from 'external/src/graphql/PreferencesSubscription.graphql';
export { PreferencesSubscription };
import { default as PresenceLiveQuerySubscription } from 'external/src/graphql/PresenceLiveQuerySubscription.graphql';
export { PresenceLiveQuerySubscription };
import { default as RefreshFileUploadURLMutation } from 'external/src/graphql/RefreshFileUploadUrlMutation.graphql';
export { RefreshFileUploadURLMutation };
import { default as ResetUserHiddenAnnotationsMutation } from 'external/src/graphql/ResetUserHiddenAnnotations.graphql';
export { ResetUserHiddenAnnotationsMutation };
import { default as SendSampleWelcomeMessageMutation } from 'external/src/graphql/SendSampleWelcomeMessageMutation.graphql';
export { SendSampleWelcomeMessageMutation };
import { default as SetAnnotationVisibleMutation } from 'external/src/graphql/SetAnnotationVisibleMutation.graphql';
export { SetAnnotationVisibleMutation };
import { default as SetDeepLinkThreadIDMutation } from 'external/src/graphql/SetDeepLinkThreadID.graphql';
export { SetDeepLinkThreadIDMutation };
import { default as SetFileUploadStatusMutation } from 'external/src/graphql/SetFileUploadStatusMutation.graphql';
export { SetFileUploadStatusMutation };
import { default as SetPreferenceMutation } from 'external/src/graphql/SetPreferenceMutation.graphql';
export { SetPreferenceMutation };
import { default as SetPresentContextMutation } from 'external/src/graphql/SetPresentContextMutation.graphql';
export { SetPresentContextMutation };
import { default as SetSubscribedByExternalIDMutation } from 'external/src/graphql/SetSubscribedByExternalIDMutation.graphql';
export { SetSubscribedByExternalIDMutation };
import { default as SetSubscribedMutation } from 'external/src/graphql/SetSubscribedMutation.graphql';
export { SetSubscribedMutation };
import { default as SetThreadMetadataMutation } from 'external/src/graphql/SetThreadMetadataMutation.graphql';
export { SetThreadMetadataMutation };
import { default as SetThreadNameMutation } from 'external/src/graphql/SetThreadNameMutation.graphql';
export { SetThreadNameMutation };
import { default as SetThreadResolvedMutation } from 'external/src/graphql/SetThreadResolvedMutation.graphql';
export { SetThreadResolvedMutation };
import { default as SetTypingMutation } from 'external/src/graphql/SetTypingMutation.graphql';
export { SetTypingMutation };
import { default as ShareThreadToEmailMutation } from 'external/src/graphql/ShareToEmailMutation.graphql';
export { ShareThreadToEmailMutation };
import { default as SlackChannelsQuery } from 'external/src/graphql/SlackChannelsQuery.graphql';
export { SlackChannelsQuery };
import { default as SlackConnectedLiveQuerySubscription } from 'external/src/graphql/SlackConnectedSubscription.graphql';
export { SlackConnectedLiveQuerySubscription };
import { default as ThirdPartyConnectionConfigurationQuery } from 'external/src/graphql/ThirdPartyConnectionConfigurationQuery.graphql';
export { ThirdPartyConnectionConfigurationQuery };
import { default as ThirdPartyConnectionsQuery } from 'external/src/graphql/ThirdPartyConnectionsQuery.graphql';
export { ThirdPartyConnectionsQuery };
import { default as Thread2Query } from 'external/src/graphql/Thread2Query.graphql';
export { Thread2Query };
import { default as ThreadActivityQuery } from 'external/src/graphql/ThreadActivityQuery.graphql';
export { ThreadActivityQuery };
import { default as ThreadActivitySummarySubscription } from 'external/src/graphql/ThreadActivitySubscription.graphql';
export { ThreadActivitySummarySubscription };
import { default as ThreadByExternalID2Query } from 'external/src/graphql/ThreadByExternalID2Query.graphql';
export { ThreadByExternalID2Query };
import { default as ThreadEventsSubscription } from 'external/src/graphql/ThreadEventsSubscription.graphql';
export { ThreadEventsSubscription };
import { default as ThreadListEventsWithLocationSubscription } from 'external/src/graphql/ThreadListEventsWithLocationSubscription.graphql';
export { ThreadListEventsWithLocationSubscription };
import { default as ThreadListQuery } from 'external/src/graphql/ThreadListQuery.graphql';
export { ThreadListQuery };
import { default as UnlinkOrgMutation } from 'external/src/graphql/UnlinkOrgs.graphql';
export { UnlinkOrgMutation };
import { default as UnreadMessageCountQuery } from 'external/src/graphql/UnreadMessageCountQuery.graphql';
export { UnreadMessageCountQuery };
import { default as UpdateMessageByExternalIDMutation } from 'external/src/graphql/UpdateMessageByExternalIDMutation.graphql';
export { UpdateMessageByExternalIDMutation };
import { default as UpdateMessageMutation } from 'external/src/graphql/UpdateMessageMutation.graphql';
export { UpdateMessageMutation };
import { default as UpdateThreadByExternalIDMutation } from 'external/src/graphql/UpdateThreadByExternalIDMutation.graphql';
export { UpdateThreadByExternalIDMutation };
import { default as UserLiveQuerySubscription } from 'external/src/graphql/UserLiveQuerySubscription.graphql';
export { UserLiveQuerySubscription };
import { default as UsersByExternalIDQuery } from 'external/src/graphql/UsersByExternalIDQuery.graphql';
export { UsersByExternalIDQuery };
import { default as UsersQuery } from 'external/src/graphql/UsersQuery.graphql';
export { UsersQuery };
import { default as ViewerIdentityLiveQuerySubscription } from 'external/src/graphql/ViewerIdentityLiveQuery.graphql';
export { ViewerIdentityLiveQuerySubscription };
import { default as ViewerIdentityQuery } from 'external/src/graphql/ViewerIdentityQuery.graphql';
export { ViewerIdentityQuery };

export function useAccessTokenQuery<T>(
  options: QueryHookOptions<
    AccessTokenQueryResult,
    AccessTokenQueryVariables,
    T
  >,
) {
  return useQuery<AccessTokenQueryResult, AccessTokenQueryVariables>(
    AccessTokenQuery,
    options,
  );
}

export function useLazyAccessTokenQuery<T>(
  options?: LazyQueryHookOptions<
    AccessTokenQueryResult,
    AccessTokenQueryVariables,
    T
  >,
): LazyQueryReturnType<AccessTokenQueryResult, AccessTokenQueryVariables> {
  return useLazyQuery<AccessTokenQueryResult, AccessTokenQueryVariables>(
    AccessTokenQuery,
    options,
  );
}

export function useActivityQuery<T>(
  options: QueryHookOptions<ActivityQueryResult, ActivityQueryVariables, T>,
) {
  return useQuery<ActivityQueryResult, ActivityQueryVariables>(
    ActivityQuery,
    options,
  );
}

export function useLazyActivityQuery<T>(
  options?: LazyQueryHookOptions<
    ActivityQueryResult,
    ActivityQueryVariables,
    T
  >,
): LazyQueryReturnType<ActivityQueryResult, ActivityQueryVariables> {
  return useLazyQuery<ActivityQueryResult, ActivityQueryVariables>(
    ActivityQuery,
    options,
  );
}

export function useAddThreadToSlackChannelMutation<T>(
  options?: MutationHookOptions<
    AddThreadToSlackChannelMutationResult,
    AddThreadToSlackChannelMutationVariables,
    T
  >,
): MutationReturnType<
  AddThreadToSlackChannelMutationResult,
  AddThreadToSlackChannelMutationVariables
> {
  return useMutation<
    AddThreadToSlackChannelMutationResult,
    AddThreadToSlackChannelMutationVariables
  >(AddThreadToSlackChannelMutation, options);
}

export function useAnnotationsOnPageQuery<T>(
  options: QueryHookOptions<
    AnnotationsOnPageQueryResult,
    AnnotationsOnPageQueryVariables,
    T
  >,
) {
  return useQuery<
    AnnotationsOnPageQueryResult,
    AnnotationsOnPageQueryVariables
  >(AnnotationsOnPageQuery, options);
}

export function useLazyAnnotationsOnPageQuery<T>(
  options?: LazyQueryHookOptions<
    AnnotationsOnPageQueryResult,
    AnnotationsOnPageQueryVariables,
    T
  >,
): LazyQueryReturnType<
  AnnotationsOnPageQueryResult,
  AnnotationsOnPageQueryVariables
> {
  return useLazyQuery<
    AnnotationsOnPageQueryResult,
    AnnotationsOnPageQueryVariables
  >(AnnotationsOnPageQuery, options);
}

export function useAnnotationsOnPageSubscription<T>(
  options: SubscriptionHookOptions<
    AnnotationsOnPageSubscriptionResult,
    AnnotationsOnPageSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    AnnotationsOnPageSubscriptionResult,
    AnnotationsOnPageSubscriptionVariables
  >(AnnotationsOnPageSubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useApplicationSpecificationsQuery<T>(
  options?: QueryHookOptions<
    ApplicationSpecificationsQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<ApplicationSpecificationsQueryResult, Record<string, never>>(
    ApplicationSpecificationsQuery,
    options,
  );
}

export function useLazyApplicationSpecificationsQuery<T>(
  options?: LazyQueryHookOptions<
    ApplicationSpecificationsQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<
  ApplicationSpecificationsQueryResult,
  Record<string, never>
> {
  return useLazyQuery<
    ApplicationSpecificationsQueryResult,
    Record<string, never>
  >(ApplicationSpecificationsQuery, options);
}

export function useAutocompleteQuery<T>(
  options: QueryHookOptions<
    AutocompleteQueryResult,
    AutocompleteQueryVariables,
    T
  >,
) {
  return useQuery<AutocompleteQueryResult, AutocompleteQueryVariables>(
    AutocompleteQuery,
    options,
  );
}

export function useLazyAutocompleteQuery<T>(
  options?: LazyQueryHookOptions<
    AutocompleteQueryResult,
    AutocompleteQueryVariables,
    T
  >,
): LazyQueryReturnType<AutocompleteQueryResult, AutocompleteQueryVariables> {
  return useLazyQuery<AutocompleteQueryResult, AutocompleteQueryVariables>(
    AutocompleteQuery,
    options,
  );
}

export function useBootstrapQuery<T>(
  options: QueryHookOptions<BootstrapQueryResult, BootstrapQueryVariables, T>,
) {
  return useQuery<BootstrapQueryResult, BootstrapQueryVariables>(
    BootstrapQuery,
    options,
  );
}

export function useLazyBootstrapQuery<T>(
  options?: LazyQueryHookOptions<
    BootstrapQueryResult,
    BootstrapQueryVariables,
    T
  >,
): LazyQueryReturnType<BootstrapQueryResult, BootstrapQueryVariables> {
  return useLazyQuery<BootstrapQueryResult, BootstrapQueryVariables>(
    BootstrapQuery,
    options,
  );
}

export function useCanEditExternalTaskQuery<T>(
  options: QueryHookOptions<
    CanEditExternalTaskQueryResult,
    CanEditExternalTaskQueryVariables,
    T
  >,
) {
  return useQuery<
    CanEditExternalTaskQueryResult,
    CanEditExternalTaskQueryVariables
  >(CanEditExternalTaskQuery, options);
}

export function useLazyCanEditExternalTaskQuery<T>(
  options?: LazyQueryHookOptions<
    CanEditExternalTaskQueryResult,
    CanEditExternalTaskQueryVariables,
    T
  >,
): LazyQueryReturnType<
  CanEditExternalTaskQueryResult,
  CanEditExternalTaskQueryVariables
> {
  return useLazyQuery<
    CanEditExternalTaskQueryResult,
    CanEditExternalTaskQueryVariables
  >(CanEditExternalTaskQuery, options);
}

export function useClearDeepLinkThreadIDMutation<T>(
  options?: MutationHookOptions<
    ClearDeepLinkThreadIDMutationResult,
    Record<string, never>,
    T
  >,
): MutationReturnType<
  ClearDeepLinkThreadIDMutationResult,
  Record<string, never>
> {
  return useMutation<
    ClearDeepLinkThreadIDMutationResult,
    Record<string, never>
  >(ClearDeepLinkThreadIDMutation, options);
}

export function useConversationThreadsQuery<T>(
  options: QueryHookOptions<
    ConversationThreadsQueryResult,
    ConversationThreadsQueryVariables,
    T
  >,
) {
  return useQuery<
    ConversationThreadsQueryResult,
    ConversationThreadsQueryVariables
  >(ConversationThreadsQuery, options);
}

export function useLazyConversationThreadsQuery<T>(
  options?: LazyQueryHookOptions<
    ConversationThreadsQueryResult,
    ConversationThreadsQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ConversationThreadsQueryResult,
  ConversationThreadsQueryVariables
> {
  return useLazyQuery<
    ConversationThreadsQueryResult,
    ConversationThreadsQueryVariables
  >(ConversationThreadsQuery, options);
}

export function useCreateFileMutation<T>(
  options?: MutationHookOptions<
    CreateFileMutationResult,
    CreateFileMutationVariables,
    T
  >,
): MutationReturnType<CreateFileMutationResult, CreateFileMutationVariables> {
  return useMutation<CreateFileMutationResult, CreateFileMutationVariables>(
    CreateFileMutation,
    options,
  );
}

export function useCreateMessageByExternalIDMutation<T>(
  options?: MutationHookOptions<
    CreateMessageByExternalIDMutationResult,
    CreateMessageByExternalIDMutationVariables,
    T
  >,
): MutationReturnType<
  CreateMessageByExternalIDMutationResult,
  CreateMessageByExternalIDMutationVariables
> {
  return useMutation<
    CreateMessageByExternalIDMutationResult,
    CreateMessageByExternalIDMutationVariables
  >(CreateMessageByExternalIDMutation, options);
}

export function useCreateMessageReactionMutation<T>(
  options?: MutationHookOptions<
    CreateMessageReactionMutationResult,
    CreateMessageReactionMutationVariables,
    T
  >,
): MutationReturnType<
  CreateMessageReactionMutationResult,
  CreateMessageReactionMutationVariables
> {
  return useMutation<
    CreateMessageReactionMutationResult,
    CreateMessageReactionMutationVariables
  >(CreateMessageReactionMutation, options);
}

export function useCreateThreadMutation<T>(
  options?: MutationHookOptions<
    CreateThreadMutationResult,
    CreateThreadMutationVariables,
    T
  >,
): MutationReturnType<
  CreateThreadMutationResult,
  CreateThreadMutationVariables
> {
  return useMutation<CreateThreadMutationResult, CreateThreadMutationVariables>(
    CreateThreadMutation,
    options,
  );
}

export function useCreateThreadMessageMutation<T>(
  options?: MutationHookOptions<
    CreateThreadMessageMutationResult,
    CreateThreadMessageMutationVariables,
    T
  >,
): MutationReturnType<
  CreateThreadMessageMutationResult,
  CreateThreadMessageMutationVariables
> {
  return useMutation<
    CreateThreadMessageMutationResult,
    CreateThreadMessageMutationVariables
  >(CreateThreadMessageMutation, options);
}

export function useDeepLinkThreadIDQuery<T>(
  options?: QueryHookOptions<
    DeepLinkThreadIDQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<DeepLinkThreadIDQueryResult, Record<string, never>>(
    DeepLinkThreadIDQuery,
    options,
  );
}

export function useLazyDeepLinkThreadIDQuery<T>(
  options?: LazyQueryHookOptions<
    DeepLinkThreadIDQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<DeepLinkThreadIDQueryResult, Record<string, never>> {
  return useLazyQuery<DeepLinkThreadIDQueryResult, Record<string, never>>(
    DeepLinkThreadIDQuery,
    options,
  );
}

export function useDeleteMessageReactionMutation<T>(
  options?: MutationHookOptions<
    DeleteMessageReactionMutationResult,
    DeleteMessageReactionMutationVariables,
    T
  >,
): MutationReturnType<
  DeleteMessageReactionMutationResult,
  DeleteMessageReactionMutationVariables
> {
  return useMutation<
    DeleteMessageReactionMutationResult,
    DeleteMessageReactionMutationVariables
  >(DeleteMessageReactionMutation, options);
}

export function useDeleteNotificationMutation<T>(
  options?: MutationHookOptions<
    DeleteNotificationMutationResult,
    DeleteNotificationMutationVariables,
    T
  >,
): MutationReturnType<
  DeleteNotificationMutationResult,
  DeleteNotificationMutationVariables
> {
  return useMutation<
    DeleteNotificationMutationResult,
    DeleteNotificationMutationVariables
  >(DeleteNotificationMutation, options);
}

export function useDisconnectThirdPartyMutation<T>(
  options?: MutationHookOptions<
    DisconnectThirdPartyMutationResult,
    DisconnectThirdPartyMutationVariables,
    T
  >,
): MutationReturnType<
  DisconnectThirdPartyMutationResult,
  DisconnectThirdPartyMutationVariables
> {
  return useMutation<
    DisconnectThirdPartyMutationResult,
    DisconnectThirdPartyMutationVariables
  >(DisconnectThirdPartyMutation, options);
}

export function useFeatureFlagsQuery<T>(
  options: QueryHookOptions<
    FeatureFlagsQueryResult,
    FeatureFlagsQueryVariables,
    T
  >,
) {
  return useQuery<FeatureFlagsQueryResult, FeatureFlagsQueryVariables>(
    FeatureFlagsQuery,
    options,
  );
}

export function useLazyFeatureFlagsQuery<T>(
  options?: LazyQueryHookOptions<
    FeatureFlagsQueryResult,
    FeatureFlagsQueryVariables,
    T
  >,
): LazyQueryReturnType<FeatureFlagsQueryResult, FeatureFlagsQueryVariables> {
  return useLazyQuery<FeatureFlagsQueryResult, FeatureFlagsQueryVariables>(
    FeatureFlagsQuery,
    options,
  );
}

export function useHideLinkPreviewMutation<T>(
  options?: MutationHookOptions<
    HideLinkPreviewMutationResult,
    HideLinkPreviewMutationVariables,
    T
  >,
): MutationReturnType<
  HideLinkPreviewMutationResult,
  HideLinkPreviewMutationVariables
> {
  return useMutation<
    HideLinkPreviewMutationResult,
    HideLinkPreviewMutationVariables
  >(HideLinkPreviewMutation, options);
}

export function useInboxCountQuery<T>(
  options?: QueryHookOptions<InboxCountQueryResult, Record<string, never>, T>,
) {
  return useQuery<InboxCountQueryResult, Record<string, never>>(
    InboxCountQuery,
    options,
  );
}

export function useLazyInboxCountQuery<T>(
  options?: LazyQueryHookOptions<
    InboxCountQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<InboxCountQueryResult, Record<string, never>> {
  return useLazyQuery<InboxCountQueryResult, Record<string, never>>(
    InboxCountQuery,
    options,
  );
}

export function useInboxQuery<T>(
  options?: QueryHookOptions<InboxQueryResult, Record<string, never>, T>,
) {
  return useQuery<InboxQueryResult, Record<string, never>>(InboxQuery, options);
}

export function useLazyInboxQuery<T>(
  options?: LazyQueryHookOptions<InboxQueryResult, Record<string, never>, T>,
): LazyQueryReturnType<InboxQueryResult, Record<string, never>> {
  return useLazyQuery<InboxQueryResult, Record<string, never>>(
    InboxQuery,
    options,
  );
}

export function useInboxSubscription<T>(
  options?: SubscriptionHookOptions<
    InboxSubscriptionResult,
    Record<string, never>,
    T
  >,
) {
  return useSubscription<InboxSubscriptionResult, Record<string, never>>(
    InboxSubscription,
    { fetchPolicy: 'no-cache', ...options },
  );
}

export function useLoadMessagesToDeepLinkedMessageQuery<T>(
  options: QueryHookOptions<
    LoadMessagesToDeepLinkedMessageQueryResult,
    LoadMessagesToDeepLinkedMessageQueryVariables,
    T
  >,
) {
  return useQuery<
    LoadMessagesToDeepLinkedMessageQueryResult,
    LoadMessagesToDeepLinkedMessageQueryVariables
  >(LoadMessagesToDeepLinkedMessageQuery, options);
}

export function useLazyLoadMessagesToDeepLinkedMessageQuery<T>(
  options?: LazyQueryHookOptions<
    LoadMessagesToDeepLinkedMessageQueryResult,
    LoadMessagesToDeepLinkedMessageQueryVariables,
    T
  >,
): LazyQueryReturnType<
  LoadMessagesToDeepLinkedMessageQueryResult,
  LoadMessagesToDeepLinkedMessageQueryVariables
> {
  return useLazyQuery<
    LoadMessagesToDeepLinkedMessageQueryResult,
    LoadMessagesToDeepLinkedMessageQueryVariables
  >(LoadMessagesToDeepLinkedMessageQuery, options);
}

export function useLogDeprecationMutation<T>(
  options?: MutationHookOptions<
    LogDeprecationMutationResult,
    LogDeprecationMutationVariables,
    T
  >,
): MutationReturnType<
  LogDeprecationMutationResult,
  LogDeprecationMutationVariables
> {
  return useMutation<
    LogDeprecationMutationResult,
    LogDeprecationMutationVariables
  >(LogDeprecationMutation, options);
}

export function useLogEventsMutation<T>(
  options?: MutationHookOptions<
    LogEventsMutationResult,
    LogEventsMutationVariables,
    T
  >,
): MutationReturnType<LogEventsMutationResult, LogEventsMutationVariables> {
  return useMutation<LogEventsMutationResult, LogEventsMutationVariables>(
    LogEventsMutation,
    options,
  );
}

export function useMarkAllNotificationsAsReadMutation<T>(
  options?: MutationHookOptions<
    MarkAllNotificationsAsReadMutationResult,
    MarkAllNotificationsAsReadMutationVariables,
    T
  >,
): MutationReturnType<
  MarkAllNotificationsAsReadMutationResult,
  MarkAllNotificationsAsReadMutationVariables
> {
  return useMutation<
    MarkAllNotificationsAsReadMutationResult,
    MarkAllNotificationsAsReadMutationVariables
  >(MarkAllNotificationsAsReadMutation, options);
}

export function useClearNotificationsForMessageMutation<T>(
  options?: MutationHookOptions<
    ClearNotificationsForMessageMutationResult,
    ClearNotificationsForMessageMutationVariables,
    T
  >,
): MutationReturnType<
  ClearNotificationsForMessageMutationResult,
  ClearNotificationsForMessageMutationVariables
> {
  return useMutation<
    ClearNotificationsForMessageMutationResult,
    ClearNotificationsForMessageMutationVariables
  >(ClearNotificationsForMessageMutation, options);
}

export function useMarkNotificationAsReadMutation<T>(
  options?: MutationHookOptions<
    MarkNotificationAsReadMutationResult,
    MarkNotificationAsReadMutationVariables,
    T
  >,
): MutationReturnType<
  MarkNotificationAsReadMutationResult,
  MarkNotificationAsReadMutationVariables
> {
  return useMutation<
    MarkNotificationAsReadMutationResult,
    MarkNotificationAsReadMutationVariables
  >(MarkNotificationAsReadMutation, options);
}

export function useMarkNotificationAsUnreadMutation<T>(
  options?: MutationHookOptions<
    MarkNotificationAsUnreadMutationResult,
    MarkNotificationAsUnreadMutationVariables,
    T
  >,
): MutationReturnType<
  MarkNotificationAsUnreadMutationResult,
  MarkNotificationAsUnreadMutationVariables
> {
  return useMutation<
    MarkNotificationAsUnreadMutationResult,
    MarkNotificationAsUnreadMutationVariables
  >(MarkNotificationAsUnreadMutation, options);
}

export function useMarkThreadSeenMutation<T>(
  options?: MutationHookOptions<
    MarkThreadSeenMutationResult,
    MarkThreadSeenMutationVariables,
    T
  >,
): MutationReturnType<
  MarkThreadSeenMutationResult,
  MarkThreadSeenMutationVariables
> {
  return useMutation<
    MarkThreadSeenMutationResult,
    MarkThreadSeenMutationVariables
  >(MarkThreadSeenMutation, options);
}

export function useMarkThreadsSeenMutation<T>(
  options?: MutationHookOptions<
    MarkThreadsSeenMutationResult,
    MarkThreadsSeenMutationVariables,
    T
  >,
): MutationReturnType<
  MarkThreadsSeenMutationResult,
  MarkThreadsSeenMutationVariables
> {
  return useMutation<
    MarkThreadsSeenMutationResult,
    MarkThreadsSeenMutationVariables
  >(MarkThreadsSeenMutation, options);
}

export function useMessageByExternalIDQuery<T>(
  options: QueryHookOptions<
    MessageByExternalIDQueryResult,
    MessageByExternalIDQueryVariables,
    T
  >,
) {
  return useQuery<
    MessageByExternalIDQueryResult,
    MessageByExternalIDQueryVariables
  >(MessageByExternalIDQuery, options);
}

export function useLazyMessageByExternalIDQuery<T>(
  options?: LazyQueryHookOptions<
    MessageByExternalIDQueryResult,
    MessageByExternalIDQueryVariables,
    T
  >,
): LazyQueryReturnType<
  MessageByExternalIDQueryResult,
  MessageByExternalIDQueryVariables
> {
  return useLazyQuery<
    MessageByExternalIDQueryResult,
    MessageByExternalIDQueryVariables
  >(MessageByExternalIDQuery, options);
}

export function useMessageByExternalIDWithThreadQuery<T>(
  options: QueryHookOptions<
    MessageByExternalIDWithThreadQueryResult,
    MessageByExternalIDWithThreadQueryVariables,
    T
  >,
) {
  return useQuery<
    MessageByExternalIDWithThreadQueryResult,
    MessageByExternalIDWithThreadQueryVariables
  >(MessageByExternalIDWithThreadQuery, options);
}

export function useLazyMessageByExternalIDWithThreadQuery<T>(
  options?: LazyQueryHookOptions<
    MessageByExternalIDWithThreadQueryResult,
    MessageByExternalIDWithThreadQueryVariables,
    T
  >,
): LazyQueryReturnType<
  MessageByExternalIDWithThreadQueryResult,
  MessageByExternalIDWithThreadQueryVariables
> {
  return useLazyQuery<
    MessageByExternalIDWithThreadQueryResult,
    MessageByExternalIDWithThreadQueryVariables
  >(MessageByExternalIDWithThreadQuery, options);
}

export function useMessageContentSearchQuery<T>(
  options: QueryHookOptions<
    MessageContentSearchQueryResult,
    MessageContentSearchQueryVariables,
    T
  >,
) {
  return useQuery<
    MessageContentSearchQueryResult,
    MessageContentSearchQueryVariables
  >(MessageContentSearchQuery, options);
}

export function useLazyMessageContentSearchQuery<T>(
  options?: LazyQueryHookOptions<
    MessageContentSearchQueryResult,
    MessageContentSearchQueryVariables,
    T
  >,
): LazyQueryReturnType<
  MessageContentSearchQueryResult,
  MessageContentSearchQueryVariables
> {
  return useLazyQuery<
    MessageContentSearchQueryResult,
    MessageContentSearchQueryVariables
  >(MessageContentSearchQuery, options);
}

export function useNotificationByExternalIDQuery<T>(
  options: QueryHookOptions<
    NotificationByExternalIDQueryResult,
    NotificationByExternalIDQueryVariables,
    T
  >,
) {
  return useQuery<
    NotificationByExternalIDQueryResult,
    NotificationByExternalIDQueryVariables
  >(NotificationByExternalIDQuery, options);
}

export function useLazyNotificationByExternalIDQuery<T>(
  options?: LazyQueryHookOptions<
    NotificationByExternalIDQueryResult,
    NotificationByExternalIDQueryVariables,
    T
  >,
): LazyQueryReturnType<
  NotificationByExternalIDQueryResult,
  NotificationByExternalIDQueryVariables
> {
  return useLazyQuery<
    NotificationByExternalIDQueryResult,
    NotificationByExternalIDQueryVariables
  >(NotificationByExternalIDQuery, options);
}

export function useNotificationSummaryQuery<T>(
  options: QueryHookOptions<
    NotificationSummaryQueryResult,
    NotificationSummaryQueryVariables,
    T
  >,
) {
  return useQuery<
    NotificationSummaryQueryResult,
    NotificationSummaryQueryVariables
  >(NotificationSummaryQuery, options);
}

export function useLazyNotificationSummaryQuery<T>(
  options?: LazyQueryHookOptions<
    NotificationSummaryQueryResult,
    NotificationSummaryQueryVariables,
    T
  >,
): LazyQueryReturnType<
  NotificationSummaryQueryResult,
  NotificationSummaryQueryVariables
> {
  return useLazyQuery<
    NotificationSummaryQueryResult,
    NotificationSummaryQueryVariables
  >(NotificationSummaryQuery, options);
}

export function useNotificationSummarySubscription<T>(
  options: SubscriptionHookOptions<
    NotificationSummarySubscriptionResult,
    NotificationSummarySubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    NotificationSummarySubscriptionResult,
    NotificationSummarySubscriptionVariables
  >(NotificationSummarySubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useNotificationsQuery<T>(
  options: QueryHookOptions<
    NotificationsQueryResult,
    NotificationsQueryVariables,
    T
  >,
) {
  return useQuery<NotificationsQueryResult, NotificationsQueryVariables>(
    NotificationsQuery,
    options,
  );
}

export function useLazyNotificationsQuery<T>(
  options?: LazyQueryHookOptions<
    NotificationsQueryResult,
    NotificationsQueryVariables,
    T
  >,
): LazyQueryReturnType<NotificationsQueryResult, NotificationsQueryVariables> {
  return useLazyQuery<NotificationsQueryResult, NotificationsQueryVariables>(
    NotificationsQuery,
    options,
  );
}

export function useNotificationEventsSubscription<T>(
  options: SubscriptionHookOptions<
    NotificationEventsSubscriptionResult,
    NotificationEventsSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    NotificationEventsSubscriptionResult,
    NotificationEventsSubscriptionVariables
  >(NotificationEventsSubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useOlderThreadMessagesQuery<T>(
  options: QueryHookOptions<
    OlderThreadMessagesQueryResult,
    OlderThreadMessagesQueryVariables,
    T
  >,
) {
  return useQuery<
    OlderThreadMessagesQueryResult,
    OlderThreadMessagesQueryVariables
  >(OlderThreadMessagesQuery, options);
}

export function useLazyOlderThreadMessagesQuery<T>(
  options?: LazyQueryHookOptions<
    OlderThreadMessagesQueryResult,
    OlderThreadMessagesQueryVariables,
    T
  >,
): LazyQueryReturnType<
  OlderThreadMessagesQueryResult,
  OlderThreadMessagesQueryVariables
> {
  return useLazyQuery<
    OlderThreadMessagesQueryResult,
    OlderThreadMessagesQueryVariables
  >(OlderThreadMessagesQuery, options);
}

export function useOrgMembersByExtIDPaginatedQuery<T>(
  options: QueryHookOptions<
    OrgMembersByExtIDPaginatedQueryResult,
    OrgMembersByExtIDPaginatedQueryVariables,
    T
  >,
) {
  return useQuery<
    OrgMembersByExtIDPaginatedQueryResult,
    OrgMembersByExtIDPaginatedQueryVariables
  >(OrgMembersByExtIDPaginatedQuery, options);
}

export function useLazyOrgMembersByExtIDPaginatedQuery<T>(
  options?: LazyQueryHookOptions<
    OrgMembersByExtIDPaginatedQueryResult,
    OrgMembersByExtIDPaginatedQueryVariables,
    T
  >,
): LazyQueryReturnType<
  OrgMembersByExtIDPaginatedQueryResult,
  OrgMembersByExtIDPaginatedQueryVariables
> {
  return useLazyQuery<
    OrgMembersByExtIDPaginatedQueryResult,
    OrgMembersByExtIDPaginatedQueryVariables
  >(OrgMembersByExtIDPaginatedQuery, options);
}

export function useOrgMembersUpdatedSubscription<T>(
  options: SubscriptionHookOptions<
    OrgMembersUpdatedSubscriptionResult,
    OrgMembersUpdatedSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    OrgMembersUpdatedSubscriptionResult,
    OrgMembersUpdatedSubscriptionVariables
  >(OrgMembersUpdatedSubscription, { fetchPolicy: 'no-cache', ...options });
}

export function usePingQuery<T>(
  options?: QueryHookOptions<PingQueryResult, Record<string, never>, T>,
) {
  return useQuery<PingQueryResult, Record<string, never>>(PingQuery, options);
}

export function useLazyPingQuery<T>(
  options?: LazyQueryHookOptions<PingQueryResult, Record<string, never>, T>,
): LazyQueryReturnType<PingQueryResult, Record<string, never>> {
  return useLazyQuery<PingQueryResult, Record<string, never>>(
    PingQuery,
    options,
  );
}

export function usePreferencesSubscription<T>(
  options?: SubscriptionHookOptions<
    PreferencesSubscriptionResult,
    Record<string, never>,
    T
  >,
) {
  return useSubscription<PreferencesSubscriptionResult, Record<string, never>>(
    PreferencesSubscription,
    { fetchPolicy: 'no-cache', ...options },
  );
}

export function usePresenceLiveQuerySubscription<T>(
  options: SubscriptionHookOptions<
    PresenceLiveQuerySubscriptionResult,
    PresenceLiveQuerySubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    PresenceLiveQuerySubscriptionResult,
    PresenceLiveQuerySubscriptionVariables
  >(PresenceLiveQuerySubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useRefreshFileUploadURLMutation<T>(
  options?: MutationHookOptions<
    RefreshFileUploadURLMutationResult,
    RefreshFileUploadURLMutationVariables,
    T
  >,
): MutationReturnType<
  RefreshFileUploadURLMutationResult,
  RefreshFileUploadURLMutationVariables
> {
  return useMutation<
    RefreshFileUploadURLMutationResult,
    RefreshFileUploadURLMutationVariables
  >(RefreshFileUploadURLMutation, options);
}

export function useResetUserHiddenAnnotationsMutation<T>(
  options?: MutationHookOptions<
    ResetUserHiddenAnnotationsMutationResult,
    Record<string, never>,
    T
  >,
): MutationReturnType<
  ResetUserHiddenAnnotationsMutationResult,
  Record<string, never>
> {
  return useMutation<
    ResetUserHiddenAnnotationsMutationResult,
    Record<string, never>
  >(ResetUserHiddenAnnotationsMutation, options);
}

export function useSendSampleWelcomeMessageMutation<T>(
  options?: MutationHookOptions<
    SendSampleWelcomeMessageMutationResult,
    SendSampleWelcomeMessageMutationVariables,
    T
  >,
): MutationReturnType<
  SendSampleWelcomeMessageMutationResult,
  SendSampleWelcomeMessageMutationVariables
> {
  return useMutation<
    SendSampleWelcomeMessageMutationResult,
    SendSampleWelcomeMessageMutationVariables
  >(SendSampleWelcomeMessageMutation, options);
}

export function useSetAnnotationVisibleMutation<T>(
  options?: MutationHookOptions<
    SetAnnotationVisibleMutationResult,
    SetAnnotationVisibleMutationVariables,
    T
  >,
): MutationReturnType<
  SetAnnotationVisibleMutationResult,
  SetAnnotationVisibleMutationVariables
> {
  return useMutation<
    SetAnnotationVisibleMutationResult,
    SetAnnotationVisibleMutationVariables
  >(SetAnnotationVisibleMutation, options);
}

export function useSetDeepLinkThreadIDMutation<T>(
  options?: MutationHookOptions<
    SetDeepLinkThreadIDMutationResult,
    SetDeepLinkThreadIDMutationVariables,
    T
  >,
): MutationReturnType<
  SetDeepLinkThreadIDMutationResult,
  SetDeepLinkThreadIDMutationVariables
> {
  return useMutation<
    SetDeepLinkThreadIDMutationResult,
    SetDeepLinkThreadIDMutationVariables
  >(SetDeepLinkThreadIDMutation, options);
}

export function useSetFileUploadStatusMutation<T>(
  options?: MutationHookOptions<
    SetFileUploadStatusMutationResult,
    SetFileUploadStatusMutationVariables,
    T
  >,
): MutationReturnType<
  SetFileUploadStatusMutationResult,
  SetFileUploadStatusMutationVariables
> {
  return useMutation<
    SetFileUploadStatusMutationResult,
    SetFileUploadStatusMutationVariables
  >(SetFileUploadStatusMutation, options);
}

export function useSetPreferenceMutation<T>(
  options?: MutationHookOptions<
    SetPreferenceMutationResult,
    SetPreferenceMutationVariables,
    T
  >,
): MutationReturnType<
  SetPreferenceMutationResult,
  SetPreferenceMutationVariables
> {
  return useMutation<
    SetPreferenceMutationResult,
    SetPreferenceMutationVariables
  >(SetPreferenceMutation, options);
}

export function useSetPresentContextMutation<T>(
  options?: MutationHookOptions<
    SetPresentContextMutationResult,
    SetPresentContextMutationVariables,
    T
  >,
): MutationReturnType<
  SetPresentContextMutationResult,
  SetPresentContextMutationVariables
> {
  return useMutation<
    SetPresentContextMutationResult,
    SetPresentContextMutationVariables
  >(SetPresentContextMutation, options);
}

export function useSetSubscribedByExternalIDMutation<T>(
  options?: MutationHookOptions<
    SetSubscribedByExternalIDMutationResult,
    SetSubscribedByExternalIDMutationVariables,
    T
  >,
): MutationReturnType<
  SetSubscribedByExternalIDMutationResult,
  SetSubscribedByExternalIDMutationVariables
> {
  return useMutation<
    SetSubscribedByExternalIDMutationResult,
    SetSubscribedByExternalIDMutationVariables
  >(SetSubscribedByExternalIDMutation, options);
}

export function useSetSubscribedMutation<T>(
  options?: MutationHookOptions<
    SetSubscribedMutationResult,
    SetSubscribedMutationVariables,
    T
  >,
): MutationReturnType<
  SetSubscribedMutationResult,
  SetSubscribedMutationVariables
> {
  return useMutation<
    SetSubscribedMutationResult,
    SetSubscribedMutationVariables
  >(SetSubscribedMutation, options);
}

export function useSetThreadMetadataMutation<T>(
  options?: MutationHookOptions<
    SetThreadMetadataMutationResult,
    SetThreadMetadataMutationVariables,
    T
  >,
): MutationReturnType<
  SetThreadMetadataMutationResult,
  SetThreadMetadataMutationVariables
> {
  return useMutation<
    SetThreadMetadataMutationResult,
    SetThreadMetadataMutationVariables
  >(SetThreadMetadataMutation, options);
}

export function useSetThreadNameMutation<T>(
  options?: MutationHookOptions<
    SetThreadNameMutationResult,
    SetThreadNameMutationVariables,
    T
  >,
): MutationReturnType<
  SetThreadNameMutationResult,
  SetThreadNameMutationVariables
> {
  return useMutation<
    SetThreadNameMutationResult,
    SetThreadNameMutationVariables
  >(SetThreadNameMutation, options);
}

export function useSetThreadResolvedMutation<T>(
  options?: MutationHookOptions<
    SetThreadResolvedMutationResult,
    SetThreadResolvedMutationVariables,
    T
  >,
): MutationReturnType<
  SetThreadResolvedMutationResult,
  SetThreadResolvedMutationVariables
> {
  return useMutation<
    SetThreadResolvedMutationResult,
    SetThreadResolvedMutationVariables
  >(SetThreadResolvedMutation, options);
}

export function useSetTypingMutation<T>(
  options?: MutationHookOptions<
    SetTypingMutationResult,
    SetTypingMutationVariables,
    T
  >,
): MutationReturnType<SetTypingMutationResult, SetTypingMutationVariables> {
  return useMutation<SetTypingMutationResult, SetTypingMutationVariables>(
    SetTypingMutation,
    options,
  );
}

export function useShareThreadToEmailMutation<T>(
  options?: MutationHookOptions<
    ShareThreadToEmailMutationResult,
    ShareThreadToEmailMutationVariables,
    T
  >,
): MutationReturnType<
  ShareThreadToEmailMutationResult,
  ShareThreadToEmailMutationVariables
> {
  return useMutation<
    ShareThreadToEmailMutationResult,
    ShareThreadToEmailMutationVariables
  >(ShareThreadToEmailMutation, options);
}

export function useSlackChannelsQuery<T>(
  options: QueryHookOptions<
    SlackChannelsQueryResult,
    SlackChannelsQueryVariables,
    T
  >,
) {
  return useQuery<SlackChannelsQueryResult, SlackChannelsQueryVariables>(
    SlackChannelsQuery,
    options,
  );
}

export function useLazySlackChannelsQuery<T>(
  options?: LazyQueryHookOptions<
    SlackChannelsQueryResult,
    SlackChannelsQueryVariables,
    T
  >,
): LazyQueryReturnType<SlackChannelsQueryResult, SlackChannelsQueryVariables> {
  return useLazyQuery<SlackChannelsQueryResult, SlackChannelsQueryVariables>(
    SlackChannelsQuery,
    options,
  );
}

export function useSlackConnectedLiveQuerySubscription<T>(
  options: SubscriptionHookOptions<
    SlackConnectedLiveQuerySubscriptionResult,
    SlackConnectedLiveQuerySubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    SlackConnectedLiveQuerySubscriptionResult,
    SlackConnectedLiveQuerySubscriptionVariables
  >(SlackConnectedLiveQuerySubscription, {
    fetchPolicy: 'no-cache',
    ...options,
  });
}

export function useThirdPartyConnectionConfigurationQuery<T>(
  options: QueryHookOptions<
    ThirdPartyConnectionConfigurationQueryResult,
    ThirdPartyConnectionConfigurationQueryVariables,
    T
  >,
) {
  return useQuery<
    ThirdPartyConnectionConfigurationQueryResult,
    ThirdPartyConnectionConfigurationQueryVariables
  >(ThirdPartyConnectionConfigurationQuery, options);
}

export function useLazyThirdPartyConnectionConfigurationQuery<T>(
  options?: LazyQueryHookOptions<
    ThirdPartyConnectionConfigurationQueryResult,
    ThirdPartyConnectionConfigurationQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ThirdPartyConnectionConfigurationQueryResult,
  ThirdPartyConnectionConfigurationQueryVariables
> {
  return useLazyQuery<
    ThirdPartyConnectionConfigurationQueryResult,
    ThirdPartyConnectionConfigurationQueryVariables
  >(ThirdPartyConnectionConfigurationQuery, options);
}

export function useThirdPartyConnectionsQuery<T>(
  options: QueryHookOptions<
    ThirdPartyConnectionsQueryResult,
    ThirdPartyConnectionsQueryVariables,
    T
  >,
) {
  return useQuery<
    ThirdPartyConnectionsQueryResult,
    ThirdPartyConnectionsQueryVariables
  >(ThirdPartyConnectionsQuery, options);
}

export function useLazyThirdPartyConnectionsQuery<T>(
  options?: LazyQueryHookOptions<
    ThirdPartyConnectionsQueryResult,
    ThirdPartyConnectionsQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ThirdPartyConnectionsQueryResult,
  ThirdPartyConnectionsQueryVariables
> {
  return useLazyQuery<
    ThirdPartyConnectionsQueryResult,
    ThirdPartyConnectionsQueryVariables
  >(ThirdPartyConnectionsQuery, options);
}

export function useThread2Query<T>(
  options: QueryHookOptions<Thread2QueryResult, Thread2QueryVariables, T>,
) {
  return useQuery<Thread2QueryResult, Thread2QueryVariables>(
    Thread2Query,
    options,
  );
}

export function useLazyThread2Query<T>(
  options?: LazyQueryHookOptions<Thread2QueryResult, Thread2QueryVariables, T>,
): LazyQueryReturnType<Thread2QueryResult, Thread2QueryVariables> {
  return useLazyQuery<Thread2QueryResult, Thread2QueryVariables>(
    Thread2Query,
    options,
  );
}

export function useThreadActivityQuery<T>(
  options: QueryHookOptions<
    ThreadActivityQueryResult,
    ThreadActivityQueryVariables,
    T
  >,
) {
  return useQuery<ThreadActivityQueryResult, ThreadActivityQueryVariables>(
    ThreadActivityQuery,
    options,
  );
}

export function useLazyThreadActivityQuery<T>(
  options?: LazyQueryHookOptions<
    ThreadActivityQueryResult,
    ThreadActivityQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ThreadActivityQueryResult,
  ThreadActivityQueryVariables
> {
  return useLazyQuery<ThreadActivityQueryResult, ThreadActivityQueryVariables>(
    ThreadActivityQuery,
    options,
  );
}

export function useThreadActivitySummarySubscription<T>(
  options: SubscriptionHookOptions<
    ThreadActivitySummarySubscriptionResult,
    ThreadActivitySummarySubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    ThreadActivitySummarySubscriptionResult,
    ThreadActivitySummarySubscriptionVariables
  >(ThreadActivitySummarySubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useThreadByExternalID2Query<T>(
  options: QueryHookOptions<
    ThreadByExternalID2QueryResult,
    ThreadByExternalID2QueryVariables,
    T
  >,
) {
  return useQuery<
    ThreadByExternalID2QueryResult,
    ThreadByExternalID2QueryVariables
  >(ThreadByExternalID2Query, options);
}

export function useLazyThreadByExternalID2Query<T>(
  options?: LazyQueryHookOptions<
    ThreadByExternalID2QueryResult,
    ThreadByExternalID2QueryVariables,
    T
  >,
): LazyQueryReturnType<
  ThreadByExternalID2QueryResult,
  ThreadByExternalID2QueryVariables
> {
  return useLazyQuery<
    ThreadByExternalID2QueryResult,
    ThreadByExternalID2QueryVariables
  >(ThreadByExternalID2Query, options);
}

export function useThreadEventsSubscription<T>(
  options: SubscriptionHookOptions<
    ThreadEventsSubscriptionResult,
    ThreadEventsSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    ThreadEventsSubscriptionResult,
    ThreadEventsSubscriptionVariables
  >(ThreadEventsSubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useThreadListEventsWithLocationSubscription<T>(
  options: SubscriptionHookOptions<
    ThreadListEventsWithLocationSubscriptionResult,
    ThreadListEventsWithLocationSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    ThreadListEventsWithLocationSubscriptionResult,
    ThreadListEventsWithLocationSubscriptionVariables
  >(ThreadListEventsWithLocationSubscription, {
    fetchPolicy: 'no-cache',
    ...options,
  });
}

export function useThreadListQuery<T>(
  options: QueryHookOptions<ThreadListQueryResult, ThreadListQueryVariables, T>,
) {
  return useQuery<ThreadListQueryResult, ThreadListQueryVariables>(
    ThreadListQuery,
    options,
  );
}

export function useLazyThreadListQuery<T>(
  options?: LazyQueryHookOptions<
    ThreadListQueryResult,
    ThreadListQueryVariables,
    T
  >,
): LazyQueryReturnType<ThreadListQueryResult, ThreadListQueryVariables> {
  return useLazyQuery<ThreadListQueryResult, ThreadListQueryVariables>(
    ThreadListQuery,
    options,
  );
}

export function useUnlinkOrgMutation<T>(
  options?: MutationHookOptions<
    UnlinkOrgMutationResult,
    UnlinkOrgMutationVariables,
    T
  >,
): MutationReturnType<UnlinkOrgMutationResult, UnlinkOrgMutationVariables> {
  return useMutation<UnlinkOrgMutationResult, UnlinkOrgMutationVariables>(
    UnlinkOrgMutation,
    options,
  );
}

export function useUnreadMessageCountQuery<T>(
  options: QueryHookOptions<
    UnreadMessageCountQueryResult,
    UnreadMessageCountQueryVariables,
    T
  >,
) {
  return useQuery<
    UnreadMessageCountQueryResult,
    UnreadMessageCountQueryVariables
  >(UnreadMessageCountQuery, options);
}

export function useLazyUnreadMessageCountQuery<T>(
  options?: LazyQueryHookOptions<
    UnreadMessageCountQueryResult,
    UnreadMessageCountQueryVariables,
    T
  >,
): LazyQueryReturnType<
  UnreadMessageCountQueryResult,
  UnreadMessageCountQueryVariables
> {
  return useLazyQuery<
    UnreadMessageCountQueryResult,
    UnreadMessageCountQueryVariables
  >(UnreadMessageCountQuery, options);
}

export function useUpdateMessageByExternalIDMutation<T>(
  options?: MutationHookOptions<
    UpdateMessageByExternalIDMutationResult,
    UpdateMessageByExternalIDMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateMessageByExternalIDMutationResult,
  UpdateMessageByExternalIDMutationVariables
> {
  return useMutation<
    UpdateMessageByExternalIDMutationResult,
    UpdateMessageByExternalIDMutationVariables
  >(UpdateMessageByExternalIDMutation, options);
}

export function useUpdateMessageMutation<T>(
  options?: MutationHookOptions<
    UpdateMessageMutationResult,
    UpdateMessageMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateMessageMutationResult,
  UpdateMessageMutationVariables
> {
  return useMutation<
    UpdateMessageMutationResult,
    UpdateMessageMutationVariables
  >(UpdateMessageMutation, options);
}

export function useUpdateThreadByExternalIDMutation<T>(
  options?: MutationHookOptions<
    UpdateThreadByExternalIDMutationResult,
    UpdateThreadByExternalIDMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateThreadByExternalIDMutationResult,
  UpdateThreadByExternalIDMutationVariables
> {
  return useMutation<
    UpdateThreadByExternalIDMutationResult,
    UpdateThreadByExternalIDMutationVariables
  >(UpdateThreadByExternalIDMutation, options);
}

export function useUserLiveQuerySubscription<T>(
  options: SubscriptionHookOptions<
    UserLiveQuerySubscriptionResult,
    UserLiveQuerySubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    UserLiveQuerySubscriptionResult,
    UserLiveQuerySubscriptionVariables
  >(UserLiveQuerySubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useUsersByExternalIDQuery<T>(
  options: QueryHookOptions<
    UsersByExternalIDQueryResult,
    UsersByExternalIDQueryVariables,
    T
  >,
) {
  return useQuery<
    UsersByExternalIDQueryResult,
    UsersByExternalIDQueryVariables
  >(UsersByExternalIDQuery, options);
}

export function useLazyUsersByExternalIDQuery<T>(
  options?: LazyQueryHookOptions<
    UsersByExternalIDQueryResult,
    UsersByExternalIDQueryVariables,
    T
  >,
): LazyQueryReturnType<
  UsersByExternalIDQueryResult,
  UsersByExternalIDQueryVariables
> {
  return useLazyQuery<
    UsersByExternalIDQueryResult,
    UsersByExternalIDQueryVariables
  >(UsersByExternalIDQuery, options);
}

export function useUsersQuery<T>(
  options: QueryHookOptions<UsersQueryResult, UsersQueryVariables, T>,
) {
  return useQuery<UsersQueryResult, UsersQueryVariables>(UsersQuery, options);
}

export function useLazyUsersQuery<T>(
  options?: LazyQueryHookOptions<UsersQueryResult, UsersQueryVariables, T>,
): LazyQueryReturnType<UsersQueryResult, UsersQueryVariables> {
  return useLazyQuery<UsersQueryResult, UsersQueryVariables>(
    UsersQuery,
    options,
  );
}

export function useViewerIdentityLiveQuerySubscription<T>(
  options: SubscriptionHookOptions<
    ViewerIdentityLiveQuerySubscriptionResult,
    ViewerIdentityLiveQuerySubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    ViewerIdentityLiveQuerySubscriptionResult,
    ViewerIdentityLiveQuerySubscriptionVariables
  >(ViewerIdentityLiveQuerySubscription, {
    fetchPolicy: 'no-cache',
    ...options,
  });
}

export function useViewerIdentityQuery<T>(
  options: QueryHookOptions<
    ViewerIdentityQueryResult,
    ViewerIdentityQueryVariables,
    T
  >,
) {
  return useQuery<ViewerIdentityQueryResult, ViewerIdentityQueryVariables>(
    ViewerIdentityQuery,
    options,
  );
}

export function useLazyViewerIdentityQuery<T>(
  options?: LazyQueryHookOptions<
    ViewerIdentityQueryResult,
    ViewerIdentityQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ViewerIdentityQueryResult,
  ViewerIdentityQueryVariables
> {
  return useLazyQuery<ViewerIdentityQueryResult, ViewerIdentityQueryVariables>(
    ViewerIdentityQuery,
    options,
  );
}

export type QueryTypes = {
  AccessTokenQuery: {
    variables: AccessTokenQueryVariables;
    result: AccessTokenQueryResult;
  };
  ActivityQuery: {
    variables: ActivityQueryVariables;
    result: ActivityQueryResult;
  };
  AnnotationsOnPageQuery: {
    variables: AnnotationsOnPageQueryVariables;
    result: AnnotationsOnPageQueryResult;
  };
  ApplicationSpecificationsQuery: {
    variables: Record<string, never>;
    result: ApplicationSpecificationsQueryResult;
  };
  AutocompleteQuery: {
    variables: AutocompleteQueryVariables;
    result: AutocompleteQueryResult;
  };
  BootstrapQuery: {
    variables: BootstrapQueryVariables;
    result: BootstrapQueryResult;
  };
  CanEditExternalTaskQuery: {
    variables: CanEditExternalTaskQueryVariables;
    result: CanEditExternalTaskQueryResult;
  };
  ConversationThreadsQuery: {
    variables: ConversationThreadsQueryVariables;
    result: ConversationThreadsQueryResult;
  };
  DeepLinkThreadIDQuery: {
    variables: Record<string, never>;
    result: DeepLinkThreadIDQueryResult;
  };
  FeatureFlagsQuery: {
    variables: FeatureFlagsQueryVariables;
    result: FeatureFlagsQueryResult;
  };
  InboxCountQuery: {
    variables: Record<string, never>;
    result: InboxCountQueryResult;
  };
  InboxQuery: { variables: Record<string, never>; result: InboxQueryResult };
  LoadMessagesToDeepLinkedMessageQuery: {
    variables: LoadMessagesToDeepLinkedMessageQueryVariables;
    result: LoadMessagesToDeepLinkedMessageQueryResult;
  };
  MessageByExternalIDQuery: {
    variables: MessageByExternalIDQueryVariables;
    result: MessageByExternalIDQueryResult;
  };
  MessageByExternalIDWithThreadQuery: {
    variables: MessageByExternalIDWithThreadQueryVariables;
    result: MessageByExternalIDWithThreadQueryResult;
  };
  MessageContentSearchQuery: {
    variables: MessageContentSearchQueryVariables;
    result: MessageContentSearchQueryResult;
  };
  NotificationByExternalIDQuery: {
    variables: NotificationByExternalIDQueryVariables;
    result: NotificationByExternalIDQueryResult;
  };
  NotificationSummaryQuery: {
    variables: NotificationSummaryQueryVariables;
    result: NotificationSummaryQueryResult;
  };
  NotificationsQuery: {
    variables: NotificationsQueryVariables;
    result: NotificationsQueryResult;
  };
  OlderThreadMessagesQuery: {
    variables: OlderThreadMessagesQueryVariables;
    result: OlderThreadMessagesQueryResult;
  };
  OrgMembersByExtIDPaginatedQuery: {
    variables: OrgMembersByExtIDPaginatedQueryVariables;
    result: OrgMembersByExtIDPaginatedQueryResult;
  };
  PingQuery: { variables: Record<string, never>; result: PingQueryResult };
  SlackChannelsQuery: {
    variables: SlackChannelsQueryVariables;
    result: SlackChannelsQueryResult;
  };
  ThirdPartyConnectionConfigurationQuery: {
    variables: ThirdPartyConnectionConfigurationQueryVariables;
    result: ThirdPartyConnectionConfigurationQueryResult;
  };
  ThirdPartyConnectionsQuery: {
    variables: ThirdPartyConnectionsQueryVariables;
    result: ThirdPartyConnectionsQueryResult;
  };
  Thread2Query: {
    variables: Thread2QueryVariables;
    result: Thread2QueryResult;
  };
  ThreadActivityQuery: {
    variables: ThreadActivityQueryVariables;
    result: ThreadActivityQueryResult;
  };
  ThreadByExternalID2Query: {
    variables: ThreadByExternalID2QueryVariables;
    result: ThreadByExternalID2QueryResult;
  };
  ThreadListQuery: {
    variables: ThreadListQueryVariables;
    result: ThreadListQueryResult;
  };
  UnreadMessageCountQuery: {
    variables: UnreadMessageCountQueryVariables;
    result: UnreadMessageCountQueryResult;
  };
  UsersByExternalIDQuery: {
    variables: UsersByExternalIDQueryVariables;
    result: UsersByExternalIDQueryResult;
  };
  UsersQuery: { variables: UsersQueryVariables; result: UsersQueryResult };
  ViewerIdentityQuery: {
    variables: ViewerIdentityQueryVariables;
    result: ViewerIdentityQueryResult;
  };
};

export const queries: Record<keyof QueryTypes, DocumentNode> = {
  AccessTokenQuery: AccessTokenQuery,
  ActivityQuery: ActivityQuery,
  AnnotationsOnPageQuery: AnnotationsOnPageQuery,
  ApplicationSpecificationsQuery: ApplicationSpecificationsQuery,
  AutocompleteQuery: AutocompleteQuery,
  BootstrapQuery: BootstrapQuery,
  CanEditExternalTaskQuery: CanEditExternalTaskQuery,
  ConversationThreadsQuery: ConversationThreadsQuery,
  DeepLinkThreadIDQuery: DeepLinkThreadIDQuery,
  FeatureFlagsQuery: FeatureFlagsQuery,
  InboxCountQuery: InboxCountQuery,
  InboxQuery: InboxQuery,
  LoadMessagesToDeepLinkedMessageQuery: LoadMessagesToDeepLinkedMessageQuery,
  MessageByExternalIDQuery: MessageByExternalIDQuery,
  MessageByExternalIDWithThreadQuery: MessageByExternalIDWithThreadQuery,
  MessageContentSearchQuery: MessageContentSearchQuery,
  NotificationByExternalIDQuery: NotificationByExternalIDQuery,
  NotificationSummaryQuery: NotificationSummaryQuery,
  NotificationsQuery: NotificationsQuery,
  OlderThreadMessagesQuery: OlderThreadMessagesQuery,
  OrgMembersByExtIDPaginatedQuery: OrgMembersByExtIDPaginatedQuery,
  PingQuery: PingQuery,
  SlackChannelsQuery: SlackChannelsQuery,
  ThirdPartyConnectionConfigurationQuery:
    ThirdPartyConnectionConfigurationQuery,
  ThirdPartyConnectionsQuery: ThirdPartyConnectionsQuery,
  Thread2Query: Thread2Query,
  ThreadActivityQuery: ThreadActivityQuery,
  ThreadByExternalID2Query: ThreadByExternalID2Query,
  ThreadListQuery: ThreadListQuery,
  UnreadMessageCountQuery: UnreadMessageCountQuery,
  UsersByExternalIDQuery: UsersByExternalIDQuery,
  UsersQuery: UsersQuery,
  ViewerIdentityQuery: ViewerIdentityQuery,
};

export type MutationTypes = {
  AddThreadToSlackChannelMutation: {
    variables: AddThreadToSlackChannelMutationVariables;
    result: AddThreadToSlackChannelMutationResult;
  };
  ClearDeepLinkThreadIDMutation: {
    variables: Record<string, never>;
    result: ClearDeepLinkThreadIDMutationResult;
  };
  CreateFileMutation: {
    variables: CreateFileMutationVariables;
    result: CreateFileMutationResult;
  };
  CreateMessageByExternalIDMutation: {
    variables: CreateMessageByExternalIDMutationVariables;
    result: CreateMessageByExternalIDMutationResult;
  };
  CreateMessageReactionMutation: {
    variables: CreateMessageReactionMutationVariables;
    result: CreateMessageReactionMutationResult;
  };
  CreateThreadMutation: {
    variables: CreateThreadMutationVariables;
    result: CreateThreadMutationResult;
  };
  CreateThreadMessageMutation: {
    variables: CreateThreadMessageMutationVariables;
    result: CreateThreadMessageMutationResult;
  };
  DeleteMessageReactionMutation: {
    variables: DeleteMessageReactionMutationVariables;
    result: DeleteMessageReactionMutationResult;
  };
  DeleteNotificationMutation: {
    variables: DeleteNotificationMutationVariables;
    result: DeleteNotificationMutationResult;
  };
  DisconnectThirdPartyMutation: {
    variables: DisconnectThirdPartyMutationVariables;
    result: DisconnectThirdPartyMutationResult;
  };
  HideLinkPreviewMutation: {
    variables: HideLinkPreviewMutationVariables;
    result: HideLinkPreviewMutationResult;
  };
  LogDeprecationMutation: {
    variables: LogDeprecationMutationVariables;
    result: LogDeprecationMutationResult;
  };
  LogEventsMutation: {
    variables: LogEventsMutationVariables;
    result: LogEventsMutationResult;
  };
  MarkAllNotificationsAsReadMutation: {
    variables: MarkAllNotificationsAsReadMutationVariables;
    result: MarkAllNotificationsAsReadMutationResult;
  };
  ClearNotificationsForMessageMutation: {
    variables: ClearNotificationsForMessageMutationVariables;
    result: ClearNotificationsForMessageMutationResult;
  };
  MarkNotificationAsReadMutation: {
    variables: MarkNotificationAsReadMutationVariables;
    result: MarkNotificationAsReadMutationResult;
  };
  MarkNotificationAsUnreadMutation: {
    variables: MarkNotificationAsUnreadMutationVariables;
    result: MarkNotificationAsUnreadMutationResult;
  };
  MarkThreadSeenMutation: {
    variables: MarkThreadSeenMutationVariables;
    result: MarkThreadSeenMutationResult;
  };
  MarkThreadsSeenMutation: {
    variables: MarkThreadsSeenMutationVariables;
    result: MarkThreadsSeenMutationResult;
  };
  RefreshFileUploadURLMutation: {
    variables: RefreshFileUploadURLMutationVariables;
    result: RefreshFileUploadURLMutationResult;
  };
  ResetUserHiddenAnnotationsMutation: {
    variables: Record<string, never>;
    result: ResetUserHiddenAnnotationsMutationResult;
  };
  SendSampleWelcomeMessageMutation: {
    variables: SendSampleWelcomeMessageMutationVariables;
    result: SendSampleWelcomeMessageMutationResult;
  };
  SetAnnotationVisibleMutation: {
    variables: SetAnnotationVisibleMutationVariables;
    result: SetAnnotationVisibleMutationResult;
  };
  SetDeepLinkThreadIDMutation: {
    variables: SetDeepLinkThreadIDMutationVariables;
    result: SetDeepLinkThreadIDMutationResult;
  };
  SetFileUploadStatusMutation: {
    variables: SetFileUploadStatusMutationVariables;
    result: SetFileUploadStatusMutationResult;
  };
  SetPreferenceMutation: {
    variables: SetPreferenceMutationVariables;
    result: SetPreferenceMutationResult;
  };
  SetPresentContextMutation: {
    variables: SetPresentContextMutationVariables;
    result: SetPresentContextMutationResult;
  };
  SetSubscribedByExternalIDMutation: {
    variables: SetSubscribedByExternalIDMutationVariables;
    result: SetSubscribedByExternalIDMutationResult;
  };
  SetSubscribedMutation: {
    variables: SetSubscribedMutationVariables;
    result: SetSubscribedMutationResult;
  };
  SetThreadMetadataMutation: {
    variables: SetThreadMetadataMutationVariables;
    result: SetThreadMetadataMutationResult;
  };
  SetThreadNameMutation: {
    variables: SetThreadNameMutationVariables;
    result: SetThreadNameMutationResult;
  };
  SetThreadResolvedMutation: {
    variables: SetThreadResolvedMutationVariables;
    result: SetThreadResolvedMutationResult;
  };
  SetTypingMutation: {
    variables: SetTypingMutationVariables;
    result: SetTypingMutationResult;
  };
  ShareThreadToEmailMutation: {
    variables: ShareThreadToEmailMutationVariables;
    result: ShareThreadToEmailMutationResult;
  };
  UnlinkOrgMutation: {
    variables: UnlinkOrgMutationVariables;
    result: UnlinkOrgMutationResult;
  };
  UpdateMessageByExternalIDMutation: {
    variables: UpdateMessageByExternalIDMutationVariables;
    result: UpdateMessageByExternalIDMutationResult;
  };
  UpdateMessageMutation: {
    variables: UpdateMessageMutationVariables;
    result: UpdateMessageMutationResult;
  };
  UpdateThreadByExternalIDMutation: {
    variables: UpdateThreadByExternalIDMutationVariables;
    result: UpdateThreadByExternalIDMutationResult;
  };
};

export const mutations: Record<keyof MutationTypes, DocumentNode> = {
  AddThreadToSlackChannelMutation: AddThreadToSlackChannelMutation,
  ClearDeepLinkThreadIDMutation: ClearDeepLinkThreadIDMutation,
  CreateFileMutation: CreateFileMutation,
  CreateMessageByExternalIDMutation: CreateMessageByExternalIDMutation,
  CreateMessageReactionMutation: CreateMessageReactionMutation,
  CreateThreadMutation: CreateThreadMutation,
  CreateThreadMessageMutation: CreateThreadMessageMutation,
  DeleteMessageReactionMutation: DeleteMessageReactionMutation,
  DeleteNotificationMutation: DeleteNotificationMutation,
  DisconnectThirdPartyMutation: DisconnectThirdPartyMutation,
  HideLinkPreviewMutation: HideLinkPreviewMutation,
  LogDeprecationMutation: LogDeprecationMutation,
  LogEventsMutation: LogEventsMutation,
  MarkAllNotificationsAsReadMutation: MarkAllNotificationsAsReadMutation,
  ClearNotificationsForMessageMutation: ClearNotificationsForMessageMutation,
  MarkNotificationAsReadMutation: MarkNotificationAsReadMutation,
  MarkNotificationAsUnreadMutation: MarkNotificationAsUnreadMutation,
  MarkThreadSeenMutation: MarkThreadSeenMutation,
  MarkThreadsSeenMutation: MarkThreadsSeenMutation,
  RefreshFileUploadURLMutation: RefreshFileUploadURLMutation,
  ResetUserHiddenAnnotationsMutation: ResetUserHiddenAnnotationsMutation,
  SendSampleWelcomeMessageMutation: SendSampleWelcomeMessageMutation,
  SetAnnotationVisibleMutation: SetAnnotationVisibleMutation,
  SetDeepLinkThreadIDMutation: SetDeepLinkThreadIDMutation,
  SetFileUploadStatusMutation: SetFileUploadStatusMutation,
  SetPreferenceMutation: SetPreferenceMutation,
  SetPresentContextMutation: SetPresentContextMutation,
  SetSubscribedByExternalIDMutation: SetSubscribedByExternalIDMutation,
  SetSubscribedMutation: SetSubscribedMutation,
  SetThreadMetadataMutation: SetThreadMetadataMutation,
  SetThreadNameMutation: SetThreadNameMutation,
  SetThreadResolvedMutation: SetThreadResolvedMutation,
  SetTypingMutation: SetTypingMutation,
  ShareThreadToEmailMutation: ShareThreadToEmailMutation,
  UnlinkOrgMutation: UnlinkOrgMutation,
  UpdateMessageByExternalIDMutation: UpdateMessageByExternalIDMutation,
  UpdateMessageMutation: UpdateMessageMutation,
  UpdateThreadByExternalIDMutation: UpdateThreadByExternalIDMutation,
};

export type SubscriptionTypes = {
  AnnotationsOnPageSubscription: {
    variables: AnnotationsOnPageSubscriptionVariables;
    result: AnnotationsOnPageSubscriptionResult;
  };
  InboxSubscription: {
    variables: Record<string, never>;
    result: InboxSubscriptionResult;
  };
  NotificationSummarySubscription: {
    variables: NotificationSummarySubscriptionVariables;
    result: NotificationSummarySubscriptionResult;
  };
  NotificationEventsSubscription: {
    variables: NotificationEventsSubscriptionVariables;
    result: NotificationEventsSubscriptionResult;
  };
  OrgMembersUpdatedSubscription: {
    variables: OrgMembersUpdatedSubscriptionVariables;
    result: OrgMembersUpdatedSubscriptionResult;
  };
  PreferencesSubscription: {
    variables: Record<string, never>;
    result: PreferencesSubscriptionResult;
  };
  PresenceLiveQuerySubscription: {
    variables: PresenceLiveQuerySubscriptionVariables;
    result: PresenceLiveQuerySubscriptionResult;
  };
  SlackConnectedLiveQuerySubscription: {
    variables: SlackConnectedLiveQuerySubscriptionVariables;
    result: SlackConnectedLiveQuerySubscriptionResult;
  };
  ThreadActivitySummarySubscription: {
    variables: ThreadActivitySummarySubscriptionVariables;
    result: ThreadActivitySummarySubscriptionResult;
  };
  ThreadEventsSubscription: {
    variables: ThreadEventsSubscriptionVariables;
    result: ThreadEventsSubscriptionResult;
  };
  ThreadListEventsWithLocationSubscription: {
    variables: ThreadListEventsWithLocationSubscriptionVariables;
    result: ThreadListEventsWithLocationSubscriptionResult;
  };
  UserLiveQuerySubscription: {
    variables: UserLiveQuerySubscriptionVariables;
    result: UserLiveQuerySubscriptionResult;
  };
  ViewerIdentityLiveQuerySubscription: {
    variables: ViewerIdentityLiveQuerySubscriptionVariables;
    result: ViewerIdentityLiveQuerySubscriptionResult;
  };
};

export const subscriptions: Record<keyof SubscriptionTypes, DocumentNode> = {
  AnnotationsOnPageSubscription: AnnotationsOnPageSubscription,
  InboxSubscription: InboxSubscription,
  NotificationSummarySubscription: NotificationSummarySubscription,
  NotificationEventsSubscription: NotificationEventsSubscription,
  OrgMembersUpdatedSubscription: OrgMembersUpdatedSubscription,
  PreferencesSubscription: PreferencesSubscription,
  PresenceLiveQuerySubscription: PresenceLiveQuerySubscription,
  SlackConnectedLiveQuerySubscription: SlackConnectedLiveQuerySubscription,
  ThreadActivitySummarySubscription: ThreadActivitySummarySubscription,
  ThreadEventsSubscription: ThreadEventsSubscription,
  ThreadListEventsWithLocationSubscription:
    ThreadListEventsWithLocationSubscription,
  UserLiveQuerySubscription: UserLiveQuerySubscription,
  ViewerIdentityLiveQuerySubscription: ViewerIdentityLiveQuerySubscription,
};
