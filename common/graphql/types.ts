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

export type CustomNUXStepContentFragment = {
  title: Nullable<string>;
  text: Nullable<string>;
  imageURL: Nullable<string>;
};

export type FileFragment = {
  __typename: 'File';
  id: UUID;
  name: string;
  url: string;
  mimeType: string;
  uploadStatus: FileUploadStatus;
  size: Float;
};

export type HighlightedTextConfigFragment = {
  startElementSelector: string;
  endElementSelector: string;
  startNodeIndex: Int;
  startNodeOffset: Int;
  endNodeIndex: Int;
  endNodeOffset: Int;
  selectedText: string;
  textToDisplay: Nullable<string>;
};

export type InboxThreadFragment = {
  __typename: 'Thread';
  id: UUID;
  externalID: string;
  externalOrgID: string;
  metadata: Metadata;
  name: Nullable<string>;
  newMessagesCount: Int;
  messages: Array<MessageFragment>;
  url: string;
  messagesCountExcludingDeleted: Int;
  location: Context;
  resolved: boolean;
  sharedToSlack: Nullable<{
    channel: Nullable<string>;
    slackURL: Nullable<string>;
  }>;
  participants: Array<{
    lastSeenTimestamp: Nullable<DateTime>;
    user: Nullable<{
      id: UUID;
    }>;
  }>;
  firstUnseenMessageID: Nullable<UUID>;
  replyingUserIDs: Array<UUID>;
  actionMessageReplyingUserIDs: Array<UUID>;
  subscribed: boolean;
  viewerIsThreadParticipant: boolean;
  extraClassnames: Nullable<string>;
};

export type InboxThreadFragment2Fragment = {
  __typename: 'Thread';
  id: UUID;
  externalID: string;
  orgID: UUID;
  externalOrgID: string;
  name: Nullable<string>;
  metadata: Metadata;
  newMessagesCount: Int;
  newReactionsCount: Int;
  messages: Array<MessageFragment>;
  url: string;
  navigationURL: string;
  allMessagesCount: Int;
  replyCount: Int;
  messagesCountExcludingDeleted: Int;
  userMessagesCount: Int;
  actionMessagesCount: Int;
  resolved: boolean;
  resolvedTimestamp: Nullable<DateTime>;
  sharedToSlack: Nullable<{
    channel: Nullable<string>;
    slackURL: Nullable<string>;
  }>;
  participants: Array<{
    lastSeenTimestamp: Nullable<DateTime>;
    user: Nullable<{
      id: UUID;
      externalID: string;
      displayName: string;
    }>;
    subscribed: Nullable<boolean>;
  }>;
  firstUnseenMessageID: Nullable<UUID>;
  typingUsers: Array<UserFragment>;
  mentioned: Array<UserFragment>;
  replyingUserIDs: Array<UUID>;
  actionMessageReplyingUserIDs: Array<UUID>;
  location: Context;
  extraClassnames: Nullable<string>;
};

export type MessageAnnotationAttachmentFragment = {
  __typename: 'MessageAnnotationAttachment';
  id: UUID;
  location: Nullable<{
    selector: string;
    x: Float;
    y: Float;
    iframeSelectors: Array<string>;
    onChart: Nullable<boolean>;
    textConfig: Nullable<{
      selectedCharOffset: Int;
      textToMatch: string;
      textToMatchOffset: Int;
      nodeIndex: Int;
      xVsPointer: Float;
      yVsPointer: Float;
    }>;
    elementIdentifier: Nullable<{
      identifier: JSONObject;
      version: ElementIdentifierVersion;
    }>;
    highlightedTextConfig: Nullable<HighlightedTextConfigFragment>;
    multimediaConfig: Nullable<{
      currentTime: Int;
    }>;
    additionalTargetData: Nullable<{
      targetType: TargetType;
      monacoEditor: Nullable<{
        monacoID: Nullable<string>;
        lineNumber: Int;
      }>;
      reactTree: Nullable<{
        key: string;
        treeID: Nullable<string>;
      }>;
      konvaCanvas: Nullable<{
        x: Float;
        y: Float;
      }>;
    }>;
  }>;
  customLocation: Nullable<Context>;
  customHighlightedTextConfig: Nullable<HighlightedTextConfigFragment>;
  customLabel: Nullable<string>;
  coordsRelativeToTarget: Nullable<{
    x: Float;
    y: Float;
  }>;
  screenshot: Nullable<FileFragment>;
  blurredScreenshot: Nullable<FileFragment>;
  message: {
    source: {
      id: UUID;
    };
  };
};

export type MessageFileAttachmentFragment = {
  __typename: 'MessageFileAttachment';
  id: UUID;
  file: Nullable<FileFragment>;
};

export type MessageFragment = {
  __typename: 'Message';
  id: UUID;
  externalID: string;
  source: UserFragment;
  content: Nullable<MessageContent>;
  attachments: Array<
    | (MessageFileAttachmentFragment & {
        __typename: 'MessageFileAttachment';
      })
    | (MessageAnnotationAttachmentFragment & {
        __typename: 'MessageAnnotationAttachment';
      })
    | (MessageScreenshotAttachmentFragment & {
        __typename: 'MessageScreenshotAttachment';
      })
    | (MessageLinkPreviewFragment & {
        __typename: 'MessageLinkPreview';
      })
  >;
  url: Nullable<string>;
  seen: boolean;
  reactions: Array<MessageReactionFragment>;
  referencedUserData: Array<{
    id: UUID;
    name: Nullable<string>;
  }>;
  timestamp: DateTime;
  deletedTimestamp: Nullable<DateTime>;
  lastUpdatedTimestamp: Nullable<DateTime>;
  importedFromSlackChannel: Nullable<string>;
  task: Nullable<TaskFragment>;
  importedSlackMessageType: Nullable<ImportedSlackMessageType>;
  slackURL: Nullable<string>;
  isFromEmailReply: boolean;
  type: MessageType;
  iconURL: Nullable<string>;
  translationKey: Nullable<string>;
  metadata: Metadata;
  extraClassnames: Nullable<string>;
  seenBy: Array<{
    externalID: string;
  }>;
  skipLinkPreviews: boolean;
};

export type MessageLinkPreviewFragment = {
  __typename: 'MessageLinkPreview';
  id: UUID;
  url: string;
  img: Nullable<string>;
  title: Nullable<string>;
  description: Nullable<string>;
};

export type MessageReactionFragment = {
  __typename: 'MessageReaction';
  id: UUID;
  unicodeReaction: string;
  user: UserFragment;
  timestamp: DateTime;
};

export type MessageScreenshotAttachmentFragment = {
  __typename: 'MessageScreenshotAttachment';
  id: UUID;
  screenshot: Nullable<FileFragment>;
  blurredScreenshot: Nullable<FileFragment>;
};

export type NotificationsMessageFragment = MessageFragment & {
  id: UUID;
  url: Nullable<string>;
  thread: ThreadFragment;
};

export type NotificationsNodeFragment = {
  id: UUID;
  externalID: string;
  senders: Array<
    UserFragment & {
      __typename: 'User';
    }
  >;
  header: Array<
    | {
        __typename: 'NotificationHeaderTextNode';
        text: string;
        bold: boolean;
      }
    | {
        __typename: 'NotificationHeaderUserNode';
        user: UserFragment;
      }
  >;
  headerTranslationKey: Nullable<string>;
  headerSimpleTranslationParams: Nullable<SimpleTranslationParameters>;
  attachment: Nullable<
    | {
        __typename: 'NotificationURLAttachment';
        url: string;
      }
    | {
        __typename: 'NotificationMessageAttachment';
        message: NotificationsMessageFragment;
      }
    | {
        __typename: 'NotificationThreadAttachment';
        thread: ThreadFragment;
      }
  >;
  iconUrl: Nullable<string>;
  readStatus: NotificationReadStatus;
  timestamp: DateTime;
  extraClassnames: Nullable<string>;
  metadata: Metadata;
};

export type OrganizationFragment = {
  __typename: 'Organization';
  id: UUID;
  externalID: string;
  linkedOrganization: Nullable<{
    name: string;
  }>;
};

export type PageVisitorFragment = {
  __typename: 'PageVisitor';
  user: Nullable<UserFragment>;
  lastPresentTimestamp: Nullable<DateTime>;
};

export type TaskFragment = {
  __typename: 'Task';
  id: UUID;
  done: boolean;
  todos: Array<{
    id: UUID;
    done: boolean;
  }>;
  assignees: Array<Nullable<UserFragment>>;
  doneStatusLastUpdatedBy: Nullable<UserFragment>;
  thirdPartyReferences: Array<{
    type: ThirdPartyConnectionType;
    previewData: Nullable<JSONObject>;
  }>;
};

export type ThreadActivitySummaryFragment = {
  totalThreadCount: Int;
  unreadThreadCount: Int;
  newThreadCount: Int;
  unreadSubscribedThreadCount: Int;
  resolvedThreadCount: Int;
  emptyThreadCount: Int;
};

export type ThreadByExternalIDFragment = ThreadFragmentBaseFragment & {
  initialMessagesInclDeleted: Array<MessageFragment>;
};

export type ThreadFragment = ThreadFragmentBaseFragment & {
  initialMessagesInclDeleted: Array<MessageFragment>;
};

export type ThreadFragmentBaseFragment = {
  id: UUID;
  externalID: string;
  orgID: UUID;
  externalOrgID: string;
  name: Nullable<string>;
  metadata: Metadata;
  newMessagesCount: Int;
  newReactionsCount: Int;
  subscribed: boolean;
  typingUsers: Array<UserFragment>;
  mentioned: Array<UserFragment>;
  allMessagesCount: Int;
  replyCount: Int;
  messagesCountExcludingDeleted: Int;
  userMessagesCount: Int;
  actionMessagesCount: Int;
  viewerIsThreadParticipant: boolean;
  url: string;
  navigationURL: string;
  resolved: boolean;
  resolvedTimestamp: Nullable<DateTime>;
  sharedToSlack: Nullable<{
    channel: Nullable<string>;
    slackURL: Nullable<string>;
  }>;
  participants: Array<ThreadParticipantFragment>;
  firstUnseenMessageID: Nullable<UUID>;
  replyingUserIDs: Array<UUID>;
  actionMessageReplyingUserIDs: Array<UUID>;
  location: Context;
  extraClassnames: Nullable<string>;
};

export type ThreadParticipantFragment = {
  lastSeenTimestamp: Nullable<DateTime>;
  user: Nullable<{
    id: UUID;
    externalID: string;
    displayName: string;
  }>;
  subscribed: Nullable<boolean>;
};

export type UserFragment = {
  id: UUID;
  externalID: string;
  displayName: string;
  fullName: string;
  name: Nullable<string>;
  shortName: Nullable<string>;
  profilePictureURL: Nullable<string>;
  metadata: Metadata;
};

export type ViewerIdentityFragment = {
  user: UserFragment;
  organization: Nullable<OrganizationFragment>;
  email: Nullable<string>;
  isSlackConnected: boolean;
  organizations: Array<{
    externalID: string;
  }>;
};

export type AccessTokenQueryResult = {
  viewer: {
    accessToken: string;
  };
};

export type AccessTokenQueryVariables = {
  _externalOrgID: Maybe<string>;
};

export type ActivityQueryResult = {
  viewer: {
    organization: Nullable<{
      id: UUID;
      recentlyActiveThreads: Array<InboxThreadFragment>;
    }>;
  };
};

export type ActivityQueryVariables = {
  _externalOrgID: Maybe<string>;
};

export type AddThreadToSlackChannelMutationResult = {
  addThreadToSlackChannel: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type AddThreadToSlackChannelMutationVariables = {
  slackChannelID: string;
  threadID: string;
  installBot: Maybe<boolean>;
  byExternalID: Maybe<boolean>;
};

export type AnnotationsOnPageQueryResult = {
  annotationsOnPage: {
    allAnnotations: Array<
      MessageAnnotationAttachmentFragment & {
        message: {
          id: UUID;
          source: {
            id: UUID;
          };
          thread: {
            id: UUID;
          };
        };
      }
    >;
    hiddenAnnotationIDs: Array<UUID>;
  };
};

export type AnnotationsOnPageQueryVariables = {
  pageContext: PageContextInput;
  includeDeleted: Maybe<boolean>;
  _externalOrgID: Maybe<string>;
};

export type AnnotationsOnPageSubscriptionResult = {
  annotationsOnPageUpdated: {
    allAnnotations: Array<
      MessageAnnotationAttachmentFragment & {
        message: {
          id: UUID;
          source: {
            id: UUID;
          };
          thread: {
            id: UUID;
          };
        };
      }
    >;
    hiddenAnnotationIDs: Array<UUID>;
  };
};

export type AnnotationsOnPageSubscriptionVariables = {
  pageContext: PageContextInput;
  includeDeleted: Maybe<boolean>;
  _externalOrgID: Maybe<string>;
};

export type ApplicationSpecificationsQueryResult = {
  application: Nullable<{
    id: UUID;
    name: string;
    customLinks: {
      learnMore: Nullable<string>;
      leaveFeedback: Nullable<string>;
      upgradePlan: Nullable<string>;
    };
    iconURL: Nullable<string>;
    customNUX: Nullable<{
      initialOpen: Nullable<CustomNUXStepContentFragment>;
      welcome: Nullable<CustomNUXStepContentFragment>;
    }>;
    environment: ApplicationEnvironment;
  }>;
};

export type AutocompleteQueryResult = {
  organizationByExternalID: Nullable<{
    usersWithOrgDetails: Array<{
      id: UUID;
      externalID: string;
      displayName: string;
      fullName: string;
      name: Nullable<string>;
      shortName: Nullable<string>;
      profilePictureURL: Nullable<string>;
      metadata: Metadata;
      canBeNotifiedOnSlack: boolean;
      linkedUserID: Nullable<UUID>;
      slackUserWithMatchingEmail: Nullable<UUID>;
    }>;
    linkedOrganization: Nullable<{
      usersWithOrgDetails: Array<{
        id: UUID;
        externalID: string;
        displayName: string;
        fullName: string;
        name: Nullable<string>;
        shortName: Nullable<string>;
        profilePictureURL: Nullable<string>;
        metadata: Metadata;
        canBeNotifiedOnSlack: boolean;
      }>;
    }>;
  }>;
};

export type AutocompleteQueryVariables = {
  nameQuery: Maybe<string>;
  _externalOrgID: string;
  sortUsersBy: Maybe<Context>;
  sortUsersDirection: Maybe<SortDirection>;
};

export type BootstrapQueryResult = {
  featureFlags: Array<{
    key: string;
    value: SimpleValue;
  }>;
  application: Nullable<{
    id: UUID;
    name: string;
    customLinks: {
      learnMore: Nullable<string>;
      leaveFeedback: Nullable<string>;
      upgradePlan: Nullable<string>;
    };
    iconURL: Nullable<string>;
    customNUX: Nullable<{
      initialOpen: Nullable<CustomNUXStepContentFragment>;
      welcome: Nullable<CustomNUXStepContentFragment>;
    }>;
    environment: ApplicationEnvironment;
  }>;
};

export type BootstrapQueryVariables = {
  featureFlagKeys: Array<string>;
};

export type CanEditExternalTaskQueryResult = {
  task: Nullable<{
    thirdPartyReference: Nullable<{
      canEdit: boolean;
    }>;
  }>;
};

export type CanEditExternalTaskQueryVariables = {
  taskID: UUID;
  externalType: ThirdPartyConnectionType;
  _externalOrgID: Maybe<string>;
};

export type ClearDeepLinkThreadIDMutationResult = {
  clearDeepLinkThreadID: {
    success: boolean;
  };
};

export type ConversationThreadsQueryResult = {
  threadsAtLocation: {
    threads: Array<ThreadFragment>;
  };
  viewer: {
    deepLinkInfo: Nullable<{
      threadID: UUID;
      messageID: Nullable<UUID>;
    }>;
  };
};

export type ConversationThreadsQueryVariables = {
  location: Context;
  _externalOrgID: Maybe<string>;
};

export type CreateFileMutationResult = {
  createFile: {
    downloadURL: string;
    uploadURL: Nullable<string>;
  };
};

export type CreateFileMutationVariables = {
  id: UUID;
  name: string;
  mimeType: string;
  size: Maybe<Int>;
  threadOrgID: Maybe<UUID>;
};

export type CreateMessageByExternalIDMutationResult = {
  createMessageByExternalID: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type CreateMessageByExternalIDMutationVariables = {
  input: CreateMessageByExternalIDInput;
  _externalOrgID: Maybe<string>;
};

export type CreateMessageReactionMutationResult = {
  createMessageReaction: {
    success: boolean;
  };
};

export type CreateMessageReactionMutationVariables = {
  messageID: UUID;
  unicodeReaction: string;
};

export type CreateThreadMutationResult = {
  createThread: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
      code: string;
    }>;
  };
};

export type CreateThreadMutationVariables = {
  input: CreateThreadInput;
  externalThreadID: Maybe<string>;
  _externalOrgID: Maybe<string>;
};

export type CreateThreadMessageMutationResult = {
  createThreadMessage: {
    success: boolean;
  };
};

export type CreateThreadMessageMutationVariables = {
  input: CreateThreadMessageInput;
  _externalOrgID: Maybe<string>;
};

export type DeepLinkThreadIDQueryResult = {
  viewer: {
    deepLinkInfo: Nullable<{
      threadID: UUID;
    }>;
  };
};

export type DeleteMessageReactionMutationResult = {
  deleteMessageReaction: {
    success: boolean;
  };
};

export type DeleteMessageReactionMutationVariables = {
  messageID: UUID;
  reactionID: UUID;
};

export type DeleteNotificationMutationResult = {
  deleteNotification: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
      code: string;
    }>;
  };
};

export type DeleteNotificationMutationVariables = {
  notificationID: string;
  byExternalID: Maybe<boolean>;
};

export type DisconnectThirdPartyMutationResult = {
  disconnectThirdParty: {
    success: boolean;
  };
};

export type DisconnectThirdPartyMutationVariables = {
  type: ThirdPartyConnectionType;
  _externalOrgID: Maybe<string>;
};

export type FeatureFlagsQueryResult = {
  featureFlags: Array<{
    key: string;
    value: SimpleValue;
  }>;
};

export type FeatureFlagsQueryVariables = {
  keys: Array<string>;
};

export type HideLinkPreviewMutationResult = {
  hideLinkPreview: {
    success: boolean;
  };
};

export type HideLinkPreviewMutationVariables = {
  linkPreviewID: UUID;
};

export type InboxCountQueryResult = {
  viewer: {
    inbox: {
      count: Int;
    };
  };
};

export type InboxQueryResult = {
  viewer: {
    inbox: {
      threads: Array<InboxThreadFragment2Fragment>;
      threadsArchive: Array<InboxThreadFragment2Fragment>;
    };
  };
};

export type InboxSubscriptionResult = {
  inbox: Nullable<{
    count: Int;
  }>;
};

export type LoadMessagesToDeepLinkedMessageQueryResult = {
  thread: {
    id: UUID;
    loadNewestMessagesToTarget: {
      messages: Array<MessageFragment>;
      olderMessagesCount: Int;
    };
  };
};

export type LoadMessagesToDeepLinkedMessageQueryVariables = {
  threadID: UUID;
  deepLinkedMessageID: UUID;
  ignoreDeleted: Maybe<boolean>;
};

export type LogDeprecationMutationResult = {
  logDeprecation: boolean;
};

export type LogDeprecationMutationVariables = {
  key: string;
};

export type LogEventsMutationResult = {
  logEvents: boolean;
};

export type LogEventsMutationVariables = {
  events: Array<LogEventInput>;
  _externalOrgID: Maybe<string>;
};

export type MarkAllNotificationsAsReadMutationResult = {
  markAllNotificationsAsRead: {
    success: boolean;
  };
};

export type MarkAllNotificationsAsReadMutationVariables = {
  filter: Maybe<NotificationFilterInput>;
};

export type ClearNotificationsForMessageMutationResult = {
  clearNotificationsForMessage: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
      code: string;
    }>;
  };
};

export type ClearNotificationsForMessageMutationVariables = {
  messageID: string;
  byExternalID: boolean;
};

export type MarkNotificationAsReadMutationResult = {
  markNotificationAsRead: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type MarkNotificationAsReadMutationVariables = {
  notificationID: string;
  byExternalID: boolean;
};

export type MarkNotificationAsUnreadMutationResult = {
  markNotificationAsUnread: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type MarkNotificationAsUnreadMutationVariables = {
  notificationExternalID: string;
};

export type MarkThreadSeenMutationResult = {
  markThreadSeen: {
    success: boolean;
  };
};

export type MarkThreadSeenMutationVariables = {
  threadID: UUID;
};

export type MarkThreadsSeenMutationResult = {
  markThreadsSeen: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type MarkThreadsSeenMutationVariables = {
  input: MarkThreadsSeenInput;
  _externalOrgID: Maybe<string>;
};

export type MessageByExternalIDQueryResult = {
  messageByExternalID: Nullable<MessageFragment>;
};

export type MessageByExternalIDQueryVariables = {
  id: string;
  _externalOrgID: Maybe<string>;
};

export type MessageByExternalIDWithThreadQueryResult = {
  messageByExternalID: Nullable<
    MessageFragment & {
      thread: ThreadFragment;
    }
  >;
};

export type MessageByExternalIDWithThreadQueryVariables = {
  id: string;
  _externalOrgID: Maybe<string>;
};

export type MessageContentSearchQueryResult = {
  messageContentSearch: Array<
    MessageFragment & {
      thread: {
        externalID: string;
        externalOrgID: string;
        name: Nullable<string>;
        location: Context;
      };
    }
  >;
};

export type MessageContentSearchQueryVariables = {
  textToMatch: Maybe<string>;
  authorExternalID: Maybe<string>;
  orgExternalID: Maybe<string>;
  metadata: Maybe<Metadata>;
  locationOptions: Maybe<SearchLocationOptions>;
  timestampRange: Maybe<TimestampRange>;
  limit: Maybe<Int>;
  sortBy: Maybe<SearchSortByOptions>;
  sortDirection: Maybe<SortDirection>;
};

export type NotificationByExternalIDQueryResult = {
  notificationByExternalID: Nullable<NotificationsNodeFragment>;
};

export type NotificationByExternalIDQueryVariables = {
  externalID: string;
};

export type NotificationSummaryQueryResult = {
  notificationSummary: {
    unreadNotificationCount: Int;
  };
};

export type NotificationSummaryQueryVariables = {
  filter: Maybe<NotificationFilterInput>;
};

export type NotificationSummarySubscriptionResult = {
  notificationSummaryUpdated: {
    unreadNotificationCount: Int;
  };
};

export type NotificationSummarySubscriptionVariables = {
  filter: Maybe<NotificationFilterInput>;
};

export type NotificationsQueryResult = {
  notifications: {
    nodes: Array<NotificationsNodeFragment>;
    paginationInfo: {
      endCursor: string;
      hasNextPage: boolean;
    };
  };
};

export type NotificationsQueryVariables = {
  first: Int;
  after: Maybe<string>;
  filter: Maybe<NotificationFilterInput>;
};

export type NotificationEventsSubscriptionResult = {
  notificationEvents:
    | {
        __typename: 'NotificationAdded';
        notification: NotificationsNodeFragment;
      }
    | {
        __typename: 'NotificationReadStateUpdated';
        notification: NotificationsNodeFragment;
      }
    | {
        __typename: 'NotificationDeleted';
        id: UUID;
      };
};

export type NotificationEventsSubscriptionVariables = {
  filter: Maybe<NotificationFilterInput>;
};

export type OlderThreadMessagesQueryResult = {
  thread: {
    id: UUID;
    loadMessages: {
      messages: Array<MessageFragment>;
      olderMessagesCount: Int;
    };
  };
};

export type OlderThreadMessagesQueryVariables = {
  threadID: UUID;
  cursor: Maybe<UUID>;
  range: Maybe<Int>;
  ignoreDeleted: boolean;
};

export type OrgMembersByExtIDPaginatedQueryResult = {
  orgMembersByExternalIDPaginated: {
    hasMore: boolean;
    token: Nullable<string>;
    users: Array<UserFragment>;
  };
};

export type OrgMembersByExtIDPaginatedQueryVariables = {
  externalOrgID: string;
  after: Maybe<UUID>;
  limit: Maybe<Int>;
};

export type OrgMembersUpdatedSubscriptionResult = {
  orgMembersByExternalIDUpdated:
    | {
        __typename: 'OrgMemberAdded';
        user: UserFragment;
      }
    | {
        __typename: 'OrgMemberRemoved';
        externalUserID: string;
      };
};

export type OrgMembersUpdatedSubscriptionVariables = {
  externalOrgID: string;
};

export type PingQueryResult = {
  ping: string;
};

export type PreferencesSubscriptionResult = {
  preferencesLiveQuery: JsonObjectReducerData;
};

export type PresenceLiveQuerySubscriptionResult = {
  presenceLiveQuery: {
    data: Array<{
      externalUserID: string;
      ephemeral: Nullable<{
        contexts: Nullable<Array<Context>>;
      }>;
      durable: Nullable<{
        context: Context;
        timestamp: Float;
      }>;
    }>;
    complete: boolean;
  };
};

export type PresenceLiveQuerySubscriptionVariables = {
  input: PresenceLiveQueryInput;
  _externalOrgID: Maybe<string>;
};

export type RefreshFileUploadURLMutationResult = {
  refreshFileUploadURL: string;
};

export type RefreshFileUploadURLMutationVariables = {
  id: UUID;
  size: Int;
};

export type ResetUserHiddenAnnotationsMutationResult = {
  resetUserHiddenAnnotations: {
    success: boolean;
  };
};

export type SendSampleWelcomeMessageMutationResult = {
  sendSampleWelcomeMessage: {
    success: boolean;
  };
};

export type SendSampleWelcomeMessageMutationVariables = {
  messageLocation: Context;
  url: string;
  _externalOrgID: Maybe<string>;
};

export type SetAnnotationVisibleMutationResult = {
  setAnnotationVisible: {
    success: boolean;
  };
};

export type SetAnnotationVisibleMutationVariables = {
  annotationID: UUID;
  visible: boolean;
  _externalOrgID: Maybe<string>;
};

export type SetDeepLinkThreadIDMutationResult = {
  setDeepLinkThreadID: {
    success: boolean;
  };
};

export type SetDeepLinkThreadIDMutationVariables = {
  threadID: UUID;
};

export type SetFileUploadStatusMutationResult = {
  setFileUploadStatus: {
    success: boolean;
  };
};

export type SetFileUploadStatusMutationVariables = {
  id: UUID;
  status: FileUploadStatusEnumType;
  threadOrgID: Maybe<UUID>;
};

export type SetPreferenceMutationResult = {
  setPreference: Nullable<JSON>;
};

export type SetPreferenceMutationVariables = {
  key: string;
  value: JSON;
};

export type SetPresentContextMutationResult = {
  setPresentContext: Nullable<boolean>;
};

export type SetPresentContextMutationVariables = {
  context: JSONObject;
  present: boolean;
  durable: boolean;
  exclusivityRegion: Maybe<JSONObject>;
  _externalOrgID: Maybe<string>;
};

export type SetSubscribedByExternalIDMutationResult = {
  setSubscribedByExternalID: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type SetSubscribedByExternalIDMutationVariables = {
  externalID: string;
  subscribed: boolean;
};

export type SetSubscribedMutationResult = {
  setSubscribed: boolean;
};

export type SetSubscribedMutationVariables = {
  threadID: UUID;
  subscribed: boolean;
};

export type SetThreadMetadataMutationResult = {
  setThreadMetadata: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type SetThreadMetadataMutationVariables = {
  threadID: UUID;
  metadata: Metadata;
};

export type SetThreadNameMutationResult = {
  setThreadName: {
    success: boolean;
  };
};

export type SetThreadNameMutationVariables = {
  threadID: UUID;
  name: string;
};

export type SetThreadResolvedMutationResult = {
  setThreadResolved: {
    success: boolean;
  };
};

export type SetThreadResolvedMutationVariables = {
  threadID: UUID;
  resolved: boolean;
};

export type SetTypingMutationResult = {
  setTyping: boolean;
};

export type SetTypingMutationVariables = {
  threadID: UUID;
  typing: boolean;
};

export type ShareThreadToEmailMutationResult = {
  shareThreadToEmail: {
    success: boolean;
    failureDetails: Nullable<{
      message: Nullable<string>;
      code: string;
    }>;
  };
};

export type ShareThreadToEmailMutationVariables = {
  threadID: string;
  email: string;
  screenshotID: Maybe<UUID>;
  byExternalID: Maybe<boolean>;
};

export type SlackChannelsQueryResult = {
  organization: Nullable<{
    id: UUID;
    joinableSlackChannels: Array<{
      slackID: string;
      name: string;
    }>;
    joinedSlackChannels: Array<{
      slackID: string;
      name: string;
    }>;
  }>;
};

export type SlackChannelsQueryVariables = {
  orgID: UUID;
};

export type SlackConnectedLiveQuerySubscriptionResult = {
  slackConnectedLiveQuery: {
    isOrgConnected: boolean;
    isUserConnected: boolean;
  };
};

export type SlackConnectedLiveQuerySubscriptionVariables = {
  orgID: UUID;
};

export type ThirdPartyConnectionConfigurationQueryResult = {
  viewer: {
    thirdPartyConnection: {
      configuration: Nullable<JSON>;
    };
  };
};

export type ThirdPartyConnectionConfigurationQueryVariables = {
  type: ThirdPartyConnectionType;
  _externalOrgID: Maybe<string>;
};

export type ThirdPartyConnectionsQueryResult = {
  viewer: {
    asana: {
      connected: boolean;
      oAuthStateToken: string;
    };
    jira: {
      connected: boolean;
      oAuthStateToken: string;
    };
    linear: {
      connected: boolean;
      oAuthStateToken: string;
    };
    trello: {
      connected: boolean;
      oAuthStateToken: string;
    };
    monday: {
      connected: boolean;
      oAuthStateToken: string;
    };
  };
};

export type ThirdPartyConnectionsQueryVariables = {
  _externalOrgID: Maybe<string>;
};

export type Thread2QueryResult = {
  thread: ThreadFragment;
};

export type Thread2QueryVariables = {
  threadID: UUID;
};

export type ThreadActivityQueryResult = {
  activity: {
    threadSummary: ThreadActivitySummaryFragment;
  };
};

export type ThreadActivityQueryVariables = {
  pageContext: Maybe<PageContextInput>;
  partialMatch: Maybe<boolean>;
  metadata: Maybe<Metadata>;
  resolved: Maybe<boolean>;
  viewer: Maybe<Array<ViewerThreadFilter>>;
  _externalOrgID: Maybe<string>;
};

export type ThreadActivitySummarySubscriptionResult = {
  threadActivitySummary: ThreadActivitySummaryFragment;
};

export type ThreadActivitySummarySubscriptionVariables = {
  pageContext: Maybe<PageContextInput>;
  partialMatch: Maybe<boolean>;
  metadata: Maybe<Metadata>;
  viewer: Maybe<Array<ViewerThreadFilter>>;
  resolved: Maybe<boolean>;
  _externalOrgID: Maybe<string>;
};

export type ThreadByExternalID2QueryResult = {
  threadByExternalID2: {
    id: UUID;
    thread: Nullable<ThreadByExternalIDFragment>;
  };
};

export type ThreadByExternalID2QueryVariables = {
  input: ThreadByExternalID2Input;
  initialFetchCount: Maybe<Int>;
  _externalOrgID: Maybe<string>;
};

export type ThreadEventsSubscriptionResult = {
  threadEvents:
    | {
        __typename: 'ThreadCreated';
        thread: ThreadFragment;
      }
    | {
        __typename: 'ThreadMessageAdded';
        message: MessageFragment;
      }
    | {
        __typename: 'ThreadMessageUpdated';
        message: MessageFragment;
      }
    | {
        __typename: 'ThreadMessageContentAppended';
        id: UUID;
        appendedContent: string;
      }
    | {
        __typename: 'ThreadMessageRemoved';
        id: UUID;
      }
    | {
        __typename: 'ThreadParticipantsUpdatedIncremental';
        participant: ThreadParticipantFragment;
      }
    | {
        __typename: 'ThreadTypingUsersUpdated';
        users: Array<UserFragment>;
      }
    | {
        __typename: 'ThreadShareToSlack';
        id: UUID;
        info: Nullable<{
          channel: Nullable<string>;
          slackURL: Nullable<string>;
        }>;
      }
    | {
        __typename: 'ThreadPropertiesUpdated';
        thread: {
          url: string;
          location: Context;
          resolved: boolean;
          resolvedTimestamp: Nullable<DateTime>;
          name: Nullable<string>;
          metadata: Metadata;
          extraClassnames: Nullable<string>;
        };
      }
    | {
        __typename: 'ThreadSubscriberUpdated';
        subscriber: ThreadParticipantFragment;
      }
    | {
        __typename: 'ThreadDeleted';
        id: UUID;
      };
};

export type ThreadEventsSubscriptionVariables = {
  threadID: UUID;
};

export type ThreadListEventsWithLocationSubscriptionResult = {
  pageEventsWithLocation:
    | {
        __typename: 'PageThreadAdded';
        thread: ThreadFragment;
      }
    | {
        __typename: 'PageThreadDeleted';
        id: UUID;
      }
    | { __typename: 'PageThreadReplyAdded' }
    | { __typename: 'PageVisitorsUpdated' }
    | {
        __typename: 'PageThreadResolved';
        thread: ThreadFragment;
      }
    | {
        __typename: 'PageThreadUnresolved';
        thread: ThreadFragment;
      }
    | {
        __typename: 'ThreadFilterablePropertiesMatch';
        thread: ThreadFragment;
      }
    | {
        __typename: 'ThreadFilterablePropertiesUnmatch';
        id: UUID;
      };
};

export type ThreadListEventsWithLocationSubscriptionVariables = {
  location: Maybe<Context>;
  partialMatch: Maybe<boolean>;
  resolved: Maybe<boolean>;
  filter: Maybe<ThreadFilterInput>;
  _externalOrgID: Maybe<string>;
};

export type ThreadListQueryResult = {
  threadsAtLocation: {
    threads: Array<ThreadFragment>;
    hasMore: boolean;
    token: Nullable<string>;
  };
};

export type ThreadListQueryVariables = {
  location: Maybe<Context>;
  filter: Maybe<ThreadFilterInput>;
  resolved: Maybe<boolean>;
  partialMatch: Maybe<boolean>;
  sort: ThreadSortInput;
  limit: Maybe<Int>;
  after: Maybe<string>;
  _externalOrgID: Maybe<string>;
};

export type UnlinkOrgMutationResult = {
  unlinkOrgs: {
    success: boolean;
  };
};

export type UnlinkOrgMutationVariables = {
  _externalOrgID: Maybe<string>;
};

export type UnreadMessageCountQueryResult = {
  thread: {
    newMessagesCount: Int;
  };
};

export type UnreadMessageCountQueryVariables = {
  threadID: UUID;
};

export type UpdateMessageByExternalIDMutationResult = {
  updateMessageByExternalID: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type UpdateMessageByExternalIDMutationVariables = {
  input: UpdateMessageByExternalIDInput;
};

export type UpdateMessageMutationResult = {
  updateMessage: {
    success: boolean;
  };
};

export type UpdateMessageMutationVariables = {
  id: UUID;
  content: Maybe<MessageContent>;
  fileAttachments: Maybe<Array<FileAttachmentInput>>;
  annotationAttachments: Maybe<Array<AnnotationAttachmentInput>>;
  deleted: Maybe<boolean>;
  task: Maybe<TaskInput>;
  _externalOrgID: Maybe<string>;
};

export type UpdateThreadByExternalIDMutationResult = {
  updateThreadByExternalID: {
    success: boolean;
    failureDetails: Nullable<{
      code: string;
      message: Nullable<string>;
    }>;
  };
};

export type UpdateThreadByExternalIDMutationVariables = {
  externalThreadID: string;
  url: Maybe<string>;
  name: Maybe<string>;
  metadata: Maybe<Metadata>;
  resolved: Maybe<boolean>;
  extraClassnames: Maybe<string>;
  typing: Maybe<boolean>;
};

export type UserLiveQuerySubscriptionResult = {
  userLiveQuery: {
    users: Array<UserFragment>;
    upto: Float;
  };
};

export type UserLiveQuerySubscriptionVariables = {
  since: Maybe<Float>;
};

export type UsersByExternalIDQueryResult = {
  usersByExternalID: Array<UserFragment>;
};

export type UsersByExternalIDQueryVariables = {
  externalIDs: Array<string>;
};

export type UsersQueryResult = {
  users: Array<UserFragment>;
};

export type UsersQueryVariables = {
  ids: Array<UUID>;
};

export type ViewerIdentityLiveQuerySubscriptionResult = {
  viewerIdentityLiveQuery: ViewerIdentityFragment;
};

export type ViewerIdentityLiveQuerySubscriptionVariables = {
  _externalOrgID: Maybe<string>;
};

export type ViewerIdentityQueryResult = {
  viewerIdentity: ViewerIdentityFragment;
};

export type ViewerIdentityQueryVariables = {
  _externalOrgID: Maybe<string>;
};
