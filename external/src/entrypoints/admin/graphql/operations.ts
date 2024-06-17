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
  RuleProvider,
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
  ProviderRuleType,
  ApplicationTierType,
  ApplicationEnvironment,
  ProviderDocumentMutatorType,
  ProviderRuleTestMatchType,
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
  PageContextTransformationInputType,
  PageContextTransformationType,
  CSSMutatorConfig,
  CustomerSlackMessageType,
  AddonInput,
  AdminApplicationFragment,
  CustomNUXStepContentFragment,
  HeimdallSwitchFragment,
  ProviderDocumentMutatorFragment,
  ProviderFragment,
  ProviderRuleFragment,
  ProviderRuleTestFragment,
  S3BucketFragment,
  AddConsoleUserToCustomerMutationResult,
  AddConsoleUserToCustomerMutationVariables,
  RemoveCustomerIssueSubscriptionMutationResult,
  RemoveCustomerIssueSubscriptionMutationVariables,
  AdminPlatformUsersQueryResult,
  AllCustomerIssuesQueryResult,
  ApplicationQueryResult,
  ApplicationQueryVariables,
  CordSessionTokenQueryResult,
  CreateApplicationCustomS3BucketMutationResult,
  CreateApplicationCustomS3BucketMutationVariables,
  CreateApplicationMutationResult,
  CreateApplicationMutationVariables,
  CreateCustomerIssueMutationResult,
  CreateCustomerIssueMutationVariables,
  CreateCustomerMutationResult,
  CreateCustomerMutationVariables,
  CreateHeimdallSwitchMutationResult,
  CreateHeimdallSwitchMutationVariables,
  CreateStripeCustomerMutationResult,
  CreateStripeCustomerMutationVariables,
  CreateStripeSubscriptionMutationResult,
  CreateStripeSubscriptionMutationVariables,
  CustomerApplicationsQueryResult,
  CustomerApplicationsQueryVariables,
  CustomerConsoleUsersQueryResult,
  CustomerConsoleUsersQueryVariables,
  CustomerIssueCordSessionTokenQueryResult,
  CustomerIssueCordSessionTokenQueryVariables,
  CustomerIssueQueryResult,
  CustomerIssueQueryVariables,
  CustomerIssuesQueryResult,
  CustomerIssuesQueryVariables,
  CustomerQueryResult,
  CustomerQueryVariables,
  CustomerSlackChannelQueryResult,
  DeleteApplicationCustomS3BucketMutationResult,
  DeleteApplicationCustomS3BucketMutationVariables,
  DeleteCustomerIssueMutationResult,
  DeleteCustomerIssueMutationVariables,
  FlipHeimdallSwitchMutationResult,
  FlipHeimdallSwitchMutationVariables,
  GoRedirectAdminQueryResult,
  GoRedirectAdminQueryVariables,
  HeimdallSwitchAdminQueryResult,
  HeimdallSwitchAdminQueryVariables,
  HeimdallSwitchesQueryResult,
  PageContextForURLQueryResult,
  PageContextForURLQueryVariables,
  RemoveConsoleUserFromCustomerMutationResult,
  RemoveConsoleUserFromCustomerMutationVariables,
  AddCustomerIssueSubscriptionMutationResult,
  AddCustomerIssueSubscriptionMutationVariables,
  S3BucketQueryResult,
  S3BucketQueryVariables,
  SelectQueryResult,
  SelectQueryVariables,
  SendSlackMessageToCustomersMutationResult,
  SendSlackMessageToCustomersMutationVariables,
  SetGoRedirectMutationResult,
  SetGoRedirectMutationVariables,
  TestTokenQueryResult,
  ToggleInternalFlagOnOrgMutationResult,
  ToggleInternalFlagOnOrgMutationVariables,
  UpdateApplicationMutationResult,
  UpdateApplicationMutationVariables,
  UpdateCustomS3BucketSecretMutationResult,
  UpdateCustomS3BucketSecretMutationVariables,
  UpdateCustomerIssueMutationResult,
  UpdateCustomerIssueMutationVariables,
  UpdateCustomerMutationResult,
  UpdateCustomerMutationVariables,
} from 'common/graphql/admin/types.ts';
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
  RuleProvider,
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
  ProviderRuleType,
  ApplicationTierType,
  ApplicationEnvironment,
  ProviderDocumentMutatorType,
  ProviderRuleTestMatchType,
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
  PageContextTransformationInputType,
  PageContextTransformationType,
  CSSMutatorConfig,
  CustomerSlackMessageType,
  AddonInput,
  AdminApplicationFragment,
  CustomNUXStepContentFragment,
  HeimdallSwitchFragment,
  ProviderDocumentMutatorFragment,
  ProviderFragment,
  ProviderRuleFragment,
  ProviderRuleTestFragment,
  S3BucketFragment,
  AddConsoleUserToCustomerMutationResult,
  AddConsoleUserToCustomerMutationVariables,
  RemoveCustomerIssueSubscriptionMutationResult,
  RemoveCustomerIssueSubscriptionMutationVariables,
  AdminPlatformUsersQueryResult,
  AllCustomerIssuesQueryResult,
  ApplicationQueryResult,
  ApplicationQueryVariables,
  CordSessionTokenQueryResult,
  CreateApplicationCustomS3BucketMutationResult,
  CreateApplicationCustomS3BucketMutationVariables,
  CreateApplicationMutationResult,
  CreateApplicationMutationVariables,
  CreateCustomerIssueMutationResult,
  CreateCustomerIssueMutationVariables,
  CreateCustomerMutationResult,
  CreateCustomerMutationVariables,
  CreateHeimdallSwitchMutationResult,
  CreateHeimdallSwitchMutationVariables,
  CreateStripeCustomerMutationResult,
  CreateStripeCustomerMutationVariables,
  CreateStripeSubscriptionMutationResult,
  CreateStripeSubscriptionMutationVariables,
  CustomerApplicationsQueryResult,
  CustomerApplicationsQueryVariables,
  CustomerConsoleUsersQueryResult,
  CustomerConsoleUsersQueryVariables,
  CustomerIssueCordSessionTokenQueryResult,
  CustomerIssueCordSessionTokenQueryVariables,
  CustomerIssueQueryResult,
  CustomerIssueQueryVariables,
  CustomerIssuesQueryResult,
  CustomerIssuesQueryVariables,
  CustomerQueryResult,
  CustomerQueryVariables,
  CustomerSlackChannelQueryResult,
  DeleteApplicationCustomS3BucketMutationResult,
  DeleteApplicationCustomS3BucketMutationVariables,
  DeleteCustomerIssueMutationResult,
  DeleteCustomerIssueMutationVariables,
  FlipHeimdallSwitchMutationResult,
  FlipHeimdallSwitchMutationVariables,
  GoRedirectAdminQueryResult,
  GoRedirectAdminQueryVariables,
  HeimdallSwitchAdminQueryResult,
  HeimdallSwitchAdminQueryVariables,
  HeimdallSwitchesQueryResult,
  PageContextForURLQueryResult,
  PageContextForURLQueryVariables,
  RemoveConsoleUserFromCustomerMutationResult,
  RemoveConsoleUserFromCustomerMutationVariables,
  AddCustomerIssueSubscriptionMutationResult,
  AddCustomerIssueSubscriptionMutationVariables,
  S3BucketQueryResult,
  S3BucketQueryVariables,
  SelectQueryResult,
  SelectQueryVariables,
  SendSlackMessageToCustomersMutationResult,
  SendSlackMessageToCustomersMutationVariables,
  SetGoRedirectMutationResult,
  SetGoRedirectMutationVariables,
  TestTokenQueryResult,
  ToggleInternalFlagOnOrgMutationResult,
  ToggleInternalFlagOnOrgMutationVariables,
  UpdateApplicationMutationResult,
  UpdateApplicationMutationVariables,
  UpdateCustomS3BucketSecretMutationResult,
  UpdateCustomS3BucketSecretMutationVariables,
  UpdateCustomerIssueMutationResult,
  UpdateCustomerIssueMutationVariables,
  UpdateCustomerMutationResult,
  UpdateCustomerMutationVariables,
};

import { default as AddConsoleUserToCustomerMutation } from 'external/src/entrypoints/admin/graphql/AddConsoleUserToCustomerMutation.graphql';
export { AddConsoleUserToCustomerMutation };
import { default as RemoveCustomerIssueSubscriptionMutation } from 'external/src/entrypoints/admin/graphql/AddCustomerIssueSubscriptionMutation.graphql';
export { RemoveCustomerIssueSubscriptionMutation };
import { default as AdminPlatformUsersQuery } from 'external/src/entrypoints/admin/graphql/AdminPlatformUsersQuery.graphql';
export { AdminPlatformUsersQuery };
import { default as AllCustomerIssuesQuery } from 'external/src/entrypoints/admin/graphql/AllCustomerIssuesQuery.graphql';
export { AllCustomerIssuesQuery };
import { default as ApplicationQuery } from 'external/src/entrypoints/admin/graphql/ApplicationQuery.graphql';
export { ApplicationQuery };
import { default as CordSessionTokenQuery } from 'external/src/entrypoints/admin/graphql/CordSessionTokenQuery.graphql';
export { CordSessionTokenQuery };
import { default as CreateApplicationCustomS3BucketMutation } from 'external/src/entrypoints/admin/graphql/CreateApplicationCustomS3BucketMutation.graphql';
export { CreateApplicationCustomS3BucketMutation };
import { default as CreateApplicationMutation } from 'external/src/entrypoints/admin/graphql/CreateApplicationMutation.graphql';
export { CreateApplicationMutation };
import { default as CreateCustomerIssueMutation } from 'external/src/entrypoints/admin/graphql/CreateCustomerIssueMutation.graphql';
export { CreateCustomerIssueMutation };
import { default as CreateCustomerMutation } from 'external/src/entrypoints/admin/graphql/CreateCustomerMutation.graphql';
export { CreateCustomerMutation };
import { default as CreateHeimdallSwitchMutation } from 'external/src/entrypoints/admin/graphql/CreateHeimdallSwitchMutation.graphql';
export { CreateHeimdallSwitchMutation };
import { default as CreateStripeCustomerMutation } from 'external/src/entrypoints/admin/graphql/CreateStripeCustomer.graphql';
export { CreateStripeCustomerMutation };
import { default as CreateStripeSubscriptionMutation } from 'external/src/entrypoints/admin/graphql/CreateStripeSubscriptionMutation.graphql';
export { CreateStripeSubscriptionMutation };
import { default as CustomerApplicationsQuery } from 'external/src/entrypoints/admin/graphql/CustomerApplicationsQuery.graphql';
export { CustomerApplicationsQuery };
import { default as CustomerConsoleUsersQuery } from 'external/src/entrypoints/admin/graphql/CustomerConsoleUsersQuery.graphql';
export { CustomerConsoleUsersQuery };
import { default as CustomerIssueCordSessionTokenQuery } from 'external/src/entrypoints/admin/graphql/CustomerIssueCordSessionTokenQuery.graphql';
export { CustomerIssueCordSessionTokenQuery };
import { default as CustomerIssueQuery } from 'external/src/entrypoints/admin/graphql/CustomerIssueQuery.graphql';
export { CustomerIssueQuery };
import { default as CustomerIssuesQuery } from 'external/src/entrypoints/admin/graphql/CustomerIssuesQuery.graphql';
export { CustomerIssuesQuery };
import { default as CustomerQuery } from 'external/src/entrypoints/admin/graphql/CustomerQuery.graphql';
export { CustomerQuery };
import { default as CustomerSlackChannelQuery } from 'external/src/entrypoints/admin/graphql/CustomerSlackChannelsQuery.graphql';
export { CustomerSlackChannelQuery };
import { default as DeleteApplicationCustomS3BucketMutation } from 'external/src/entrypoints/admin/graphql/DeleteApplicationCustomS3BucketMutation.graphql';
export { DeleteApplicationCustomS3BucketMutation };
import { default as DeleteCustomerIssueMutation } from 'external/src/entrypoints/admin/graphql/DeleteCustomerIssueMutation.graphql';
export { DeleteCustomerIssueMutation };
import { default as FlipHeimdallSwitchMutation } from 'external/src/entrypoints/admin/graphql/FlipHeimdallSwitchMutation.graphql';
export { FlipHeimdallSwitchMutation };
import { default as GoRedirectAdminQuery } from 'external/src/entrypoints/admin/graphql/GoRedirectQuery.graphql';
export { GoRedirectAdminQuery };
import { default as HeimdallSwitchAdminQuery } from 'external/src/entrypoints/admin/graphql/HeimdallSwitchQuery.graphql';
export { HeimdallSwitchAdminQuery };
import { default as HeimdallSwitchesQuery } from 'external/src/entrypoints/admin/graphql/HeimdallSwitchesQuery.graphql';
export { HeimdallSwitchesQuery };
import { default as PageContextForURLQuery } from 'external/src/entrypoints/admin/graphql/PageContextForURLQuery.graphql';
export { PageContextForURLQuery };
import { default as RemoveConsoleUserFromCustomerMutation } from 'external/src/entrypoints/admin/graphql/RemoveConsoleUserFromCustomerMutation.graphql';
export { RemoveConsoleUserFromCustomerMutation };
import { default as AddCustomerIssueSubscriptionMutation } from 'external/src/entrypoints/admin/graphql/RemoveCustomerIssueSubscriptionMutation.graphql';
export { AddCustomerIssueSubscriptionMutation };
import { default as S3BucketQuery } from 'external/src/entrypoints/admin/graphql/S3BucketQuery.graphql';
export { S3BucketQuery };
import { default as SelectQuery } from 'external/src/entrypoints/admin/graphql/SelectQuery.graphql';
export { SelectQuery };
import { default as SendSlackMessageToCustomersMutation } from 'external/src/entrypoints/admin/graphql/SendSlackMessageToCustomersMutation.graphql';
export { SendSlackMessageToCustomersMutation };
import { default as SetGoRedirectMutation } from 'external/src/entrypoints/admin/graphql/SetGoRedirectMutation.graphql';
export { SetGoRedirectMutation };
import { default as TestTokenQuery } from 'external/src/entrypoints/admin/graphql/TestTokenQuery.graphql';
export { TestTokenQuery };
import { default as ToggleInternalFlagOnOrgMutation } from 'external/src/entrypoints/admin/graphql/ToggleInternalFlagOnOrg.graphql';
export { ToggleInternalFlagOnOrgMutation };
import { default as UpdateApplicationMutation } from 'external/src/entrypoints/admin/graphql/UpdateApplicationMutation.graphql';
export { UpdateApplicationMutation };
import { default as UpdateCustomS3BucketSecretMutation } from 'external/src/entrypoints/admin/graphql/UpdateCustomS3BucketSecretMutation.graphql';
export { UpdateCustomS3BucketSecretMutation };
import { default as UpdateCustomerIssueMutation } from 'external/src/entrypoints/admin/graphql/UpdateCustomerIssueMutation.graphql';
export { UpdateCustomerIssueMutation };
import { default as UpdateCustomerMutation } from 'external/src/entrypoints/admin/graphql/UpdateCustomerMutation.graphql';
export { UpdateCustomerMutation };

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

export function useRemoveCustomerIssueSubscriptionMutation<T>(
  options?: MutationHookOptions<
    RemoveCustomerIssueSubscriptionMutationResult,
    RemoveCustomerIssueSubscriptionMutationVariables,
    T
  >,
): MutationReturnType<
  RemoveCustomerIssueSubscriptionMutationResult,
  RemoveCustomerIssueSubscriptionMutationVariables
> {
  return useMutation<
    RemoveCustomerIssueSubscriptionMutationResult,
    RemoveCustomerIssueSubscriptionMutationVariables
  >(RemoveCustomerIssueSubscriptionMutation, options);
}

export function useAdminPlatformUsersQuery<T>(
  options?: QueryHookOptions<
    AdminPlatformUsersQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<AdminPlatformUsersQueryResult, Record<string, never>>(
    AdminPlatformUsersQuery,
    options,
  );
}

export function useLazyAdminPlatformUsersQuery<T>(
  options?: LazyQueryHookOptions<
    AdminPlatformUsersQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<AdminPlatformUsersQueryResult, Record<string, never>> {
  return useLazyQuery<AdminPlatformUsersQueryResult, Record<string, never>>(
    AdminPlatformUsersQuery,
    options,
  );
}

export function useAllCustomerIssuesQuery<T>(
  options?: QueryHookOptions<
    AllCustomerIssuesQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<AllCustomerIssuesQueryResult, Record<string, never>>(
    AllCustomerIssuesQuery,
    options,
  );
}

export function useLazyAllCustomerIssuesQuery<T>(
  options?: LazyQueryHookOptions<
    AllCustomerIssuesQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<AllCustomerIssuesQueryResult, Record<string, never>> {
  return useLazyQuery<AllCustomerIssuesQueryResult, Record<string, never>>(
    AllCustomerIssuesQuery,
    options,
  );
}

export function useApplicationQuery<T>(
  options: QueryHookOptions<
    ApplicationQueryResult,
    ApplicationQueryVariables,
    T
  >,
) {
  return useQuery<ApplicationQueryResult, ApplicationQueryVariables>(
    ApplicationQuery,
    options,
  );
}

export function useLazyApplicationQuery<T>(
  options?: LazyQueryHookOptions<
    ApplicationQueryResult,
    ApplicationQueryVariables,
    T
  >,
): LazyQueryReturnType<ApplicationQueryResult, ApplicationQueryVariables> {
  return useLazyQuery<ApplicationQueryResult, ApplicationQueryVariables>(
    ApplicationQuery,
    options,
  );
}

export function useCordSessionTokenQuery<T>(
  options?: QueryHookOptions<
    CordSessionTokenQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<CordSessionTokenQueryResult, Record<string, never>>(
    CordSessionTokenQuery,
    options,
  );
}

export function useLazyCordSessionTokenQuery<T>(
  options?: LazyQueryHookOptions<
    CordSessionTokenQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<CordSessionTokenQueryResult, Record<string, never>> {
  return useLazyQuery<CordSessionTokenQueryResult, Record<string, never>>(
    CordSessionTokenQuery,
    options,
  );
}

export function useCreateApplicationCustomS3BucketMutation<T>(
  options?: MutationHookOptions<
    CreateApplicationCustomS3BucketMutationResult,
    CreateApplicationCustomS3BucketMutationVariables,
    T
  >,
): MutationReturnType<
  CreateApplicationCustomS3BucketMutationResult,
  CreateApplicationCustomS3BucketMutationVariables
> {
  return useMutation<
    CreateApplicationCustomS3BucketMutationResult,
    CreateApplicationCustomS3BucketMutationVariables
  >(CreateApplicationCustomS3BucketMutation, options);
}

export function useCreateApplicationMutation<T>(
  options?: MutationHookOptions<
    CreateApplicationMutationResult,
    CreateApplicationMutationVariables,
    T
  >,
): MutationReturnType<
  CreateApplicationMutationResult,
  CreateApplicationMutationVariables
> {
  return useMutation<
    CreateApplicationMutationResult,
    CreateApplicationMutationVariables
  >(CreateApplicationMutation, options);
}

export function useCreateCustomerIssueMutation<T>(
  options?: MutationHookOptions<
    CreateCustomerIssueMutationResult,
    CreateCustomerIssueMutationVariables,
    T
  >,
): MutationReturnType<
  CreateCustomerIssueMutationResult,
  CreateCustomerIssueMutationVariables
> {
  return useMutation<
    CreateCustomerIssueMutationResult,
    CreateCustomerIssueMutationVariables
  >(CreateCustomerIssueMutation, options);
}

export function useCreateCustomerMutation<T>(
  options?: MutationHookOptions<
    CreateCustomerMutationResult,
    CreateCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  CreateCustomerMutationResult,
  CreateCustomerMutationVariables
> {
  return useMutation<
    CreateCustomerMutationResult,
    CreateCustomerMutationVariables
  >(CreateCustomerMutation, options);
}

export function useCreateHeimdallSwitchMutation<T>(
  options?: MutationHookOptions<
    CreateHeimdallSwitchMutationResult,
    CreateHeimdallSwitchMutationVariables,
    T
  >,
): MutationReturnType<
  CreateHeimdallSwitchMutationResult,
  CreateHeimdallSwitchMutationVariables
> {
  return useMutation<
    CreateHeimdallSwitchMutationResult,
    CreateHeimdallSwitchMutationVariables
  >(CreateHeimdallSwitchMutation, options);
}

export function useCreateStripeCustomerMutation<T>(
  options?: MutationHookOptions<
    CreateStripeCustomerMutationResult,
    CreateStripeCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  CreateStripeCustomerMutationResult,
  CreateStripeCustomerMutationVariables
> {
  return useMutation<
    CreateStripeCustomerMutationResult,
    CreateStripeCustomerMutationVariables
  >(CreateStripeCustomerMutation, options);
}

export function useCreateStripeSubscriptionMutation<T>(
  options?: MutationHookOptions<
    CreateStripeSubscriptionMutationResult,
    CreateStripeSubscriptionMutationVariables,
    T
  >,
): MutationReturnType<
  CreateStripeSubscriptionMutationResult,
  CreateStripeSubscriptionMutationVariables
> {
  return useMutation<
    CreateStripeSubscriptionMutationResult,
    CreateStripeSubscriptionMutationVariables
  >(CreateStripeSubscriptionMutation, options);
}

export function useCustomerApplicationsQuery<T>(
  options: QueryHookOptions<
    CustomerApplicationsQueryResult,
    CustomerApplicationsQueryVariables,
    T
  >,
) {
  return useQuery<
    CustomerApplicationsQueryResult,
    CustomerApplicationsQueryVariables
  >(CustomerApplicationsQuery, options);
}

export function useLazyCustomerApplicationsQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerApplicationsQueryResult,
    CustomerApplicationsQueryVariables,
    T
  >,
): LazyQueryReturnType<
  CustomerApplicationsQueryResult,
  CustomerApplicationsQueryVariables
> {
  return useLazyQuery<
    CustomerApplicationsQueryResult,
    CustomerApplicationsQueryVariables
  >(CustomerApplicationsQuery, options);
}

export function useCustomerConsoleUsersQuery<T>(
  options: QueryHookOptions<
    CustomerConsoleUsersQueryResult,
    CustomerConsoleUsersQueryVariables,
    T
  >,
) {
  return useQuery<
    CustomerConsoleUsersQueryResult,
    CustomerConsoleUsersQueryVariables
  >(CustomerConsoleUsersQuery, options);
}

export function useLazyCustomerConsoleUsersQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerConsoleUsersQueryResult,
    CustomerConsoleUsersQueryVariables,
    T
  >,
): LazyQueryReturnType<
  CustomerConsoleUsersQueryResult,
  CustomerConsoleUsersQueryVariables
> {
  return useLazyQuery<
    CustomerConsoleUsersQueryResult,
    CustomerConsoleUsersQueryVariables
  >(CustomerConsoleUsersQuery, options);
}

export function useCustomerIssueCordSessionTokenQuery<T>(
  options: QueryHookOptions<
    CustomerIssueCordSessionTokenQueryResult,
    CustomerIssueCordSessionTokenQueryVariables,
    T
  >,
) {
  return useQuery<
    CustomerIssueCordSessionTokenQueryResult,
    CustomerIssueCordSessionTokenQueryVariables
  >(CustomerIssueCordSessionTokenQuery, options);
}

export function useLazyCustomerIssueCordSessionTokenQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerIssueCordSessionTokenQueryResult,
    CustomerIssueCordSessionTokenQueryVariables,
    T
  >,
): LazyQueryReturnType<
  CustomerIssueCordSessionTokenQueryResult,
  CustomerIssueCordSessionTokenQueryVariables
> {
  return useLazyQuery<
    CustomerIssueCordSessionTokenQueryResult,
    CustomerIssueCordSessionTokenQueryVariables
  >(CustomerIssueCordSessionTokenQuery, options);
}

export function useCustomerIssueQuery<T>(
  options: QueryHookOptions<
    CustomerIssueQueryResult,
    CustomerIssueQueryVariables,
    T
  >,
) {
  return useQuery<CustomerIssueQueryResult, CustomerIssueQueryVariables>(
    CustomerIssueQuery,
    options,
  );
}

export function useLazyCustomerIssueQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerIssueQueryResult,
    CustomerIssueQueryVariables,
    T
  >,
): LazyQueryReturnType<CustomerIssueQueryResult, CustomerIssueQueryVariables> {
  return useLazyQuery<CustomerIssueQueryResult, CustomerIssueQueryVariables>(
    CustomerIssueQuery,
    options,
  );
}

export function useCustomerIssuesQuery<T>(
  options: QueryHookOptions<
    CustomerIssuesQueryResult,
    CustomerIssuesQueryVariables,
    T
  >,
) {
  return useQuery<CustomerIssuesQueryResult, CustomerIssuesQueryVariables>(
    CustomerIssuesQuery,
    options,
  );
}

export function useLazyCustomerIssuesQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerIssuesQueryResult,
    CustomerIssuesQueryVariables,
    T
  >,
): LazyQueryReturnType<
  CustomerIssuesQueryResult,
  CustomerIssuesQueryVariables
> {
  return useLazyQuery<CustomerIssuesQueryResult, CustomerIssuesQueryVariables>(
    CustomerIssuesQuery,
    options,
  );
}

export function useCustomerQuery<T>(
  options: QueryHookOptions<CustomerQueryResult, CustomerQueryVariables, T>,
) {
  return useQuery<CustomerQueryResult, CustomerQueryVariables>(
    CustomerQuery,
    options,
  );
}

export function useLazyCustomerQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerQueryResult,
    CustomerQueryVariables,
    T
  >,
): LazyQueryReturnType<CustomerQueryResult, CustomerQueryVariables> {
  return useLazyQuery<CustomerQueryResult, CustomerQueryVariables>(
    CustomerQuery,
    options,
  );
}

export function useCustomerSlackChannelQuery<T>(
  options?: QueryHookOptions<
    CustomerSlackChannelQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<CustomerSlackChannelQueryResult, Record<string, never>>(
    CustomerSlackChannelQuery,
    options,
  );
}

export function useLazyCustomerSlackChannelQuery<T>(
  options?: LazyQueryHookOptions<
    CustomerSlackChannelQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<CustomerSlackChannelQueryResult, Record<string, never>> {
  return useLazyQuery<CustomerSlackChannelQueryResult, Record<string, never>>(
    CustomerSlackChannelQuery,
    options,
  );
}

export function useDeleteApplicationCustomS3BucketMutation<T>(
  options?: MutationHookOptions<
    DeleteApplicationCustomS3BucketMutationResult,
    DeleteApplicationCustomS3BucketMutationVariables,
    T
  >,
): MutationReturnType<
  DeleteApplicationCustomS3BucketMutationResult,
  DeleteApplicationCustomS3BucketMutationVariables
> {
  return useMutation<
    DeleteApplicationCustomS3BucketMutationResult,
    DeleteApplicationCustomS3BucketMutationVariables
  >(DeleteApplicationCustomS3BucketMutation, options);
}

export function useDeleteCustomerIssueMutation<T>(
  options?: MutationHookOptions<
    DeleteCustomerIssueMutationResult,
    DeleteCustomerIssueMutationVariables,
    T
  >,
): MutationReturnType<
  DeleteCustomerIssueMutationResult,
  DeleteCustomerIssueMutationVariables
> {
  return useMutation<
    DeleteCustomerIssueMutationResult,
    DeleteCustomerIssueMutationVariables
  >(DeleteCustomerIssueMutation, options);
}

export function useFlipHeimdallSwitchMutation<T>(
  options?: MutationHookOptions<
    FlipHeimdallSwitchMutationResult,
    FlipHeimdallSwitchMutationVariables,
    T
  >,
): MutationReturnType<
  FlipHeimdallSwitchMutationResult,
  FlipHeimdallSwitchMutationVariables
> {
  return useMutation<
    FlipHeimdallSwitchMutationResult,
    FlipHeimdallSwitchMutationVariables
  >(FlipHeimdallSwitchMutation, options);
}

export function useGoRedirectAdminQuery<T>(
  options: QueryHookOptions<
    GoRedirectAdminQueryResult,
    GoRedirectAdminQueryVariables,
    T
  >,
) {
  return useQuery<GoRedirectAdminQueryResult, GoRedirectAdminQueryVariables>(
    GoRedirectAdminQuery,
    options,
  );
}

export function useLazyGoRedirectAdminQuery<T>(
  options?: LazyQueryHookOptions<
    GoRedirectAdminQueryResult,
    GoRedirectAdminQueryVariables,
    T
  >,
): LazyQueryReturnType<
  GoRedirectAdminQueryResult,
  GoRedirectAdminQueryVariables
> {
  return useLazyQuery<
    GoRedirectAdminQueryResult,
    GoRedirectAdminQueryVariables
  >(GoRedirectAdminQuery, options);
}

export function useHeimdallSwitchAdminQuery<T>(
  options: QueryHookOptions<
    HeimdallSwitchAdminQueryResult,
    HeimdallSwitchAdminQueryVariables,
    T
  >,
) {
  return useQuery<
    HeimdallSwitchAdminQueryResult,
    HeimdallSwitchAdminQueryVariables
  >(HeimdallSwitchAdminQuery, options);
}

export function useLazyHeimdallSwitchAdminQuery<T>(
  options?: LazyQueryHookOptions<
    HeimdallSwitchAdminQueryResult,
    HeimdallSwitchAdminQueryVariables,
    T
  >,
): LazyQueryReturnType<
  HeimdallSwitchAdminQueryResult,
  HeimdallSwitchAdminQueryVariables
> {
  return useLazyQuery<
    HeimdallSwitchAdminQueryResult,
    HeimdallSwitchAdminQueryVariables
  >(HeimdallSwitchAdminQuery, options);
}

export function useHeimdallSwitchesQuery<T>(
  options?: QueryHookOptions<
    HeimdallSwitchesQueryResult,
    Record<string, never>,
    T
  >,
) {
  return useQuery<HeimdallSwitchesQueryResult, Record<string, never>>(
    HeimdallSwitchesQuery,
    options,
  );
}

export function useLazyHeimdallSwitchesQuery<T>(
  options?: LazyQueryHookOptions<
    HeimdallSwitchesQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<HeimdallSwitchesQueryResult, Record<string, never>> {
  return useLazyQuery<HeimdallSwitchesQueryResult, Record<string, never>>(
    HeimdallSwitchesQuery,
    options,
  );
}

export function usePageContextForURLQuery<T>(
  options: QueryHookOptions<
    PageContextForURLQueryResult,
    PageContextForURLQueryVariables,
    T
  >,
) {
  return useQuery<
    PageContextForURLQueryResult,
    PageContextForURLQueryVariables
  >(PageContextForURLQuery, options);
}

export function useLazyPageContextForURLQuery<T>(
  options?: LazyQueryHookOptions<
    PageContextForURLQueryResult,
    PageContextForURLQueryVariables,
    T
  >,
): LazyQueryReturnType<
  PageContextForURLQueryResult,
  PageContextForURLQueryVariables
> {
  return useLazyQuery<
    PageContextForURLQueryResult,
    PageContextForURLQueryVariables
  >(PageContextForURLQuery, options);
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

export function useAddCustomerIssueSubscriptionMutation<T>(
  options?: MutationHookOptions<
    AddCustomerIssueSubscriptionMutationResult,
    AddCustomerIssueSubscriptionMutationVariables,
    T
  >,
): MutationReturnType<
  AddCustomerIssueSubscriptionMutationResult,
  AddCustomerIssueSubscriptionMutationVariables
> {
  return useMutation<
    AddCustomerIssueSubscriptionMutationResult,
    AddCustomerIssueSubscriptionMutationVariables
  >(AddCustomerIssueSubscriptionMutation, options);
}

export function useS3BucketQuery<T>(
  options: QueryHookOptions<S3BucketQueryResult, S3BucketQueryVariables, T>,
) {
  return useQuery<S3BucketQueryResult, S3BucketQueryVariables>(
    S3BucketQuery,
    options,
  );
}

export function useLazyS3BucketQuery<T>(
  options?: LazyQueryHookOptions<
    S3BucketQueryResult,
    S3BucketQueryVariables,
    T
  >,
): LazyQueryReturnType<S3BucketQueryResult, S3BucketQueryVariables> {
  return useLazyQuery<S3BucketQueryResult, S3BucketQueryVariables>(
    S3BucketQuery,
    options,
  );
}

export function useSelectQuery<T>(
  options: QueryHookOptions<SelectQueryResult, SelectQueryVariables, T>,
) {
  return useQuery<SelectQueryResult, SelectQueryVariables>(
    SelectQuery,
    options,
  );
}

export function useLazySelectQuery<T>(
  options?: LazyQueryHookOptions<SelectQueryResult, SelectQueryVariables, T>,
): LazyQueryReturnType<SelectQueryResult, SelectQueryVariables> {
  return useLazyQuery<SelectQueryResult, SelectQueryVariables>(
    SelectQuery,
    options,
  );
}

export function useSendSlackMessageToCustomersMutation<T>(
  options?: MutationHookOptions<
    SendSlackMessageToCustomersMutationResult,
    SendSlackMessageToCustomersMutationVariables,
    T
  >,
): MutationReturnType<
  SendSlackMessageToCustomersMutationResult,
  SendSlackMessageToCustomersMutationVariables
> {
  return useMutation<
    SendSlackMessageToCustomersMutationResult,
    SendSlackMessageToCustomersMutationVariables
  >(SendSlackMessageToCustomersMutation, options);
}

export function useSetGoRedirectMutation<T>(
  options?: MutationHookOptions<
    SetGoRedirectMutationResult,
    SetGoRedirectMutationVariables,
    T
  >,
): MutationReturnType<
  SetGoRedirectMutationResult,
  SetGoRedirectMutationVariables
> {
  return useMutation<
    SetGoRedirectMutationResult,
    SetGoRedirectMutationVariables
  >(SetGoRedirectMutation, options);
}

export function useTestTokenQuery<T>(
  options?: QueryHookOptions<TestTokenQueryResult, Record<string, never>, T>,
) {
  return useQuery<TestTokenQueryResult, Record<string, never>>(
    TestTokenQuery,
    options,
  );
}

export function useLazyTestTokenQuery<T>(
  options?: LazyQueryHookOptions<
    TestTokenQueryResult,
    Record<string, never>,
    T
  >,
): LazyQueryReturnType<TestTokenQueryResult, Record<string, never>> {
  return useLazyQuery<TestTokenQueryResult, Record<string, never>>(
    TestTokenQuery,
    options,
  );
}

export function useToggleInternalFlagOnOrgMutation<T>(
  options?: MutationHookOptions<
    ToggleInternalFlagOnOrgMutationResult,
    ToggleInternalFlagOnOrgMutationVariables,
    T
  >,
): MutationReturnType<
  ToggleInternalFlagOnOrgMutationResult,
  ToggleInternalFlagOnOrgMutationVariables
> {
  return useMutation<
    ToggleInternalFlagOnOrgMutationResult,
    ToggleInternalFlagOnOrgMutationVariables
  >(ToggleInternalFlagOnOrgMutation, options);
}

export function useUpdateApplicationMutation<T>(
  options?: MutationHookOptions<
    UpdateApplicationMutationResult,
    UpdateApplicationMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateApplicationMutationResult,
  UpdateApplicationMutationVariables
> {
  return useMutation<
    UpdateApplicationMutationResult,
    UpdateApplicationMutationVariables
  >(UpdateApplicationMutation, options);
}

export function useUpdateCustomS3BucketSecretMutation<T>(
  options?: MutationHookOptions<
    UpdateCustomS3BucketSecretMutationResult,
    UpdateCustomS3BucketSecretMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateCustomS3BucketSecretMutationResult,
  UpdateCustomS3BucketSecretMutationVariables
> {
  return useMutation<
    UpdateCustomS3BucketSecretMutationResult,
    UpdateCustomS3BucketSecretMutationVariables
  >(UpdateCustomS3BucketSecretMutation, options);
}

export function useUpdateCustomerIssueMutation<T>(
  options?: MutationHookOptions<
    UpdateCustomerIssueMutationResult,
    UpdateCustomerIssueMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateCustomerIssueMutationResult,
  UpdateCustomerIssueMutationVariables
> {
  return useMutation<
    UpdateCustomerIssueMutationResult,
    UpdateCustomerIssueMutationVariables
  >(UpdateCustomerIssueMutation, options);
}

export function useUpdateCustomerMutation<T>(
  options?: MutationHookOptions<
    UpdateCustomerMutationResult,
    UpdateCustomerMutationVariables,
    T
  >,
): MutationReturnType<
  UpdateCustomerMutationResult,
  UpdateCustomerMutationVariables
> {
  return useMutation<
    UpdateCustomerMutationResult,
    UpdateCustomerMutationVariables
  >(UpdateCustomerMutation, options);
}

export type QueryTypes = {
  AdminPlatformUsersQuery: {
    variables: Record<string, never>;
    result: AdminPlatformUsersQueryResult;
  };
  AllCustomerIssuesQuery: {
    variables: Record<string, never>;
    result: AllCustomerIssuesQueryResult;
  };
  ApplicationQuery: {
    variables: ApplicationQueryVariables;
    result: ApplicationQueryResult;
  };
  CordSessionTokenQuery: {
    variables: Record<string, never>;
    result: CordSessionTokenQueryResult;
  };
  CustomerApplicationsQuery: {
    variables: CustomerApplicationsQueryVariables;
    result: CustomerApplicationsQueryResult;
  };
  CustomerConsoleUsersQuery: {
    variables: CustomerConsoleUsersQueryVariables;
    result: CustomerConsoleUsersQueryResult;
  };
  CustomerIssueCordSessionTokenQuery: {
    variables: CustomerIssueCordSessionTokenQueryVariables;
    result: CustomerIssueCordSessionTokenQueryResult;
  };
  CustomerIssueQuery: {
    variables: CustomerIssueQueryVariables;
    result: CustomerIssueQueryResult;
  };
  CustomerIssuesQuery: {
    variables: CustomerIssuesQueryVariables;
    result: CustomerIssuesQueryResult;
  };
  CustomerQuery: {
    variables: CustomerQueryVariables;
    result: CustomerQueryResult;
  };
  CustomerSlackChannelQuery: {
    variables: Record<string, never>;
    result: CustomerSlackChannelQueryResult;
  };
  GoRedirectAdminQuery: {
    variables: GoRedirectAdminQueryVariables;
    result: GoRedirectAdminQueryResult;
  };
  HeimdallSwitchAdminQuery: {
    variables: HeimdallSwitchAdminQueryVariables;
    result: HeimdallSwitchAdminQueryResult;
  };
  HeimdallSwitchesQuery: {
    variables: Record<string, never>;
    result: HeimdallSwitchesQueryResult;
  };
  PageContextForURLQuery: {
    variables: PageContextForURLQueryVariables;
    result: PageContextForURLQueryResult;
  };
  S3BucketQuery: {
    variables: S3BucketQueryVariables;
    result: S3BucketQueryResult;
  };
  SelectQuery: { variables: SelectQueryVariables; result: SelectQueryResult };
  TestTokenQuery: {
    variables: Record<string, never>;
    result: TestTokenQueryResult;
  };
};

export const queries: Record<keyof QueryTypes, DocumentNode> = {
  AdminPlatformUsersQuery: AdminPlatformUsersQuery,
  AllCustomerIssuesQuery: AllCustomerIssuesQuery,
  ApplicationQuery: ApplicationQuery,
  CordSessionTokenQuery: CordSessionTokenQuery,
  CustomerApplicationsQuery: CustomerApplicationsQuery,
  CustomerConsoleUsersQuery: CustomerConsoleUsersQuery,
  CustomerIssueCordSessionTokenQuery: CustomerIssueCordSessionTokenQuery,
  CustomerIssueQuery: CustomerIssueQuery,
  CustomerIssuesQuery: CustomerIssuesQuery,
  CustomerQuery: CustomerQuery,
  CustomerSlackChannelQuery: CustomerSlackChannelQuery,
  GoRedirectAdminQuery: GoRedirectAdminQuery,
  HeimdallSwitchAdminQuery: HeimdallSwitchAdminQuery,
  HeimdallSwitchesQuery: HeimdallSwitchesQuery,
  PageContextForURLQuery: PageContextForURLQuery,
  S3BucketQuery: S3BucketQuery,
  SelectQuery: SelectQuery,
  TestTokenQuery: TestTokenQuery,
};

export type MutationTypes = {
  AddConsoleUserToCustomerMutation: {
    variables: AddConsoleUserToCustomerMutationVariables;
    result: AddConsoleUserToCustomerMutationResult;
  };
  RemoveCustomerIssueSubscriptionMutation: {
    variables: RemoveCustomerIssueSubscriptionMutationVariables;
    result: RemoveCustomerIssueSubscriptionMutationResult;
  };
  CreateApplicationCustomS3BucketMutation: {
    variables: CreateApplicationCustomS3BucketMutationVariables;
    result: CreateApplicationCustomS3BucketMutationResult;
  };
  CreateApplicationMutation: {
    variables: CreateApplicationMutationVariables;
    result: CreateApplicationMutationResult;
  };
  CreateCustomerIssueMutation: {
    variables: CreateCustomerIssueMutationVariables;
    result: CreateCustomerIssueMutationResult;
  };
  CreateCustomerMutation: {
    variables: CreateCustomerMutationVariables;
    result: CreateCustomerMutationResult;
  };
  CreateHeimdallSwitchMutation: {
    variables: CreateHeimdallSwitchMutationVariables;
    result: CreateHeimdallSwitchMutationResult;
  };
  CreateStripeCustomerMutation: {
    variables: CreateStripeCustomerMutationVariables;
    result: CreateStripeCustomerMutationResult;
  };
  CreateStripeSubscriptionMutation: {
    variables: CreateStripeSubscriptionMutationVariables;
    result: CreateStripeSubscriptionMutationResult;
  };
  DeleteApplicationCustomS3BucketMutation: {
    variables: DeleteApplicationCustomS3BucketMutationVariables;
    result: DeleteApplicationCustomS3BucketMutationResult;
  };
  DeleteCustomerIssueMutation: {
    variables: DeleteCustomerIssueMutationVariables;
    result: DeleteCustomerIssueMutationResult;
  };
  FlipHeimdallSwitchMutation: {
    variables: FlipHeimdallSwitchMutationVariables;
    result: FlipHeimdallSwitchMutationResult;
  };
  RemoveConsoleUserFromCustomerMutation: {
    variables: RemoveConsoleUserFromCustomerMutationVariables;
    result: RemoveConsoleUserFromCustomerMutationResult;
  };
  AddCustomerIssueSubscriptionMutation: {
    variables: AddCustomerIssueSubscriptionMutationVariables;
    result: AddCustomerIssueSubscriptionMutationResult;
  };
  SendSlackMessageToCustomersMutation: {
    variables: SendSlackMessageToCustomersMutationVariables;
    result: SendSlackMessageToCustomersMutationResult;
  };
  SetGoRedirectMutation: {
    variables: SetGoRedirectMutationVariables;
    result: SetGoRedirectMutationResult;
  };
  ToggleInternalFlagOnOrgMutation: {
    variables: ToggleInternalFlagOnOrgMutationVariables;
    result: ToggleInternalFlagOnOrgMutationResult;
  };
  UpdateApplicationMutation: {
    variables: UpdateApplicationMutationVariables;
    result: UpdateApplicationMutationResult;
  };
  UpdateCustomS3BucketSecretMutation: {
    variables: UpdateCustomS3BucketSecretMutationVariables;
    result: UpdateCustomS3BucketSecretMutationResult;
  };
  UpdateCustomerIssueMutation: {
    variables: UpdateCustomerIssueMutationVariables;
    result: UpdateCustomerIssueMutationResult;
  };
  UpdateCustomerMutation: {
    variables: UpdateCustomerMutationVariables;
    result: UpdateCustomerMutationResult;
  };
};

export const mutations: Record<keyof MutationTypes, DocumentNode> = {
  AddConsoleUserToCustomerMutation: AddConsoleUserToCustomerMutation,
  RemoveCustomerIssueSubscriptionMutation:
    RemoveCustomerIssueSubscriptionMutation,
  CreateApplicationCustomS3BucketMutation:
    CreateApplicationCustomS3BucketMutation,
  CreateApplicationMutation: CreateApplicationMutation,
  CreateCustomerIssueMutation: CreateCustomerIssueMutation,
  CreateCustomerMutation: CreateCustomerMutation,
  CreateHeimdallSwitchMutation: CreateHeimdallSwitchMutation,
  CreateStripeCustomerMutation: CreateStripeCustomerMutation,
  CreateStripeSubscriptionMutation: CreateStripeSubscriptionMutation,
  DeleteApplicationCustomS3BucketMutation:
    DeleteApplicationCustomS3BucketMutation,
  DeleteCustomerIssueMutation: DeleteCustomerIssueMutation,
  FlipHeimdallSwitchMutation: FlipHeimdallSwitchMutation,
  RemoveConsoleUserFromCustomerMutation: RemoveConsoleUserFromCustomerMutation,
  AddCustomerIssueSubscriptionMutation: AddCustomerIssueSubscriptionMutation,
  SendSlackMessageToCustomersMutation: SendSlackMessageToCustomersMutation,
  SetGoRedirectMutation: SetGoRedirectMutation,
  ToggleInternalFlagOnOrgMutation: ToggleInternalFlagOnOrgMutation,
  UpdateApplicationMutation: UpdateApplicationMutation,
  UpdateCustomS3BucketSecretMutation: UpdateCustomS3BucketSecretMutation,
  UpdateCustomerIssueMutation: UpdateCustomerIssueMutation,
  UpdateCustomerMutation: UpdateCustomerMutation,
};
