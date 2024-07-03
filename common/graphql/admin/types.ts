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

export type ApplicationTierType = 'free' | 'starter' | 'premium';

export type ApplicationEnvironment =
  | 'production'
  | 'staging'
  | 'sample'
  | 'sampletoken'
  | 'demo';

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

export type CSSMutatorConfig = {
  cssTemplate: string;
};

export type CustomerSlackMessageType = 'test' | 'customer';

export type AddonInput = {
  key: string;
  value: boolean;
};

export type AdminApplicationFragment = {
  id: UUID;
  name: string;
  sharedSecret: string;
  customerID: UUID;
  environment: ApplicationEnvironment;
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
  customS3Bucket: Nullable<S3BucketFragment>;
  segmentWriteKey: Nullable<string>;
  iconURL: Nullable<string>;
  customNUX: Nullable<{
    initialOpen: Nullable<CustomNUXStepContentFragment>;
    welcome: Nullable<CustomNUXStepContentFragment>;
  }>;
  defaultProvider: Nullable<UUID>;
  redirectURI: Nullable<string>;
  deploymentInfo: {
    usersSyncedAllTime: Int;
    orgsSyncedAllTime: Int;
    componentsInitializedAllTime: Array<string>;
    customLocations: Int;
    customLocationsAllTime: Int;
  };
  eventWebhookURL: Nullable<string>;
  eventWebhookSubscriptions: Nullable<Array<string>>;
};

export type CustomNUXStepContentFragment = {
  title: Nullable<string>;
  text: Nullable<string>;
  imageURL: Nullable<string>;
};

export type HeimdallSwitchFragment = {
  key: string;
  isOn: boolean;
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
  customerID: UUID;
  email: string;
  sendEmailInvites: Maybe<boolean>;
};

export type RemoveCustomerIssueSubscriptionMutationResult = {
  removeCustomerIssueSubscription: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type RemoveCustomerIssueSubscriptionMutationVariables = {
  issueID: UUID;
};

export type AdminPlatformUsersQueryResult = {
  adminPlatformUsers: Array<{
    user: {
      id: UUID;
      displayName: string;
      externalID: string;
    };
  }>;
};

export type AllCustomerIssuesQueryResult = {
  customerIssues: Array<{
    id: UUID;
    title: string;
    customer: {
      id: UUID;
      name: string;
    };
    nextAction: AdminCRTNextAction;
    lastTouch: Nullable<DateTime>;
    priority: AdminCRTPriority;
    assignee: Nullable<{
      id: UUID;
      displayName: string;
    }>;
  }>;
};

export type ApplicationQueryResult = {
  application: Nullable<AdminApplicationFragment>;
};

export type ApplicationQueryVariables = {
  id: UUID;
};

export type CordSessionTokenQueryResult = {
  cordSessionToken: Nullable<string>;
};

export type CreateApplicationCustomS3BucketMutationResult = {
  createApplicationCustomS3Bucket: {
    success: boolean;
  };
};

export type CreateApplicationCustomS3BucketMutationVariables = {
  applicationID: UUID;
  bucket: string;
  region: string;
  accessKeyID: string;
  accessKeySecret: string;
};

export type CreateApplicationMutationResult = {
  createApplication: UUID;
};

export type CreateApplicationMutationVariables = {
  name: string;
  customerID: UUID;
};

export type CreateCustomerIssueMutationResult = {
  createCustomerIssue: {
    success: boolean;
  };
};

export type CreateCustomerIssueMutationVariables = {
  customerID: UUID;
  title: string;
  body: string;
  comingFrom: AdminCRTComingFrom;
  decision: AdminCRTDecision;
  lastTouch: Maybe<DateTime>;
  communicationStatus: AdminCRTCommunicationStatus;
  type: AdminCRTIssueType;
  priority: AdminCRTPriority;
  externallyVisible: boolean;
  assignee: Maybe<UUID>;
};

export type CreateCustomerMutationResult = {
  createCustomer: UUID;
};

export type CreateCustomerMutationVariables = {
  name: string;
};

export type CreateHeimdallSwitchMutationResult = {
  createHeimdallSwitch: HeimdallSwitchFragment;
};

export type CreateHeimdallSwitchMutationVariables = {
  key: string;
};

export type CreateStripeCustomerMutationResult = {
  createStripeCustomer: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type CreateStripeCustomerMutationVariables = {
  id: UUID;
  email: string;
  country: string;
  postcode: string;
};

export type CreateStripeSubscriptionMutationResult = {
  createStripeSubscription: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type CreateStripeSubscriptionMutationVariables = {
  id: UUID;
  price: Float;
  recurrence: string;
  pricingTier: PricingTier;
};

export type CustomerApplicationsQueryResult = {
  customerApplications: Array<
    Nullable<{
      id: UUID;
      name: string;
    }>
  >;
};

export type CustomerApplicationsQueryVariables = {
  customerID: UUID;
};

export type CustomerConsoleUsersQueryResult = {
  customerConsoleUsers: Array<{
    id: UUID;
    email: string;
    name: Nullable<string>;
    pendingCustomerID: Nullable<UUID>;
  }>;
};

export type CustomerConsoleUsersQueryVariables = {
  customerID: UUID;
};

export type CustomerIssueCordSessionTokenQueryResult = {
  customerIssueCordSessionToken: Nullable<string>;
};

export type CustomerIssueCordSessionTokenQueryVariables = {
  issueID: UUID;
};

export type CustomerIssueQueryResult = {
  customerIssue: {
    id: UUID;
    title: string;
    body: string;
    customer: {
      id: UUID;
      name: string;
    };
    comingFrom: AdminCRTComingFrom;
    decision: AdminCRTDecision;
    communicationStatus: AdminCRTCommunicationStatus;
    nextAction: AdminCRTNextAction;
    lastTouch: Nullable<DateTime>;
    type: AdminCRTIssueType;
    priority: AdminCRTPriority;
    externallyVisible: boolean;
    assignee: Nullable<{
      id: UUID;
      displayName: string;
    }>;
    history: Array<{
      user: {
        displayName: string;
      };
      created: boolean;
      updated: Array<{
        field: string;
        oldValue: Nullable<JSON>;
        newValue: Nullable<JSON>;
      }>;
      timestamp: DateTime;
    }>;
    subscribed: boolean;
  };
};

export type CustomerIssueQueryVariables = {
  id: UUID;
};

export type CustomerIssuesQueryResult = {
  customerIssues: Array<{
    id: UUID;
    title: string;
    nextAction: AdminCRTNextAction;
    lastTouch: Nullable<DateTime>;
    priority: AdminCRTPriority;
    assignee: Nullable<{
      id: UUID;
      displayName: string;
    }>;
  }>;
};

export type CustomerIssuesQueryVariables = {
  customerID: UUID;
};

export type CustomerQueryResult = {
  customer: Nullable<{
    id: UUID;
    name: string;
    type: CustomerType;
    implementationStage: CustomerImplementationStage;
    launchDate: Nullable<DateTime>;
    enableCustomS3Bucket: boolean;
    enableCustomSegmentWriteKey: boolean;
    slackChannel: Nullable<string>;
    pricingTier: PricingTier;
    billingType: Nullable<BillingType>;
    billingStatus: BillingStatus;
    stripeCustomerID: Nullable<string>;
    addons: Array<{
      key: string;
      value: boolean;
    }>;
    renewalDate: Nullable<DateTime>;
    planDescription: Array<string>;
    stripeSubscription: Nullable<{
      id: string;
      url: string;
      status: string;
      startDate: DateTime;
      currentPeriodStart: DateTime;
      currentPeriodEnd: DateTime;
      amount: Int;
      recurrence: StripeSubscriptionRecurrence;
    }>;
  }>;
};

export type CustomerQueryVariables = {
  id: UUID;
};

export type CustomerSlackChannelQueryResult = {
  customerSlackChannels: Array<{
    id: UUID;
    name: string;
    slackChannelName: string;
  }>;
};

export type DeleteApplicationCustomS3BucketMutationResult = {
  deleteApplicationCustomS3Bucket: {
    success: boolean;
  };
};

export type DeleteApplicationCustomS3BucketMutationVariables = {
  applicationID: UUID;
};

export type DeleteCustomerIssueMutationResult = {
  deleteCustomerIssue: {
    success: boolean;
  };
};

export type DeleteCustomerIssueMutationVariables = {
  id: UUID;
};

export type FlipHeimdallSwitchMutationResult = {
  flipHeimdallSwitch: {
    success: boolean;
  };
};

export type FlipHeimdallSwitchMutationVariables = {
  key: string;
  value: boolean;
};

export type GoRedirectAdminQueryResult = {
  goRedirect: Nullable<{
    name: string;
    url: string;
    redirectCount: Int;
  }>;
};

export type GoRedirectAdminQueryVariables = {
  name: string;
};

export type HeimdallSwitchAdminQueryResult = {
  heimdallSwitchAdmin: Nullable<HeimdallSwitchFragment>;
};

export type HeimdallSwitchAdminQueryVariables = {
  key: string;
};

export type HeimdallSwitchesQueryResult = {
  heimdallSwitches: Array<HeimdallSwitchFragment>;
};

export type RemoveConsoleUserFromCustomerMutationResult = {
  removeConsoleUserFromCustomer: {
    success: boolean;
  };
};

export type RemoveConsoleUserFromCustomerMutationVariables = {
  customerID: UUID;
  email: string;
};

export type AddCustomerIssueSubscriptionMutationResult = {
  addCustomerIssueSubscription: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type AddCustomerIssueSubscriptionMutationVariables = {
  issueID: UUID;
};

export type S3BucketQueryResult = {
  s3Bucket: Nullable<S3BucketFragment>;
};

export type S3BucketQueryVariables = {
  id: UUID;
};

export type SelectQueryResult = {
  select: Array<JSONObject>;
};

export type SelectQueryVariables = {
  query: string;
  parameters: JSONObject;
};

export type SendSlackMessageToCustomersMutationResult = {
  sendSlackMessageToCustomers: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type SendSlackMessageToCustomersMutationVariables = {
  type: CustomerSlackMessageType;
  message: string;
  customers: Array<string>;
};

export type SetGoRedirectMutationResult = {
  setGoRedirect: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
    }>;
  };
};

export type SetGoRedirectMutationVariables = {
  name: string;
  url: string;
};

export type TestTokenQueryResult = {
  testToken: {
    token: string;
  };
};

export type ToggleInternalFlagOnOrgMutationResult = {
  toggleInternalFlagOnOrg: {
    success: boolean;
  };
};

export type ToggleInternalFlagOnOrgMutationVariables = {
  orgID: UUID;
};

export type UpdateApplicationMutationResult = {
  updateApplication: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type UpdateApplicationMutationVariables = {
  id: UUID;
  name: Maybe<string>;
  customLinks: Maybe<CustomLinks>;
  customEmailTemplate: Maybe<CustomEmailTemplate>;
  enableEmailNotifications: Maybe<boolean>;
  segmentWriteKey: Maybe<string>;
  iconURL: Maybe<string>;
  customNUX: Maybe<CustomNUXInput>;
  environment: Maybe<ApplicationEnvironment>;
  redirectURI: Maybe<string>;
  eventWebhookURL: Maybe<string>;
  eventWebhookSubscriptions: Maybe<Array<string>>;
};

export type UpdateCustomS3BucketSecretMutationResult = {
  updateCustomS3BucketAccessKey: {
    success: boolean;
  };
};

export type UpdateCustomS3BucketSecretMutationVariables = {
  id: UUID;
  keyID: string;
  keySecret: string;
};

export type UpdateCustomerIssueMutationResult = {
  updateCustomerIssue: {
    success: boolean;
  };
};

export type UpdateCustomerIssueMutationVariables = {
  id: UUID;
  customerID: Maybe<UUID>;
  title: Maybe<string>;
  body: Maybe<string>;
  comingFrom: Maybe<AdminCRTComingFrom>;
  decision: Maybe<AdminCRTDecision>;
  communicationStatus: Maybe<AdminCRTCommunicationStatus>;
  lastTouch: Maybe<DateTime>;
  type: Maybe<AdminCRTIssueType>;
  priority: Maybe<AdminCRTPriority>;
  externallyVisible: Maybe<boolean>;
  assignee: Maybe<UUID>;
};

export type UpdateCustomerMutationResult = {
  updateCustomer: {
    success: boolean;
  };
};

export type UpdateCustomerMutationVariables = {
  id: UUID;
  name: Maybe<string>;
  type: Maybe<CustomerType>;
  implementationStage: Maybe<CustomerImplementationStage>;
  launchDate: Maybe<DateTime>;
  enableCustomS3Bucket: Maybe<boolean>;
  enableCustomSegmentWriteKey: Maybe<boolean>;
  slackChannel: Maybe<string>;
  pricingTier: Maybe<PricingTier>;
  billingType: Maybe<BillingType>;
  billingStatus: Maybe<string>;
  stripeCustomerID: Maybe<string>;
  addons: Maybe<Array<AddonInput>>;
  renewalDate: Maybe<DateTime>;
  planDescription: Maybe<Array<string>>;
};
