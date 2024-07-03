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
  CustomEmailTemplate,
  CustomLinks,
  CustomNUXInput,
  CustomNUXStepInput,
  ConsoleApplicationOrganizationState,
  ConsoleApplicationUserState,
  ConsoleApplicationFragment,
  CustomNUXStepContentFragment,
  S3BucketFragment,
  AddConsoleUserToCustomerMutationResult,
  AddConsoleUserToCustomerMutationVariables,
  CreateApplicationForConsoleMutationResult,
  CreateApplicationForConsoleMutationVariables,
  CreateApplicationS3BucketMutationResult,
  CreateApplicationS3BucketMutationVariables,
  CreateCustomerForConsoleMutationResult,
  CreateCustomerForConsoleMutationVariables,
  CreateCustomerIssueInConsoleMutationResult,
  CreateCustomerIssueInConsoleMutationVariables,
  DeleteApplicationS3BucketMutationResult,
  DeleteApplicationS3BucketMutationVariables,
  GetSignedUploadURLMutationResult,
  GetSignedUploadURLMutationVariables,
  RemoveConsoleUserFromCustomerMutationResult,
  RemoveConsoleUserFromCustomerMutationVariables,
  RemoveSlackSupportOrgMutationResult,
  RemoveSlackSupportOrgMutationVariables,
  RequestAccessToCustomerMutationResult,
  RequestAccessToCustomerMutationVariables,
  StartCheckoutMutationResult,
  StartCheckoutMutationVariables,
  SyncUserMutationResult,
  SyncUserMutationVariables,
  UpdateAccessToCustomerMutationResult,
  UpdateAccessToCustomerMutationVariables,
  UpdateApplicationForConsoleMutationResult,
  UpdateApplicationForConsoleMutationVariables,
  UpdateApplicationS3BucketSecretMutationResult,
  UpdateApplicationS3BucketSecretMutationVariables,
  UpdateCustomerIssueInConsoleMutationResult,
  UpdateCustomerIssueInConsoleMutationVariables,
  UpdateCustomerNameMutationResult,
  UpdateCustomerNameMutationVariables,
  UpdateSupportBotMutationResult,
  UpdateSupportBotMutationVariables,
  UpdateUserDetailsMutationResult,
  UpdateUserDetailsMutationVariables,
  RedirectToStripeCustomerPortalMutationResult,
  ApplicationFlagQueryResult,
  ApplicationFlagQueryVariables,
  ApplicationForConsoleQueryResult,
  ApplicationForConsoleQueryVariables,
  ApplicationsQueryResult,
  ConsoleCordSessionTokenQueryResult,
  ConsoleCustomerIssuesQueryResult,
  ConsoleS3BucketQueryResult,
  ConsoleS3BucketQueryVariables,
  ConsoleUserQueryResult,
  ConsoleUsersQueryResult,
  EncodedSlackTokenQueryResult,
  EncodedSlackTokenQueryVariables,
  GetCustomerIssueInConsoleQueryResult,
  GetCustomerIssueInConsoleQueryVariables,
  GetOrgsQueryResult,
  GetOrgsQueryVariables,
  GetUsersQueryResult,
  GetUsersQueryVariables,
  SlackChannelsForConsoleQueryResult,
  SlackChannelsForConsoleQueryVariables,
  UsageStatsQueryResult,
  ApplicationEventsSubscriptionResult,
  ApplicationEventsSubscriptionVariables,
  CustomerEventsSubscriptionResult,
  CustomerEventsSubscriptionVariables,
} from 'common/graphql/console/types.ts';
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
  CustomEmailTemplate,
  CustomLinks,
  CustomNUXInput,
  CustomNUXStepInput,
  ConsoleApplicationOrganizationState,
  ConsoleApplicationUserState,
  ConsoleApplicationFragment,
  CustomNUXStepContentFragment,
  S3BucketFragment,
  AddConsoleUserToCustomerMutationResult,
  AddConsoleUserToCustomerMutationVariables,
  CreateApplicationForConsoleMutationResult,
  CreateApplicationForConsoleMutationVariables,
  CreateApplicationS3BucketMutationResult,
  CreateApplicationS3BucketMutationVariables,
  CreateCustomerForConsoleMutationResult,
  CreateCustomerForConsoleMutationVariables,
  CreateCustomerIssueInConsoleMutationResult,
  CreateCustomerIssueInConsoleMutationVariables,
  DeleteApplicationS3BucketMutationResult,
  DeleteApplicationS3BucketMutationVariables,
  GetSignedUploadURLMutationResult,
  GetSignedUploadURLMutationVariables,
  RemoveConsoleUserFromCustomerMutationResult,
  RemoveConsoleUserFromCustomerMutationVariables,
  RemoveSlackSupportOrgMutationResult,
  RemoveSlackSupportOrgMutationVariables,
  RequestAccessToCustomerMutationResult,
  RequestAccessToCustomerMutationVariables,
  StartCheckoutMutationResult,
  StartCheckoutMutationVariables,
  SyncUserMutationResult,
  SyncUserMutationVariables,
  UpdateAccessToCustomerMutationResult,
  UpdateAccessToCustomerMutationVariables,
  UpdateApplicationForConsoleMutationResult,
  UpdateApplicationForConsoleMutationVariables,
  UpdateApplicationS3BucketSecretMutationResult,
  UpdateApplicationS3BucketSecretMutationVariables,
  UpdateCustomerIssueInConsoleMutationResult,
  UpdateCustomerIssueInConsoleMutationVariables,
  UpdateCustomerNameMutationResult,
  UpdateCustomerNameMutationVariables,
  UpdateSupportBotMutationResult,
  UpdateSupportBotMutationVariables,
  UpdateUserDetailsMutationResult,
  UpdateUserDetailsMutationVariables,
  RedirectToStripeCustomerPortalMutationResult,
  ApplicationFlagQueryResult,
  ApplicationFlagQueryVariables,
  ApplicationForConsoleQueryResult,
  ApplicationForConsoleQueryVariables,
  ApplicationsQueryResult,
  ConsoleCordSessionTokenQueryResult,
  ConsoleCustomerIssuesQueryResult,
  ConsoleS3BucketQueryResult,
  ConsoleS3BucketQueryVariables,
  ConsoleUserQueryResult,
  ConsoleUsersQueryResult,
  EncodedSlackTokenQueryResult,
  EncodedSlackTokenQueryVariables,
  GetCustomerIssueInConsoleQueryResult,
  GetCustomerIssueInConsoleQueryVariables,
  GetOrgsQueryResult,
  GetOrgsQueryVariables,
  GetUsersQueryResult,
  GetUsersQueryVariables,
  SlackChannelsForConsoleQueryResult,
  SlackChannelsForConsoleQueryVariables,
  UsageStatsQueryResult,
  ApplicationEventsSubscriptionResult,
  ApplicationEventsSubscriptionVariables,
  CustomerEventsSubscriptionResult,
  CustomerEventsSubscriptionVariables,
};

import { default as AddConsoleUserToCustomerMutation } from 'external/src/entrypoints/console/graphql/mutations/AddConsoleUserToCustomer.graphql';
export { AddConsoleUserToCustomerMutation };
import { default as CreateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/mutations/CreateApplicationForConsoleMutation.graphql';
export { CreateApplicationForConsoleMutation };
import { default as CreateApplicationS3BucketMutation } from 'external/src/entrypoints/console/graphql/mutations/CreateApplicationS3BucketMutation.graphql';
export { CreateApplicationS3BucketMutation };
import { default as CreateCustomerForConsoleMutation } from 'external/src/entrypoints/console/graphql/mutations/CreateCustomerForConsoleMutation.graphql';
export { CreateCustomerForConsoleMutation };
import { default as CreateCustomerIssueInConsoleMutation } from 'external/src/entrypoints/console/graphql/mutations/CreateCustomerIssueInConsoleMutation.graphql';
export { CreateCustomerIssueInConsoleMutation };
import { default as DeleteApplicationS3BucketMutation } from 'external/src/entrypoints/console/graphql/mutations/DeleteApplicationS3BucketMutation.graphql';
export { DeleteApplicationS3BucketMutation };
import { default as GetSignedUploadURLMutation } from 'external/src/entrypoints/console/graphql/mutations/GetSignedUploadURL.graphql';
export { GetSignedUploadURLMutation };
import { default as RemoveConsoleUserFromCustomerMutation } from 'external/src/entrypoints/console/graphql/mutations/RemoveConsoleUserFromCustomer.graphql';
export { RemoveConsoleUserFromCustomerMutation };
import { default as RemoveSlackSupportOrgMutation } from 'external/src/entrypoints/console/graphql/mutations/RemoveSlackSupportOrg.graphql';
export { RemoveSlackSupportOrgMutation };
import { default as RequestAccessToCustomerMutation } from 'external/src/entrypoints/console/graphql/mutations/RequestAccessToCustomerMutation.graphql';
export { RequestAccessToCustomerMutation };
import { default as StartCheckoutMutation } from 'external/src/entrypoints/console/graphql/mutations/StartCheckoutMutation.graphql';
export { StartCheckoutMutation };
import { default as SyncUserMutation } from 'external/src/entrypoints/console/graphql/mutations/SyncUserMutation.graphql';
export { SyncUserMutation };
import { default as UpdateAccessToCustomerMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateAccessToCustomerMutation.graphql';
export { UpdateAccessToCustomerMutation };
import { default as UpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateApplicationForConsoleMutation.graphql';
export { UpdateApplicationForConsoleMutation };
import { default as UpdateApplicationS3BucketSecretMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateApplicationS3BucketSecretMutation.graphql';
export { UpdateApplicationS3BucketSecretMutation };
import { default as UpdateCustomerIssueInConsoleMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateCustomerIssueInConsoleMutation.graphql';
export { UpdateCustomerIssueInConsoleMutation };
import { default as UpdateCustomerNameMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateCustomerNameMutation.graphql';
export { UpdateCustomerNameMutation };
import { default as UpdateSupportBotMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateSupportBot.graphql';
export { UpdateSupportBotMutation };
import { default as UpdateUserDetailsMutation } from 'external/src/entrypoints/console/graphql/mutations/UpdateUserDetailsMutation.graphql';
export { UpdateUserDetailsMutation };
import { default as RedirectToStripeCustomerPortalMutation } from 'external/src/entrypoints/console/graphql/mutations/redirectToStripeCustomerPortal.graphql';
export { RedirectToStripeCustomerPortalMutation };
import { default as ApplicationFlagQuery } from 'external/src/entrypoints/console/graphql/queries/ApplicationFlagQuery.graphql';
export { ApplicationFlagQuery };
import { default as ApplicationForConsoleQuery } from 'external/src/entrypoints/console/graphql/queries/ApplicationForConsoleQuery.graphql';
export { ApplicationForConsoleQuery };
import { default as ApplicationsQuery } from 'external/src/entrypoints/console/graphql/queries/ApplicationsQuery.graphql';
export { ApplicationsQuery };
import { default as ConsoleCordSessionTokenQuery } from 'external/src/entrypoints/console/graphql/queries/ConsoleCordSessionToken.graphql';
export { ConsoleCordSessionTokenQuery };
import { default as ConsoleCustomerIssuesQuery } from 'external/src/entrypoints/console/graphql/queries/ConsoleCustomerIssuesQuery.graphql';
export { ConsoleCustomerIssuesQuery };
import { default as ConsoleS3BucketQuery } from 'external/src/entrypoints/console/graphql/queries/ConsoleS3BucketQuery.graphql';
export { ConsoleS3BucketQuery };
import { default as ConsoleUserQuery } from 'external/src/entrypoints/console/graphql/queries/ConsoleUserQuery.graphql';
export { ConsoleUserQuery };
import { default as ConsoleUsersQuery } from 'external/src/entrypoints/console/graphql/queries/ConsoleUsersQuery.graphql';
export { ConsoleUsersQuery };
import { default as EncodedSlackTokenQuery } from 'external/src/entrypoints/console/graphql/queries/EncodedSlackTokenQuery.graphql';
export { EncodedSlackTokenQuery };
import { default as GetCustomerIssueInConsoleQuery } from 'external/src/entrypoints/console/graphql/queries/GetCustomerIssueInConsole.graphql';
export { GetCustomerIssueInConsoleQuery };
import { default as GetOrgsQuery } from 'external/src/entrypoints/console/graphql/queries/GetOrgsQuery.graphql';
export { GetOrgsQuery };
import { default as GetUsersQuery } from 'external/src/entrypoints/console/graphql/queries/GetUsersQuery.graphql';
export { GetUsersQuery };
import { default as SlackChannelsForConsoleQuery } from 'external/src/entrypoints/console/graphql/queries/SlackChannelsForConsoleQuery.graphql';
export { SlackChannelsForConsoleQuery };
import { default as UsageStatsQuery } from 'external/src/entrypoints/console/graphql/queries/UsageStatsQuery.graphql';
export { UsageStatsQuery };
import { default as ApplicationEventsSubscription } from 'external/src/entrypoints/console/graphql/subscriptions/ApplicationEventsSubscription.graphql';
export { ApplicationEventsSubscription };
import { default as CustomerEventsSubscription } from 'external/src/entrypoints/console/graphql/subscriptions/CustomerEventsSubscription.graphql';
export { CustomerEventsSubscription };

export function useAddConsoleUserToCustomerMutation<T>(
  options?: MutationHookOptions<
    AddConsoleUserToCustomerMutationResult,
    AddConsoleUserToCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  AddConsoleUserToCustomerMutationResult,
  AddConsoleUserToCustomerMutationVariables
> {
  return useMutation<
    AddConsoleUserToCustomerMutationResult,
    AddConsoleUserToCustomerMutationVariables
  >(AddConsoleUserToCustomerMutation, options);
}

export function useCreateApplicationForConsoleMutation<T>(
  options?: MutationHookOptions<
    CreateApplicationForConsoleMutationResult,
    CreateApplicationForConsoleMutationVariables,
    T
  >,
): MutationReturnType<
  CreateApplicationForConsoleMutationResult,
  CreateApplicationForConsoleMutationVariables
> {
  return useMutation<
    CreateApplicationForConsoleMutationResult,
    CreateApplicationForConsoleMutationVariables
  >(CreateApplicationForConsoleMutation, options);
}

export function useCreateApplicationS3BucketMutation<T>(
  options?: MutationHookOptions<
    CreateApplicationS3BucketMutationResult,
    CreateApplicationS3BucketMutationVariables,
    T
  >,
): MutationReturnType<
  CreateApplicationS3BucketMutationResult,
  CreateApplicationS3BucketMutationVariables
> {
  return useMutation<
    CreateApplicationS3BucketMutationResult,
    CreateApplicationS3BucketMutationVariables
  >(CreateApplicationS3BucketMutation, options);
}

export function useCreateCustomerForConsoleMutation<T>(
  options?: MutationHookOptions<
    CreateCustomerForConsoleMutationResult,
    CreateCustomerForConsoleMutationVariables,
    T
  >,
): MutationReturnType<
  CreateCustomerForConsoleMutationResult,
  CreateCustomerForConsoleMutationVariables
> {
  return useMutation<
    CreateCustomerForConsoleMutationResult,
    CreateCustomerForConsoleMutationVariables
  >(CreateCustomerForConsoleMutation, options);
}

export function useCreateCustomerIssueInConsoleMutation<T>(
  options?: MutationHookOptions<
    CreateCustomerIssueInConsoleMutationResult,
    CreateCustomerIssueInConsoleMutationVariables,
    T
  >,
): MutationReturnType<
  CreateCustomerIssueInConsoleMutationResult,
  CreateCustomerIssueInConsoleMutationVariables
> {
  return useMutation<
    CreateCustomerIssueInConsoleMutationResult,
    CreateCustomerIssueInConsoleMutationVariables
  >(CreateCustomerIssueInConsoleMutation, options);
}

export function useDeleteApplicationS3BucketMutation<T>(
  options?: MutationHookOptions<
    DeleteApplicationS3BucketMutationResult,
    DeleteApplicationS3BucketMutationVariables,
    T
  >,
): MutationReturnType<
  DeleteApplicationS3BucketMutationResult,
  DeleteApplicationS3BucketMutationVariables
> {
  return useMutation<
    DeleteApplicationS3BucketMutationResult,
    DeleteApplicationS3BucketMutationVariables
  >(DeleteApplicationS3BucketMutation, options);
}

export function useGetSignedUploadURLMutation<T>(
  options?: MutationHookOptions<
    GetSignedUploadURLMutationResult,
    GetSignedUploadURLMutationVariables,
    T
  >,
): MutationReturnType<
  GetSignedUploadURLMutationResult,
  GetSignedUploadURLMutationVariables
> {
  return useMutation<
    GetSignedUploadURLMutationResult,
    GetSignedUploadURLMutationVariables
  >(GetSignedUploadURLMutation, options);
}

export function useRemoveConsoleUserFromCustomerMutation<T>(
  options?: MutationHookOptions<
    RemoveConsoleUserFromCustomerMutationResult,
    RemoveConsoleUserFromCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  RemoveConsoleUserFromCustomerMutationResult,
  RemoveConsoleUserFromCustomerMutationVariables
> {
  return useMutation<
    RemoveConsoleUserFromCustomerMutationResult,
    RemoveConsoleUserFromCustomerMutationVariables
  >(RemoveConsoleUserFromCustomerMutation, options);
}

export function useRemoveSlackSupportOrgMutation<T>(
  options?: MutationHookOptions<
    RemoveSlackSupportOrgMutationResult,
    RemoveSlackSupportOrgMutationVariables,
    T
  >,
): MutationReturnType<
  RemoveSlackSupportOrgMutationResult,
  RemoveSlackSupportOrgMutationVariables
> {
  return useMutation<
    RemoveSlackSupportOrgMutationResult,
    RemoveSlackSupportOrgMutationVariables
  >(RemoveSlackSupportOrgMutation, options);
}

export function useRequestAccessToCustomerMutation<T>(
  options?: MutationHookOptions<
    RequestAccessToCustomerMutationResult,
    RequestAccessToCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  RequestAccessToCustomerMutationResult,
  RequestAccessToCustomerMutationVariables
> {
  return useMutation<
    RequestAccessToCustomerMutationResult,
    RequestAccessToCustomerMutationVariables
  >(RequestAccessToCustomerMutation, options);
}

export function useStartCheckoutMutation<T>(
  options?: MutationHookOptions<
    StartCheckoutMutationResult,
    StartCheckoutMutationVariables,
    T
  >,
): MutationReturnType<
  StartCheckoutMutationResult,
  StartCheckoutMutationVariables
> {
  return useMutation<
    StartCheckoutMutationResult,
    StartCheckoutMutationVariables
  >(StartCheckoutMutation, options);
}

export function useSyncUserMutation<T>(
  options?: MutationHookOptions<
    SyncUserMutationResult,
    SyncUserMutationVariables,
    T
  >,
): MutationReturnType<SyncUserMutationResult, SyncUserMutationVariables> {
  return useMutation<SyncUserMutationResult, SyncUserMutationVariables>(
    SyncUserMutation,
    options,
  );
}

export function useUpdateAccessToCustomerMutation<T>(
  options?: MutationHookOptions<
    UpdateAccessToCustomerMutationResult,
    UpdateAccessToCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateAccessToCustomerMutationResult,
  UpdateAccessToCustomerMutationVariables
> {
  return useMutation<
    UpdateAccessToCustomerMutationResult,
    UpdateAccessToCustomerMutationVariables
  >(UpdateAccessToCustomerMutation, options);
}

export function useUpdateApplicationForConsoleMutation<T>(
  options?: MutationHookOptions<
    UpdateApplicationForConsoleMutationResult,
    UpdateApplicationForConsoleMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateApplicationForConsoleMutationResult,
  UpdateApplicationForConsoleMutationVariables
> {
  return useMutation<
    UpdateApplicationForConsoleMutationResult,
    UpdateApplicationForConsoleMutationVariables
  >(UpdateApplicationForConsoleMutation, options);
}

export function useUpdateApplicationS3BucketSecretMutation<T>(
  options?: MutationHookOptions<
    UpdateApplicationS3BucketSecretMutationResult,
    UpdateApplicationS3BucketSecretMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateApplicationS3BucketSecretMutationResult,
  UpdateApplicationS3BucketSecretMutationVariables
> {
  return useMutation<
    UpdateApplicationS3BucketSecretMutationResult,
    UpdateApplicationS3BucketSecretMutationVariables
  >(UpdateApplicationS3BucketSecretMutation, options);
}

export function useUpdateCustomerIssueInConsoleMutation<T>(
  options?: MutationHookOptions<
    UpdateCustomerIssueInConsoleMutationResult,
    UpdateCustomerIssueInConsoleMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateCustomerIssueInConsoleMutationResult,
  UpdateCustomerIssueInConsoleMutationVariables
> {
  return useMutation<
    UpdateCustomerIssueInConsoleMutationResult,
    UpdateCustomerIssueInConsoleMutationVariables
  >(UpdateCustomerIssueInConsoleMutation, options);
}

export function useUpdateCustomerNameMutation<T>(
  options?: MutationHookOptions<
    UpdateCustomerNameMutationResult,
    UpdateCustomerNameMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateCustomerNameMutationResult,
  UpdateCustomerNameMutationVariables
> {
  return useMutation<
    UpdateCustomerNameMutationResult,
    UpdateCustomerNameMutationVariables
  >(UpdateCustomerNameMutation, options);
}

export function useUpdateSupportBotMutation<T>(
  options?: MutationHookOptions<
    UpdateSupportBotMutationResult,
    UpdateSupportBotMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateSupportBotMutationResult,
  UpdateSupportBotMutationVariables
> {
  return useMutation<
    UpdateSupportBotMutationResult,
    UpdateSupportBotMutationVariables
  >(UpdateSupportBotMutation, options);
}

export function useUpdateUserDetailsMutation<T>(
  options?: MutationHookOptions<
    UpdateUserDetailsMutationResult,
    UpdateUserDetailsMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateUserDetailsMutationResult,
  UpdateUserDetailsMutationVariables
> {
  return useMutation<
    UpdateUserDetailsMutationResult,
    UpdateUserDetailsMutationVariables
  >(UpdateUserDetailsMutation, options);
}

export function useRedirectToStripeCustomerPortalMutation<T>(
  options?: MutationHookOptions<
    RedirectToStripeCustomerPortalMutationResult,
    Record<string, never>,
    T
  >,
): MutationReturnType<
  RedirectToStripeCustomerPortalMutationResult,
  Record<string, never>
> {
  return useMutation<
    RedirectToStripeCustomerPortalMutationResult,
    Record<string, never>
  >(RedirectToStripeCustomerPortalMutation, options);
}

export function useApplicationFlagQuery<T>(
  options: QueryHookOptions<
    ApplicationFlagQueryResult,
    ApplicationFlagQueryVariables,
    T
  >,
) {
  return useQuery<ApplicationFlagQueryResult, ApplicationFlagQueryVariables>(
    ApplicationFlagQuery,
    options,
  );
}

export function useLazyApplicationFlagQuery<T>(
  options?: LazyQueryHookOptions<
    ApplicationFlagQueryResult,
    ApplicationFlagQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ApplicationFlagQueryResult,
  ApplicationFlagQueryVariables
> {
  return useLazyQuery<
    ApplicationFlagQueryResult,
    ApplicationFlagQueryVariables
  >(ApplicationFlagQuery, options);
}

export function useApplicationForConsoleQuery<T>(
  options: QueryHookOptions<
    ApplicationForConsoleQueryResult,
    ApplicationForConsoleQueryVariables,
    T
  >,
) {
  return useQuery<
    ApplicationForConsoleQueryResult,
    ApplicationForConsoleQueryVariables
  >(ApplicationForConsoleQuery, options);
}

export function useLazyApplicationForConsoleQuery<T>(
  options?: LazyQueryHookOptions<
    ApplicationForConsoleQueryResult,
    ApplicationForConsoleQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ApplicationForConsoleQueryResult,
  ApplicationForConsoleQueryVariables
> {
  return useLazyQuery<
    ApplicationForConsoleQueryResult,
    ApplicationForConsoleQueryVariables
  >(ApplicationForConsoleQuery, options);
}

export function useApplicationsQuery<T>(
  options?: QueryHookOptions<ApplicationsQueryResult, Record<string, never>, T>,
) {
  return useQuery<ApplicationsQueryResult, Record<string, never>>(
    ApplicationsQuery,
    options,
  );
}

export function useLazyApplicationsQuery<T>(
  options?: LazyQueryHookOptions<
    ApplicationsQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<ApplicationsQueryResult, Record<string, never>> {
  return useLazyQuery<ApplicationsQueryResult, Record<string, never>>(
    ApplicationsQuery,
    options,
  );
}

export function useConsoleCordSessionTokenQuery<T>(
  options?: QueryHookOptions<
    ConsoleCordSessionTokenQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<ConsoleCordSessionTokenQueryResult, Record<string, never>>(
    ConsoleCordSessionTokenQuery,
    options,
  );
}

export function useLazyConsoleCordSessionTokenQuery<T>(
  options?: LazyQueryHookOptions<
    ConsoleCordSessionTokenQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<
  ConsoleCordSessionTokenQueryResult,
  Record<string, never>
> {
  return useLazyQuery<
    ConsoleCordSessionTokenQueryResult,
    Record<string, never>
  >(ConsoleCordSessionTokenQuery, options);
}

export function useConsoleCustomerIssuesQuery<T>(
  options?: QueryHookOptions<
    ConsoleCustomerIssuesQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<ConsoleCustomerIssuesQueryResult, Record<string, never>>(
    ConsoleCustomerIssuesQuery,
    options,
  );
}

export function useLazyConsoleCustomerIssuesQuery<T>(
  options?: LazyQueryHookOptions<
    ConsoleCustomerIssuesQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<
  ConsoleCustomerIssuesQueryResult,
  Record<string, never>
> {
  return useLazyQuery<ConsoleCustomerIssuesQueryResult, Record<string, never>>(
    ConsoleCustomerIssuesQuery,
    options,
  );
}

export function useConsoleS3BucketQuery<T>(
  options: QueryHookOptions<
    ConsoleS3BucketQueryResult,
    ConsoleS3BucketQueryVariables,
    T
  >,
) {
  return useQuery<ConsoleS3BucketQueryResult, ConsoleS3BucketQueryVariables>(
    ConsoleS3BucketQuery,
    options,
  );
}

export function useLazyConsoleS3BucketQuery<T>(
  options?: LazyQueryHookOptions<
    ConsoleS3BucketQueryResult,
    ConsoleS3BucketQueryVariables,
    T
  >,
): LazyQueryReturnType<
  ConsoleS3BucketQueryResult,
  ConsoleS3BucketQueryVariables
> {
  return useLazyQuery<
    ConsoleS3BucketQueryResult,
    ConsoleS3BucketQueryVariables
  >(ConsoleS3BucketQuery, options);
}

export function useConsoleUserQuery<T>(
  options?: QueryHookOptions<ConsoleUserQueryResult, Record<string, never>, T>,
) {
  return useQuery<ConsoleUserQueryResult, Record<string, never>>(
    ConsoleUserQuery,
    options,
  );
}

export function useLazyConsoleUserQuery<T>(
  options?: LazyQueryHookOptions<
    ConsoleUserQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<ConsoleUserQueryResult, Record<string, never>> {
  return useLazyQuery<ConsoleUserQueryResult, Record<string, never>>(
    ConsoleUserQuery,
    options,
  );
}

export function useConsoleUsersQuery<T>(
  options?: QueryHookOptions<ConsoleUsersQueryResult, Record<string, never>, T>,
) {
  return useQuery<ConsoleUsersQueryResult, Record<string, never>>(
    ConsoleUsersQuery,
    options,
  );
}

export function useLazyConsoleUsersQuery<T>(
  options?: LazyQueryHookOptions<
    ConsoleUsersQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<ConsoleUsersQueryResult, Record<string, never>> {
  return useLazyQuery<ConsoleUsersQueryResult, Record<string, never>>(
    ConsoleUsersQuery,
    options,
  );
}

export function useEncodedSlackTokenQuery<T>(
  options: QueryHookOptions<
    EncodedSlackTokenQueryResult,
    EncodedSlackTokenQueryVariables,
    T
  >,
) {
  return useQuery<
    EncodedSlackTokenQueryResult,
    EncodedSlackTokenQueryVariables
  >(EncodedSlackTokenQuery, options);
}

export function useLazyEncodedSlackTokenQuery<T>(
  options?: LazyQueryHookOptions<
    EncodedSlackTokenQueryResult,
    EncodedSlackTokenQueryVariables,
    T
  >,
): LazyQueryReturnType<
  EncodedSlackTokenQueryResult,
  EncodedSlackTokenQueryVariables
> {
  return useLazyQuery<
    EncodedSlackTokenQueryResult,
    EncodedSlackTokenQueryVariables
  >(EncodedSlackTokenQuery, options);
}

export function useGetCustomerIssueInConsoleQuery<T>(
  options: QueryHookOptions<
    GetCustomerIssueInConsoleQueryResult,
    GetCustomerIssueInConsoleQueryVariables,
    T
  >,
) {
  return useQuery<
    GetCustomerIssueInConsoleQueryResult,
    GetCustomerIssueInConsoleQueryVariables
  >(GetCustomerIssueInConsoleQuery, options);
}

export function useLazyGetCustomerIssueInConsoleQuery<T>(
  options?: LazyQueryHookOptions<
    GetCustomerIssueInConsoleQueryResult,
    GetCustomerIssueInConsoleQueryVariables,
    T
  >,
): LazyQueryReturnType<
  GetCustomerIssueInConsoleQueryResult,
  GetCustomerIssueInConsoleQueryVariables
> {
  return useLazyQuery<
    GetCustomerIssueInConsoleQueryResult,
    GetCustomerIssueInConsoleQueryVariables
  >(GetCustomerIssueInConsoleQuery, options);
}

export function useGetOrgsQuery<T>(
  options: QueryHookOptions<GetOrgsQueryResult, GetOrgsQueryVariables, T>,
) {
  return useQuery<GetOrgsQueryResult, GetOrgsQueryVariables>(
    GetOrgsQuery,
    options,
  );
}

export function useLazyGetOrgsQuery<T>(
  options?: LazyQueryHookOptions<GetOrgsQueryResult, GetOrgsQueryVariables, T>,
): LazyQueryReturnType<GetOrgsQueryResult, GetOrgsQueryVariables> {
  return useLazyQuery<GetOrgsQueryResult, GetOrgsQueryVariables>(
    GetOrgsQuery,
    options,
  );
}

export function useGetUsersQuery<T>(
  options: QueryHookOptions<GetUsersQueryResult, GetUsersQueryVariables, T>,
) {
  return useQuery<GetUsersQueryResult, GetUsersQueryVariables>(
    GetUsersQuery,
    options,
  );
}

export function useLazyGetUsersQuery<T>(
  options?: LazyQueryHookOptions<
    GetUsersQueryResult,
    GetUsersQueryVariables,
    T
  >,
): LazyQueryReturnType<GetUsersQueryResult, GetUsersQueryVariables> {
  return useLazyQuery<GetUsersQueryResult, GetUsersQueryVariables>(
    GetUsersQuery,
    options,
  );
}

export function useSlackChannelsForConsoleQuery<T>(
  options: QueryHookOptions<
    SlackChannelsForConsoleQueryResult,
    SlackChannelsForConsoleQueryVariables,
    T
  >,
) {
  return useQuery<
    SlackChannelsForConsoleQueryResult,
    SlackChannelsForConsoleQueryVariables
  >(SlackChannelsForConsoleQuery, options);
}

export function useLazySlackChannelsForConsoleQuery<T>(
  options?: LazyQueryHookOptions<
    SlackChannelsForConsoleQueryResult,
    SlackChannelsForConsoleQueryVariables,
    T
  >,
): LazyQueryReturnType<
  SlackChannelsForConsoleQueryResult,
  SlackChannelsForConsoleQueryVariables
> {
  return useLazyQuery<
    SlackChannelsForConsoleQueryResult,
    SlackChannelsForConsoleQueryVariables
  >(SlackChannelsForConsoleQuery, options);
}

export function useUsageStatsQuery<T>(
  options?: QueryHookOptions<UsageStatsQueryResult, Record<string, never>, T>,
) {
  return useQuery<UsageStatsQueryResult, Record<string, never>>(
    UsageStatsQuery,
    options,
  );
}

export function useLazyUsageStatsQuery<T>(
  options?: LazyQueryHookOptions<
    UsageStatsQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<UsageStatsQueryResult, Record<string, never>> {
  return useLazyQuery<UsageStatsQueryResult, Record<string, never>>(
    UsageStatsQuery,
    options,
  );
}

export function useApplicationEventsSubscription<T>(
  options: SubscriptionHookOptions<
    ApplicationEventsSubscriptionResult,
    ApplicationEventsSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    ApplicationEventsSubscriptionResult,
    ApplicationEventsSubscriptionVariables
  >(ApplicationEventsSubscription, { fetchPolicy: 'no-cache', ...options });
}

export function useCustomerEventsSubscription<T>(
  options: SubscriptionHookOptions<
    CustomerEventsSubscriptionResult,
    CustomerEventsSubscriptionVariables,
    T
  >,
) {
  return useSubscription<
    CustomerEventsSubscriptionResult,
    CustomerEventsSubscriptionVariables
  >(CustomerEventsSubscription, { fetchPolicy: 'no-cache', ...options });
}

export type QueryTypes = {
  ApplicationFlagQuery: {
    variables: ApplicationFlagQueryVariables;
    result: ApplicationFlagQueryResult;
  };
  ApplicationForConsoleQuery: {
    variables: ApplicationForConsoleQueryVariables;
    result: ApplicationForConsoleQueryResult;
  };
  ApplicationsQuery: {
    variables: Record<string, never>;
    result: ApplicationsQueryResult;
  };
  ConsoleCordSessionTokenQuery: {
    variables: Record<string, never>;
    result: ConsoleCordSessionTokenQueryResult;
  };
  ConsoleCustomerIssuesQuery: {
    variables: Record<string, never>;
    result: ConsoleCustomerIssuesQueryResult;
  };
  ConsoleS3BucketQuery: {
    variables: ConsoleS3BucketQueryVariables;
    result: ConsoleS3BucketQueryResult;
  };
  ConsoleUserQuery: {
    variables: Record<string, never>;
    result: ConsoleUserQueryResult;
  };
  ConsoleUsersQuery: {
    variables: Record<string, never>;
    result: ConsoleUsersQueryResult;
  };
  EncodedSlackTokenQuery: {
    variables: EncodedSlackTokenQueryVariables;
    result: EncodedSlackTokenQueryResult;
  };
  GetCustomerIssueInConsoleQuery: {
    variables: GetCustomerIssueInConsoleQueryVariables;
    result: GetCustomerIssueInConsoleQueryResult;
  };
  GetOrgsQuery: {
    variables: GetOrgsQueryVariables;
    result: GetOrgsQueryResult;
  };
  GetUsersQuery: {
    variables: GetUsersQueryVariables;
    result: GetUsersQueryResult;
  };
  SlackChannelsForConsoleQuery: {
    variables: SlackChannelsForConsoleQueryVariables;
    result: SlackChannelsForConsoleQueryResult;
  };
  UsageStatsQuery: {
    variables: Record<string, never>;
    result: UsageStatsQueryResult;
  };
};

export const queries: Record<keyof QueryTypes, DocumentNode> = {
  ApplicationFlagQuery: ApplicationFlagQuery,
  ApplicationForConsoleQuery: ApplicationForConsoleQuery,
  ApplicationsQuery: ApplicationsQuery,
  ConsoleCordSessionTokenQuery: ConsoleCordSessionTokenQuery,
  ConsoleCustomerIssuesQuery: ConsoleCustomerIssuesQuery,
  ConsoleS3BucketQuery: ConsoleS3BucketQuery,
  ConsoleUserQuery: ConsoleUserQuery,
  ConsoleUsersQuery: ConsoleUsersQuery,
  EncodedSlackTokenQuery: EncodedSlackTokenQuery,
  GetCustomerIssueInConsoleQuery: GetCustomerIssueInConsoleQuery,
  GetOrgsQuery: GetOrgsQuery,
  GetUsersQuery: GetUsersQuery,
  SlackChannelsForConsoleQuery: SlackChannelsForConsoleQuery,
  UsageStatsQuery: UsageStatsQuery,
};

export type MutationTypes = {
  AddConsoleUserToCustomerMutation: {
    variables: AddConsoleUserToCustomerMutationVariables;
    result: AddConsoleUserToCustomerMutationResult;
  };
  CreateApplicationForConsoleMutation: {
    variables: CreateApplicationForConsoleMutationVariables;
    result: CreateApplicationForConsoleMutationResult;
  };
  CreateApplicationS3BucketMutation: {
    variables: CreateApplicationS3BucketMutationVariables;
    result: CreateApplicationS3BucketMutationResult;
  };
  CreateCustomerForConsoleMutation: {
    variables: CreateCustomerForConsoleMutationVariables;
    result: CreateCustomerForConsoleMutationResult;
  };
  CreateCustomerIssueInConsoleMutation: {
    variables: CreateCustomerIssueInConsoleMutationVariables;
    result: CreateCustomerIssueInConsoleMutationResult;
  };
  DeleteApplicationS3BucketMutation: {
    variables: DeleteApplicationS3BucketMutationVariables;
    result: DeleteApplicationS3BucketMutationResult;
  };
  GetSignedUploadURLMutation: {
    variables: GetSignedUploadURLMutationVariables;
    result: GetSignedUploadURLMutationResult;
  };
  RemoveConsoleUserFromCustomerMutation: {
    variables: RemoveConsoleUserFromCustomerMutationVariables;
    result: RemoveConsoleUserFromCustomerMutationResult;
  };
  RemoveSlackSupportOrgMutation: {
    variables: RemoveSlackSupportOrgMutationVariables;
    result: RemoveSlackSupportOrgMutationResult;
  };
  RequestAccessToCustomerMutation: {
    variables: RequestAccessToCustomerMutationVariables;
    result: RequestAccessToCustomerMutationResult;
  };
  StartCheckoutMutation: {
    variables: StartCheckoutMutationVariables;
    result: StartCheckoutMutationResult;
  };
  SyncUserMutation: {
    variables: SyncUserMutationVariables;
    result: SyncUserMutationResult;
  };
  UpdateAccessToCustomerMutation: {
    variables: UpdateAccessToCustomerMutationVariables;
    result: UpdateAccessToCustomerMutationResult;
  };
  UpdateApplicationForConsoleMutation: {
    variables: UpdateApplicationForConsoleMutationVariables;
    result: UpdateApplicationForConsoleMutationResult;
  };
  UpdateApplicationS3BucketSecretMutation: {
    variables: UpdateApplicationS3BucketSecretMutationVariables;
    result: UpdateApplicationS3BucketSecretMutationResult;
  };
  UpdateCustomerIssueInConsoleMutation: {
    variables: UpdateCustomerIssueInConsoleMutationVariables;
    result: UpdateCustomerIssueInConsoleMutationResult;
  };
  UpdateCustomerNameMutation: {
    variables: UpdateCustomerNameMutationVariables;
    result: UpdateCustomerNameMutationResult;
  };
  UpdateSupportBotMutation: {
    variables: UpdateSupportBotMutationVariables;
    result: UpdateSupportBotMutationResult;
  };
  UpdateUserDetailsMutation: {
    variables: UpdateUserDetailsMutationVariables;
    result: UpdateUserDetailsMutationResult;
  };
  RedirectToStripeCustomerPortalMutation: {
    variables: Record<string, never>;
    result: RedirectToStripeCustomerPortalMutationResult;
  };
};

export const mutations: Record<keyof MutationTypes, DocumentNode> = {
  AddConsoleUserToCustomerMutation: AddConsoleUserToCustomerMutation,
  CreateApplicationForConsoleMutation: CreateApplicationForConsoleMutation,
  CreateApplicationS3BucketMutation: CreateApplicationS3BucketMutation,
  CreateCustomerForConsoleMutation: CreateCustomerForConsoleMutation,
  CreateCustomerIssueInConsoleMutation: CreateCustomerIssueInConsoleMutation,
  DeleteApplicationS3BucketMutation: DeleteApplicationS3BucketMutation,
  GetSignedUploadURLMutation: GetSignedUploadURLMutation,
  RemoveConsoleUserFromCustomerMutation: RemoveConsoleUserFromCustomerMutation,
  RemoveSlackSupportOrgMutation: RemoveSlackSupportOrgMutation,
  RequestAccessToCustomerMutation: RequestAccessToCustomerMutation,
  StartCheckoutMutation: StartCheckoutMutation,
  SyncUserMutation: SyncUserMutation,
  UpdateAccessToCustomerMutation: UpdateAccessToCustomerMutation,
  UpdateApplicationForConsoleMutation: UpdateApplicationForConsoleMutation,
  UpdateApplicationS3BucketSecretMutation:
    UpdateApplicationS3BucketSecretMutation,
  UpdateCustomerIssueInConsoleMutation: UpdateCustomerIssueInConsoleMutation,
  UpdateCustomerNameMutation: UpdateCustomerNameMutation,
  UpdateSupportBotMutation: UpdateSupportBotMutation,
  UpdateUserDetailsMutation: UpdateUserDetailsMutation,
  RedirectToStripeCustomerPortalMutation:
    RedirectToStripeCustomerPortalMutation,
};

export type SubscriptionTypes = {
  ApplicationEventsSubscription: {
    variables: ApplicationEventsSubscriptionVariables;
    result: ApplicationEventsSubscriptionResult;
  };
  CustomerEventsSubscription: {
    variables: CustomerEventsSubscriptionVariables;
    result: CustomerEventsSubscriptionResult;
  };
};

export const subscriptions: Record<keyof SubscriptionTypes, DocumentNode> = {
  ApplicationEventsSubscription: ApplicationEventsSubscription,
  CustomerEventsSubscription: CustomerEventsSubscription,
};
