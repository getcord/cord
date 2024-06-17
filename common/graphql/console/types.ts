// @generated
// to regenerate, run "npm run codegen"
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Maybe, Nullable } from 'common/types/index.ts';
import type { FrontendScalars } from 'common/types/scalars.ts';

type Int = number;
type Float = number;

export type DateTime = FrontendScalars['DateTime'];

export type ElementIdentifierVersion =
  FrontendScalars['ElementIdentifierVersion'];

export type SimpleValue = FrontendScalars['SimpleValue'];

export type JSON = FrontendScalars['JSON'];

export type JSONObject = FrontendScalars['JSONObject'];

export type Context = FrontendScalars['Context'];

export type Metadata = FrontendScalars['Metadata'];

export type SimpleTranslationParameters =
  FrontendScalars['SimpleTranslationParameters'];

export type MessageContent = FrontendScalars['MessageContent'];

export type RuleProvider = FrontendScalars['RuleProvider'];

export type UUID = FrontendScalars['UUID'];

export type JsonObjectReducerData = FrontendScalars['JsonObjectReducerData'];

export type FileUploadStatus =
  | 'uploaded'
  | 'uploading'
  | 'failed'
  | 'cancelled';

export type ViewerThreadFilter = 'subscribed' | 'mentioned';

export type ThreadFilterInput = {
  metadata: Maybe<Metadata>;
  viewer: Maybe<Array<ViewerThreadFilter>>;
};

export type SortBy =
  | 'first_message_timestamp'
  | 'most_recent_message_timestamp';

export type SortDirection = 'ascending' | 'descending';

export type LocationFilter = {
  value: Context;
  partialMatch: boolean;
};

export type ThreadSortInput = {
  sortBy: SortBy;
  sortDirection: SortDirection;
};

export type NotificationFilterInput = {
  metadata: Maybe<Metadata>;
  location: Maybe<Context>;
  partialMatch: Maybe<boolean>;
  organizationID: Maybe<string>;
};

export type UserFilterInput = {
  metadata: Maybe<Metadata>;
};

export type MarkThreadsSeenInput = {
  seen: boolean;
  externalThreadID: Maybe<string>;
  location: Maybe<LocationFilter>;
  resolved: Maybe<boolean>;
  metadata: Maybe<JSONObject>;
  viewer: Maybe<Array<ViewerThreadFilter>>;
};

export type TargetType = 'monacoEditor' | 'reactTree' | 'konvaCanvas';

export type PresenceLiveQueryInput = {
  matcher: JSONObject;
  excludeDurable: boolean;
  exactMatch: boolean;
};

export type CustomerType = 'verified' | 'sample';

export type CustomerImplementationStage =
  | 'launched'
  | 'implementing'
  | 'proof_of_concept'
  | 'inactive';

export type PricingTier = 'free' | 'pro' | 'scale';

export type BillingType = 'stripe' | 'manual';

export type BillingStatus = 'active' | 'unpaid' | 'inactive';

export type StripeSubscriptionRecurrence = 'monthly' | 'yearly';

export type ProviderRuleType = 'deny' | 'allow';

export type ApplicationTierType = 'free' | 'starter' | 'premium';

export type ApplicationEnvironment =
  | 'production'
  | 'staging'
  | 'sample'
  | 'sampletoken'
  | 'demo';

export type ProviderDocumentMutatorType =
  | 'default_css'
  | 'fixed_elements'
  | 'custom_css';

export type ProviderRuleTestMatchType = 'allow' | 'deny' | 'none';

export type OrgMemberState = 'inactive' | 'active' | 'deleted';

export type UserType = 'person' | 'bot';

export type ThirdPartyConnectionType =
  | 'asana'
  | 'jira'
  | 'linear'
  | 'trello'
  | 'monday';

export type SlackStateLinkingType = 'link_org';

export type ImportedSlackMessageType = 'reply' | 'supportBotReply';

export type MessageType = 'action_message' | 'user_message';

export type PageContextInput = {
  data: Context;
  providerID: Maybe<UUID>;
};

export type OrganizationState = 'inactive' | 'active';

export type LogEventInput = {
  pageLoadID: Maybe<UUID>;
  installationID: Maybe<UUID>;
  eventNumber: Int;
  clientTimestamp: DateTime;
  type: string;
  payload: JSONObject;
  metadata: JSONObject;
  logLevel: LogLevelType;
  customEventMetadata: Maybe<JSONObject>;
};

export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';

export type FileAttachmentInput = {
  id: UUID;
  fileID: UUID;
};

export type Point2DInput = {
  x: Float;
  y: Float;
};

export type AnnotationAttachmentInput = {
  id: UUID;
  screenshotFileID: Maybe<UUID>;
  blurredScreenshotFileID: Maybe<UUID>;
  location: Maybe<DocumentLocationInput>;
  customLocation: Maybe<Context>;
  customHighlightedTextConfig: Maybe<HighlightedTextConfigInput>;
  customLabel: Maybe<string>;
  coordsRelativeToTarget: Maybe<Point2DInput>;
};

export type ScreenshotAttachmentInput = {
  id: UUID;
  screenshotFileID: Maybe<UUID>;
  blurredScreenshotFileID: Maybe<UUID>;
};

export type DocumentLocationInput = {
  selector: string;
  x: Float;
  y: Float;
  iframeSelectors: Maybe<Array<string>>;
  onChart: Maybe<boolean>;
  textConfig: Maybe<LocationTextConfigInput>;
  elementIdentifier: Maybe<ElementIdentifierInput>;
  multimediaConfig: Maybe<MultimediaConfigInput>;
  highlightedTextConfig: Maybe<HighlightedTextConfigInput>;
  additionalTargetData: Maybe<AdditionalTargetDataInput>;
};

export type AdditionalTargetDataInput = {
  targetType: TargetType;
  monacoEditor: Maybe<MonacoEditorInput>;
  reactTree: Maybe<ReactTreeInput>;
  konvaCanvas: Maybe<KonvaCanvasInput>;
};

export type MonacoEditorInput = {
  monacoID: Maybe<string>;
  lineNumber: Int;
};

export type ReactTreeInput = {
  key: string;
  treeID: Maybe<string>;
  prefixCls: Maybe<string>;
};

export type KonvaCanvasInput = {
  x: Float;
  y: Float;
};

export type MultimediaConfigInput = {
  currentTime: Int;
};

export type HighlightedTextConfigInput = {
  startElementSelector: string;
  endElementSelector: string;
  startNodeIndex: Int;
  startNodeOffset: Int;
  endNodeIndex: Int;
  endNodeOffset: Int;
  selectedText: string;
  textToDisplay: Maybe<string>;
};

export type LocationTextConfigInput = {
  selectedCharOffset: Int;
  textToMatch: string;
  textToMatchOffset: Int;
  nodeIndex: Int;
  xVsPointer: Float;
  yVsPointer: Float;
};

export type ElementIdentifierInput = {
  version: ElementIdentifierVersion;
  identifier: JSONObject;
};

export type TaskInput = {
  id: UUID;
  done: boolean;
  assigneeIDs: Array<UUID>;
  todos: Array<TaskTodoInput>;
  doneStatusUpdate: Maybe<TaskDoneStatusUpdate>;
  type: TaskInputType;
};

export type TaskTodoInput = {
  id: UUID;
  done: boolean;
};

export type TaskDoneStatusUpdate = 'update' | 'remove' | 'none';

export type TaskInputType =
  | 'cord'
  | 'asana'
  | 'jira'
  | 'linear'
  | 'trello'
  | 'monday';

export type CreateThreadMessageInput = {
  messageID: UUID;
  threadID: UUID;
  pageContext: Maybe<PageContextInput>;
  pageName: Maybe<string>;
  createNewThread: boolean;
  newMessageMetadata: Maybe<Metadata>;
  newThreadMetadata: Maybe<Metadata>;
  content: Maybe<MessageContent>;
  externalContent: Maybe<MessageContent>;
  url: Maybe<string>;
  fileAttachments: Array<FileAttachmentInput>;
  annotationAttachments: Array<AnnotationAttachmentInput>;
  screenshotAttachment: Maybe<ScreenshotAttachmentInput>;
  screenshotID: Maybe<UUID>;
  task: Maybe<TaskInput>;
  threadOptions: Maybe<ThreadOptionsInput>;
  externalMessageID: Maybe<string>;
  type: Maybe<MessageType>;
  addReactions: Maybe<Array<string>>;
  iconURL: Maybe<string>;
  translationKey: Maybe<string>;
  extraClassnames: Maybe<string>;
  createThread: Maybe<CreateThreadInput>;
  skipLinkPreviews: Maybe<boolean>;
};

export type CreateMessageByExternalIDInput = {
  messageID: Maybe<UUID>;
  externalThreadID: string;
  externalMessageID: Maybe<string>;
  content: MessageContent;
  type: Maybe<MessageType>;
  url: Maybe<string>;
  addReactions: Maybe<Array<string>>;
  metadata: Maybe<Metadata>;
  iconURL: Maybe<string>;
  translationKey: Maybe<string>;
  extraClassnames: Maybe<string>;
  createThread: Maybe<CreateThreadInput>;
  addFileAttachments: Maybe<Array<string>>;
  screenshotAttachment: Maybe<ScreenshotAttachmentInput>;
  skipLinkPreviews: Maybe<boolean>;
  subscribeToThread: Maybe<boolean>;
};

export type UpdateMessageByExternalIDInput = {
  externalThreadID: Maybe<string>;
  externalMessageID: string;
  content: Maybe<MessageContent>;
  type: Maybe<MessageType>;
  url: Maybe<string>;
  metadata: Maybe<Metadata>;
  iconURL: Maybe<string>;
  translationKey: Maybe<string>;
  extraClassnames: Maybe<string>;
  deleted: Maybe<boolean>;
  addReactions: Maybe<Array<string>>;
  removeReactions: Maybe<Array<string>>;
  addFileAttachments: Maybe<Array<string>>;
  removeFileAttachments: Maybe<Array<string>>;
  skipLinkPreviews: Maybe<boolean>;
  removePreviewLinks: Maybe<Array<string>>;
};

export type CreateThreadInput = {
  location: Context;
  url: string;
  name: string;
  metadata: Maybe<Metadata>;
  extraClassnames: Maybe<string>;
  addSubscribers: Maybe<Array<string>>;
};

export type ThreadOptionsInput = {
  additionalSubscribersOnCreate: Array<string>;
};

export type ThreadByExternalID2Input = {
  externalThreadID: string;
};

export type FileUploadStatusEnumType =
  | 'uploaded'
  | 'uploading'
  | 'failed'
  | 'cancelled';

export type LogoConfigInput = {
  height: string;
  width: string;
};

export type NotificationReadStatus = 'unread' | 'read';

export type AdminGoRedirectInputType = {
  name: string;
  url: string;
};

export type AdminCRTComingFrom = 'us' | 'them';

export type AdminCRTDecision = 'done' | 'accepted' | 'rejected' | 'pending';

export type AdminCRTCommunicationStatus =
  | 'none'
  | 'request_acked'
  | 'decision_sent'
  | 'decision_acked';

export type AdminCRTIssueType = 'request' | 'bug' | 'onboarding_step';

export type AdminCRTPriority = 'blocker' | 'high' | 'low';

export type AdminCRTNextAction =
  | 'unknown'
  | 'ack_receipt'
  | 'make_decision'
  | 'send_decision'
  | 'do_work'
  | 'wait_for_ack'
  | 'done';

export type SearchLocationOptions = {
  location: Context;
  partialMatch: boolean;
};

export type TimestampRange = {
  from: Maybe<DateTime>;
  to: Maybe<DateTime>;
};

export type SearchSortByOptions = 'created_timestamp' | 'relevance';

export type SearchSortInput = {
  sortBy: SearchSortByOptions;
  sortDirection: SortDirection;
};

export type CustomEmailTemplate = {
  partnerName: string;
  imageURL: string;
  sender: Maybe<string>;
  logoConfig: Maybe<LogoConfigInput>;
};

export type CustomLinks = {
  learnMore: Maybe<string>;
  upgradePlan: Maybe<string>;
  leaveFeedback: Maybe<string>;
};

export type CustomNUXInput = {
  initialOpen: Maybe<CustomNUXStepInput>;
  welcome: Maybe<CustomNUXStepInput>;
};

export type CustomNUXStepInput = {
  title: Maybe<string>;
  text: Maybe<string>;
  imageURL: Maybe<string>;
};

export type ConsoleApplicationOrganizationState = 'active' | 'deleted';

export type ConsoleApplicationUserState = 'active' | 'deleted';

export type ConsoleApplicationFragment = {
  id: UUID;
  name: string;
  sharedSecret: string;
  serverAccessToken: string;
  customerAccessToken: string;
  customLinks: Nullable<{
    learnMore: Nullable<string>;
    upgradePlan: Nullable<string>;
    leaveFeedback: Nullable<string>;
  }>;
  customEmailTemplate: Nullable<{
    partnerName: string;
    imageURL: string;
    sender: Nullable<string>;
    logoConfig: Nullable<{
      height: string;
      width: string;
    }>;
  }>;
  enableEmailNotifications: boolean;
  segmentWriteKey: Nullable<string>;
  iconURL: Nullable<string>;
  customNUX: Nullable<{
    initialOpen: Nullable<CustomNUXStepContentFragment>;
    welcome: Nullable<CustomNUXStepContentFragment>;
  }>;
  customS3Bucket: Nullable<S3BucketFragment>;
  supportSlackChannelID: Nullable<string>;
  supportBotInfo: Nullable<{
    name: string;
    profilePictureURL: Nullable<string>;
  }>;
  redirectURI: Nullable<string>;
  eventWebhookURL: Nullable<string>;
  eventWebhookSubscriptions: Nullable<Array<string>>;
  setupInfo: Nullable<{
    firstUser: Nullable<{
      name: Nullable<string>;
      externalID: string;
    }>;
    firstOrg: Nullable<{
      name: string;
      externalID: string;
    }>;
    isComponentInitialized: boolean;
  }>;
};

export type CustomNUXStepContentFragment = {
  title: Nullable<string>;
  text: Nullable<string>;
  imageURL: Nullable<string>;
};

export type S3BucketFragment = {
  id: UUID;
  name: string;
  region: string;
};

export type AddConsoleUserToCustomerMutationResult = {
  addConsoleUserToCustomer: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type AddConsoleUserToCustomerMutationVariables = {
  email: string;
};

export type CreateApplicationForConsoleMutationResult = {
  createApplication: UUID;
};

export type CreateApplicationForConsoleMutationVariables = {
  name: string;
};

export type CreateApplicationS3BucketMutationResult = {
  createApplicationCustomS3Bucket: {
    success: boolean;
  };
};

export type CreateApplicationS3BucketMutationVariables = {
  applicationID: UUID;
  bucket: string;
  region: string;
  accessKeyID: string;
  accessKeySecret: string;
};

export type CreateCustomerForConsoleMutationResult = {
  createCustomer: {
    id: UUID;
    name: string;
    type: CustomerType;
  };
};

export type CreateCustomerForConsoleMutationVariables = {
  name: string;
};

export type CreateCustomerIssueInConsoleMutationResult = {
  createCustomerIssue: {
    success: boolean;
  };
};

export type CreateCustomerIssueInConsoleMutationVariables = {
  title: string;
  body: string;
  type: AdminCRTIssueType;
  priority: AdminCRTPriority;
};

export type DeleteApplicationS3BucketMutationResult = {
  deleteApplicationCustomS3Bucket: {
    success: boolean;
  };
};

export type DeleteApplicationS3BucketMutationVariables = {
  applicationID: UUID;
};

export type GetSignedUploadURLMutationResult = {
  getSignedUploadURL: {
    uploadURL: Nullable<string>;
    downloadURL: Nullable<string>;
  };
};

export type GetSignedUploadURLMutationVariables = {
  applicationID: UUID;
  assetName: string;
  size: Int;
  mimeType: string;
};

export type RemoveConsoleUserFromCustomerMutationResult = {
  removeConsoleUserFromCustomer: {
    success: boolean;
  };
};

export type RemoveConsoleUserFromCustomerMutationVariables = {
  email: string;
};

export type RemoveSlackSupportOrgMutationResult = {
  removeSlackSupportOrg: {
    success: boolean;
  };
};

export type RemoveSlackSupportOrgMutationVariables = {
  applicationID: UUID;
};

export type RequestAccessToCustomerMutationResult = {
  requestAccessToCustomer: {
    success: boolean;
  };
};

export type RequestAccessToCustomerMutationVariables = {
  customerID: UUID;
};

export type StartCheckoutMutationResult = {
  startCheckout: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
    }>;
    redirectURL: Nullable<string>;
  };
};

export type StartCheckoutMutationVariables = {
  productKey: string;
};

export type SyncUserMutationResult = {
  syncUser: {
    success: boolean;
    customerIDs: Nullable<Array<string>>;
    customerName: Nullable<string>;
  };
};

export type SyncUserMutationVariables = {
  email: string;
  name: Maybe<string>;
  picture: Maybe<string>;
  signupCoupon: Maybe<string>;
  createNewCustomer: Maybe<boolean>;
};

export type UpdateAccessToCustomerMutationResult = {
  updateAccessToCustomer: {
    success: boolean;
  };
};

export type UpdateAccessToCustomerMutationVariables = {
  email: string;
  approveAccess: boolean;
};

export type UpdateApplicationForConsoleMutationResult = {
  updateApplication: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type UpdateApplicationForConsoleMutationVariables = {
  id: UUID;
  name: Maybe<string>;
  customLinks: Maybe<CustomLinks>;
  customEmailTemplate: Maybe<CustomEmailTemplate>;
  enableEmailNotifications: Maybe<boolean>;
  segmentWriteKey: Maybe<string>;
  iconURL: Maybe<string>;
  customNUX: Maybe<CustomNUXInput>;
  redirectURI: Maybe<string>;
  eventWebhookURL: Maybe<string>;
  eventWebhookSubscriptions: Maybe<Array<string>>;
};

export type UpdateApplicationS3BucketSecretMutationResult = {
  updateCustomS3BucketSecret: {
    success: boolean;
  };
};

export type UpdateApplicationS3BucketSecretMutationVariables = {
  applicationID: UUID;
  id: UUID;
  keyID: string;
  keySecret: string;
};

export type UpdateCustomerIssueInConsoleMutationResult = {
  updateCustomerIssue: {
    success: boolean;
  };
};

export type UpdateCustomerIssueInConsoleMutationVariables = {
  id: UUID;
  title: Maybe<string>;
  body: Maybe<string>;
  type: Maybe<AdminCRTIssueType>;
  priority: Maybe<AdminCRTPriority>;
};

export type UpdateCustomerNameMutationResult = {
  updateCustomerName: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type UpdateCustomerNameMutationVariables = {
  name: string;
};

export type UpdateSupportBotMutationResult = {
  updateSupportBot: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type UpdateSupportBotMutationVariables = {
  applicationID: UUID;
  profilePictureURL: string;
  supportSlackChannelID: string;
  name: string;
};

export type UpdateUserDetailsMutationResult = {
  updateUserDetails: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type UpdateUserDetailsMutationVariables = {
  id: string;
  name: string;
};

export type RedirectToStripeCustomerPortalMutationResult = {
  redirectToStripeCustomerPortal: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
    }>;
    redirectURL: Nullable<string>;
  };
};

export type ApplicationFlagQueryResult = {
  applicationFlag: Nullable<{
    key: string;
    value: SimpleValue;
  }>;
};

export type ApplicationFlagQueryVariables = {
  applicationID: UUID;
  flagKey: string;
};

export type ApplicationForConsoleQueryResult = {
  application: Nullable<ConsoleApplicationFragment>;
};

export type ApplicationForConsoleQueryVariables = {
  id: UUID;
};

export type ApplicationsQueryResult = {
  applications: Array<{
    application: {
      id: UUID;
      name: string;
      environment: ApplicationEnvironment;
    };
    userCount: Int;
    orgCount: Int;
  }>;
};

export type ConsoleCordSessionTokenQueryResult = {
  consoleCordSessionToken: Nullable<string>;
};

export type ConsoleCustomerIssuesQueryResult = {
  customerIssues: Array<{
    id: UUID;
    title: string;
    body: string;
    type: AdminCRTIssueType;
    priority: AdminCRTPriority;
  }>;
};

export type ConsoleS3BucketQueryResult = {
  s3Bucket: Nullable<S3BucketFragment>;
};

export type ConsoleS3BucketQueryVariables = {
  id: UUID;
};

export type ConsoleUserQueryResult = {
  consoleUser: Nullable<{
    customer: Nullable<{
      id: UUID;
      name: string;
      type: CustomerType;
      enableCustomS3Bucket: boolean;
      enableCustomSegmentWriteKey: boolean;
      sharedSecret: string;
      signupCoupon: Nullable<string>;
      pricingTier: PricingTier;
      billingStatus: BillingStatus;
      billingType: Nullable<BillingType>;
      renewalDate: Nullable<DateTime>;
      addons: Array<{
        key: string;
        value: boolean;
      }>;
      planDescription: Array<string>;
    }>;
    pendingCustomerID: Nullable<UUID>;
  }>;
};

export type ConsoleUsersQueryResult = {
  customerConsoleUsers: Array<{
    id: UUID;
    email: string;
    name: Nullable<string>;
    pendingCustomerID: Nullable<UUID>;
  }>;
};

export type EncodedSlackTokenQueryResult = {
  encodedSlackToken: Nullable<string>;
};

export type EncodedSlackTokenQueryVariables = {
  nonce: string;
  applicationID: UUID;
};

export type GetCustomerIssueInConsoleQueryResult = {
  getCustomerIssue: Nullable<{
    id: UUID;
    title: string;
    body: string;
    type: AdminCRTIssueType;
    priority: AdminCRTPriority;
  }>;
};

export type GetCustomerIssueInConsoleQueryVariables = {
  id: UUID;
};

export type GetOrgsQueryResult = {
  getOrgs: Nullable<
    Array<{
      id: string;
      name: string;
      status: ConsoleApplicationOrganizationState;
    }>
  >;
};

export type GetOrgsQueryVariables = {
  applicationID: string;
};

export type GetUsersQueryResult = {
  getUsers: Nullable<
    Array<{
      id: Nullable<string>;
      name: Nullable<string>;
      email: Nullable<string>;
      profilePictureURL: Nullable<string>;
      status: ConsoleApplicationUserState;
      createdTimestamp: DateTime;
    }>
  >;
};

export type GetUsersQueryVariables = {
  applicationID: string;
};

export type SlackChannelsForConsoleQueryResult = {
  slackChannelsForConsole: Array<{
    name: string;
    slackID: string;
  }>;
};

export type SlackChannelsForConsoleQueryVariables = {
  applicationID: UUID;
};

export type UsageStatsQueryResult = {
  usageStats: {
    mau: Int;
  };
};

export type ApplicationEventsSubscriptionResult = {
  applicationEvents: {
    __typename: 'ConsoleGettingStartedUpdated';
    application: Nullable<{
      id: UUID;
    }>;
  };
};

export type ApplicationEventsSubscriptionVariables = {
  applicationID: UUID;
};

export type CustomerEventsSubscriptionResult = {
  customerEvents: {
    __typename: 'CustomerSubscriptionUpdated';
    customer: {
      pricingTier: PricingTier;
      billingStatus: BillingStatus;
      billingType: Nullable<BillingType>;
      renewalDate: Nullable<DateTime>;
      addons: Array<{
        key: string;
        value: boolean;
      }>;
      planDescription: Array<string>;
    };
  };
};

export type CustomerEventsSubscriptionVariables = {
  customerID: UUID;
};
