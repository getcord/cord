// See #8935:
/// <reference lib="es2022" />

import type OpenAI from 'openai';

import jsonStableStringify from 'fast-json-stable-stringify';
import type { Placement } from '@floating-ui/react-dom';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

export type {
  DocumentAnnotationResult,
  Screenshot,
  DocumentLocation,
  LocationTextConfig,
  HighlightedTextConfig,
  AdditionalTargetData,
  Annotation,
  AnnotationWithThreadID,
  AnnotationCapturePosition,
} from '@cord-sdk/types';
export { locationJson } from '@cord-sdk/types';
import { locationJson, MessageNodeType } from '@cord-sdk/types';
import type {
  FlatJsonObject,
  LocationFilterOptions,
  ResolvedStatus,
  MessageAnnotation,
  ElementIdentifierVersion,
  EntityMetadata,
  NotificationListFilter,
  ThreadListFilter,
  JsonValue,
  JsonObject,
  MessageContent,
  MessageNode,
  ViewerThreadStatus,
} from '@cord-sdk/types';

export type {
  MessageAnnotation,
  ElementIdentifierVersion,
  EntityMetadata,
  NotificationListFilter,
  ThreadListFilter,
  JsonValue,
  JsonObject,
};

export type SimpleTranslationParameters = FlatJsonObject;

export enum DataTableQueries {
  ADMIN_USERS = 'admin_users',
  SET_ADMIN = 'set_admin',
  USER_DETAILS = 'user_details',
  ORG_DETAILS = 'org_details',
  APP_DETAILS = 'app_details',
  THREAD_DETAILS = 'thread_details',
  MESSAGE_DETAILS = 'message_details',
  CUSTOMER_DETAILS = 'customer_details',
  ORG_MEMBER_DETAILS = 'org_member_details',
  ID_SEARCH = 'id_search',
  PROD_APPLICATIONS = 'prod_applications',
  STAGING_APPLICATIONS = 'staging_applications',
  SAMPLE_APPLICATIONS = 'sample_applications',
  VERIFIED_CUSTOMERS = 'verified_customers',
  SAMPLE_CUSTOMERS = 'sample_customers',
  DEPLOYS = 'deploys',
  PAGE_CONTEXTS = 'page_contexts',
  BROWSER_METRICS = 'browser_metrics',
  OS_METRICS = 'os_metrics',
  GO_REDIRECTS = 'go_redirects',
}

export type NonNullableKeys<T, K extends keyof T> = T & {
  [P in K]: NonNullable<T[P]>;
};

export type NullableKeys<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

export type ElementOf<T extends Array<any>> = T[number];

/**
 * A mapping type that effectively combines Required<T> and NonNullable<T> to
 * turn { foo?: string | undefined } into { foo: string }
 */
// NOTE(9/9/2021): This is equivalent to Required<T> if we compiled with
// --strictNullChecks, but we currently don't
export type ReallyRequired<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export type { MessageContent, MessageNode };
export { MessageNodeType };

export type UUID = string;

export type Location = {
  [k: string]: string | number | boolean;
};

export type SortDirection = 'ascending' | 'descending';

export function isValidFlatJsonObject(obj: any): obj is FlatJsonObject {
  if (!obj) {
    return false;
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  for (const [_, value] of Object.entries(obj)) {
    const t = typeof value;
    if (t !== 'string' && t !== 'number' && t !== 'boolean') {
      return false;
    }
  }
  return true;
}

export function isLocation(obj: any): obj is Location {
  return isValidFlatJsonObject(obj);
}

export function isValidMetadata(obj: any): obj is EntityMetadata {
  return isValidFlatJsonObject(obj);
}

export function toLocation(obj: any): Location | null {
  return isLocation(obj) ? obj : null;
}

// We receive location as either Location or LocationFilterOptions from
// our apis. Since Location type can be flat object with multiple properties
// we have to check the property type to make sure we're getting the right value.
// eg: {value: 'foo', ...} is Location
// while {value: {value: 'foo'} ...} is LocationFilterOptions
export function getLocationFilter(
  obj: LocationFilterOptions | Location | undefined,
): LocationFilterOptions | undefined {
  if (!obj) {
    return undefined;
  }

  if (isLocation(obj)) {
    return { value: obj, partialMatch: false };
  }

  if (isLocation(obj.value)) {
    return obj;
  }
  return undefined;
}

// Function to convert our external resolvedStatus filter enum
// to our internal 'resolved' boolean property
export function getResolvedFromStatus(
  status: ResolvedStatus,
): boolean | undefined {
  // we've not included a fallback value as this will just increase the chances
  // of returning the wrong data somewhere. So we make sure to pass whatever
  // we've said the default is for the API that's calling this.
  switch (status) {
    case 'resolved': {
      return true;
    }
    case 'unresolved': {
      return false;
    }
    case 'any': {
      return undefined;
    }
    default: {
      const unhandledStatus: never = status;
      throw new Error('Invalid resolved status type ' + unhandledStatus);
    }
  }
}

export function getViewerThreadFilter(
  viewerStatus: ViewerThreadStatus | ViewerThreadStatus[] | undefined,
): ViewerThreadStatus[] {
  if (!viewerStatus) {
    return [];
  }
  if (typeof viewerStatus === 'string') {
    return [viewerStatus];
  }
  return viewerStatus;
}

export function metadataMatches(
  metadata: EntityMetadata,
  matcher: EntityMetadata,
): boolean {
  for (const [key, value] of Object.entries(matcher)) {
    if (metadata[key] !== value) {
      return false;
    }
  }
  return true;
}

export function locationMatches(context: Location, matcher: Location): boolean {
  for (const [key, value] of Object.entries(matcher)) {
    if (context[key] !== value) {
      return false;
    }
  }
  return true;
}

function flatJsonObjectEqual(
  a: FlatJsonObject | null,
  b: FlatJsonObject | null,
): boolean {
  if (a === null && b === null) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }
  for (const [key, value] of Object.entries(a)) {
    if (b[key] !== value) {
      return false;
    }
  }
  return true;
}

export function locationEqual(a: Location | null, b: Location | null): boolean {
  return flatJsonObjectEqual(a, b);
}

export function metadataEqual(
  a: EntityMetadata | null,
  b: EntityMetadata | null,
): boolean {
  return flatJsonObjectEqual(a, b);
}

/**
 * Implements the canonical comparison for locations.  Currently, this sorts by
 * number of elements, then the JSON representation alphabetically, but we can
 * change that if we come up with something better.
 */
export function locationCompare(a: Location, b: Location): number {
  const lengthA = Object.keys(a).length;
  const lengthB = Object.keys(b).length;
  if (lengthA !== lengthB) {
    return lengthA - lengthB;
  }
  return locationJson(a).localeCompare(locationJson(b));
}

export type PageContext = {
  providerID: UUID | null;
  data: Location;
};

export function pageContextEqual(
  a: PageContext | null,
  b: PageContext | null,
): boolean {
  if (a === null && b === null) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  // Two contexts from different providers are never equal
  if (a.providerID !== b.providerID) {
    return false;
  }
  // If either has data, compare the data, otherwise compare the locations
  return isEqual(a.data, b.data);
}

// This returns a string key that is equivalent from an equality perspective to
// comparing the pageContexts.  Specifically, the intention is that
// pageContextEqual(a, b) === (pageContextKey(a) === pageContextKey(b))

// The functioning of this depends a lot on our specific logic of
// building PageContexts, such that, for instance,
// a.location === b.location => a.providerID === b.providerID.

// It also needs to stay consistent with the logic in server/src/util/hash.ts.
export function pageContextKey(pageContext: PageContext): string {
  return jsonStableStringify({
    providerID: pageContext.providerID,
    data: pageContext.data,
  });
}

/**
 * Convert a PageContext-like object into an actual PageContext.
 *
 * The PageContext types that we exchange with GraphQL allow nullable fields to
 * be undefined as well. This function takes such objects and returns a valid
 * PageContext.
 */
type PageContextLike = {
  providerID?: UUID | null;
  data: Location;
};
export function toPageContext(pageContext: PageContextLike): PageContext;
export function toPageContext(pageContext: null | undefined): null;
export function toPageContext(
  pageContext: PageContextLike | null | undefined,
): PageContext | null;
export function toPageContext(
  pageContext: PageContextLike | null | undefined,
): PageContext | null {
  if (!pageContext) {
    return null;
  }
  const { providerID, data } = pageContext;
  if (!isLocation(data)) {
    throw new Error('Invalid context');
  }
  return {
    providerID: providerID ?? null,
    data,
  };
}

export type OrgMemberState = 'active' | 'inactive' | 'deleted'; // must match the keys in OrgMemberStateEnumType

export type UserType = 'person' | 'bot'; // must match the keys in UserTypeEnumType

export type UserState = 'active' | 'deleted'; // must match the keys in UserStateEnumType

export type ImportedSlackMessageType = 'reply' | 'supportBotReply'; // must match the keys in ImportedSlackMessageTypeEnumType

export type MessageType = 'action_message' | 'user_message'; //must match the keys in MessageTypeEnumType

export interface Todo {
  id: UUID;
  done: boolean;
}

export enum MessageAttachmentType {
  FILE = 'file',
  ANNOTATION = 'annotation',
  SCREENSHOT = 'screenshot',
}

export const MessageAnnotationAttachmentTypeName =
  'MessageAnnotationAttachment';

export function parseElementIdentifierVersion(
  val: string,
): ElementIdentifierVersion | null {
  if (val === '1' || val === '2') {
    return val;
  }
  return null;
}

export enum ElementIdentifierMatch {
  EXACT = 'exact',
  PARTIAL = 'partial',
  NONE = 'none',
}

export enum LocationMatch {
  EXACT = 'exact',
  SIBLING = 'sibling',
  MULTIMEDIA = 'multimedia',
  CHART = 'chart',
  STALE = 'stale',
  MAYBE_STALE = 'maybe_stale',
  NONE = 'none',
  // User has old extension, and does not have the latest identifier version
  INCOMPATIBLE_IDENTIFIER_VERSION = 'incompatible_identifier_version',
  // Used if fallback document coordinates are included, and we don't have an exact/sibling match
  DOCUMENT_COORDINATES = 'document_coordinates',
  // If we weren't able to annotate, so we're instead relying on the screenshot
  // Examples: annotating a pdf, annotating an iframe we can't access
  UNAVAILABLE = 'unavailable',
  // If the annotation was on an inaccessible cross-domain iframe. We want to
  // show it while the message is being drafted, but not after it's been posted
  INACCESSIBLE_CROSS_DOMAIN_IFRAME = 'inaccessible_cross_domain_iframe',
  OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST = 'outside_accessible_virtualised_list',
  OUTSIDE_INACCESSIBLE_VIRTUALISED_LIST = 'outside_inaccessible_virtualised_list',
}

export function annotationHasLocation(annotation: MessageAnnotation) {
  return annotation.location !== null || annotation.customLocation !== null;
}

export const ThreadCreatedTypeName = 'ThreadCreated';
export const ThreadMessageAddedTypeName = 'ThreadMessageAdded';
export const ThreadMessageUpdatedTypeName = 'ThreadMessageUpdated';
export const ThreadMessageContentAppendedTypeName =
  'ThreadMessageContentAppended';
export const ThreadMessageRemovedTypeName = 'ThreadMessageRemoved';
export const ThreadParticipantsUpdatedIncrementalTypeName =
  'ThreadParticipantsUpdatedIncremental';
export const ThreadTypingUsersUpdatedTypeName = 'ThreadTypingUsersUpdated';
export const ThreadShareToSlackTypeName = 'ThreadShareToSlack';
export const ThreadPropertiesUpdatedTypeName = 'ThreadPropertiesUpdated';
export const ThreadSubscriberUpdatedTypeName = 'ThreadSubscriberUpdated';
export const ThreadDeletedTypeName = 'ThreadDeleted';

export const PageThreadAddedTypeName = 'PageThreadAdded';
export const PageThreadDeletedTypename = 'PageThreadDeleted';
export const PageThreadReplyAddedTypeName = 'PageThreadReplyAdded';
export const PageVisitorsUpdatedTypeName = 'PageVisitorsUpdated';
export const PageThreadResolvedTypeName = 'PageThreadResolved';
export const PageThreadUnresolvedTypeName = 'PageThreadUnresolved';
export const ThreadFilterablePropertiesMatchTypeName =
  'ThreadFilterablePropertiesMatch';
export const ThreadFilterablePropertiesUnmatchTypeName =
  'ThreadFilterablePropertiesUnmatch';

export const NotificationAddedTypeName = 'NotificationAdded';
export const NotificationReadStateUpdatedTypeName =
  'NotificationReadStateUpdated';
export const NotificationDeletedTypeName = 'NotificationDeleted';

export const OrgMemberAddedTypeName = 'OrgMemberAdded';
export const OrgMemberRemovedTypeName = 'OrgMemberRemoved';

export const ConsoleGettingStartedUpdatedTypeName =
  'ConsoleGettingStartedUpdated';

export const CustomerSubscriptionUpdatedTypeName =
  'CustomerSubscriptionUpdated';

export type FileAttachmentInput = {
  id: UUID;
  fileID: UUID;
};

// Subset of winston log levels, which can be found in NpmConfigSetLevels type in winston type file
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export type PopperPosition = Placement;

// called when the sidebar shows and hides, with a reference to the Cord iframe
// expected to make domain-specific document adjustments to accommodate the sidebar
// in its two states (expanded / not).
export type DocumentMutator = (width: number | null) => void;

// called with the document to initialize any mutator-specific elements and behavior
// expected to return the actual mutator function
export type DocumentMutatorInitializer = (
  document: Document,
) => DocumentMutator;

export type SimpleValue = string | number | boolean;

export type PreferencesValueType = JsonValue;

export type PreferencesType = JsonObject;

export enum UserReference {
  MENTION = 'mention',
  ASSIGNEE = 'assignee',
}

export type RuleProviderInfo = {
  id: UUID; // the ID of the provider, should be unique among providers
  name: string; // the name of the provider
  iconURL?: string | null; // URL for a favicon-like image
  nuxText?: string | null; // the text to show the user teaching them how to use Radical on this specific provider
  disableAnnotations?: boolean; // if annotations should be disabled for this provider. example: slack static PDFs where due to the chrome pdf viewer we don't have access to the scroll position
};

// a ruleset provider should export all the rules specific to a SaaS, even when
// those rules span across different domain names.
export type RuleProvider = RuleProviderInfo & {
  domains: string[]; // the domains that this provider's rules cover
  rules: ProviderRule[]; // deny and approve rules
  mergeHashWithLocation?: boolean; // a fix for providers like Snowflake who have URLs with query parameters after the # in the URL
  visibleInDiscoverToolsSection: boolean; // the state of wether the tool is visible in th Discover tools section in the NUX flow, i.e. internal tools should not be included, localhost should not be included
  platformApplicationID: UUID | null; // Application ID of provider, if relevant

  // the functions to call to mutate the document to make room for the sidebar.
  // this is a list to allow per-domain granularity.
  documentMutators: ProviderDocumentMutator[];
};

export type ProviderRule = {
  id: UUID;
  type: ProviderRuleType;
  matchPatterns: ProviderRuleMatchPatterns;
  nameTemplate: string | null;
  contextTransformation: PageContextTransformation;
  observeDOMMutations: boolean;
};

export type ProviderDocumentMutator =
  | { id: UUID; type: 'default_css'; config: CSSMutatorConfig }
  | { id: UUID; type: 'custom_css'; config: CSSMutatorConfig }
  | { id: UUID; type: 'fixed_elements'; config: null };

export type ProviderDocumentMutatorType = ProviderDocumentMutator['type'];

export type CSSMutatorConfig = {
  cssTemplate: string;
};

export type ProviderRuleType = 'allow' | 'deny';

export type ProviderRuleMatchPatterns = {
  protocol?: string;
  domain?: string;
  path?: string;
  hash?: string;
  queryParams?: { [key: string]: string };
  selector?: string;
  contains?: string;
};

export type ProviderRuleTestMatchType = 'allow' | 'deny' | 'none';

export type PageDetails = {
  pageContext: PageContext;
  pageName: string | null;
};

export type MatchResult = (
  | {
      match: 'allow' | 'deny';
      ruleID: UUID;
    }
  | {
      match: 'none';
    }
) &
  PageDetails;

export type PageContextTransformationType =
  | 'default'
  | 'replace'
  | 'extend'
  | 'metabase';

export type PageContextTransformation = {
  type: PageContextTransformationType;
  data: JsonObject | null;
};

export type ProvidersResult = {
  ruleProviders: RuleProvider[];
  version: string;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type LinearTeam = {
  id: string;
  name: string;
  projects: {
    nodes: Array<{
      id: string;
      name: string;
    }>;
  };
};

export type AtlassianProject = {
  // expand: 'description,lead,issueTypes,url,projectKeys,permissions,insight',
  id: string; // 10000
  key: string; // STLR
  name: string; // 'Stellar'
  issueTypes: Array<{
    id: string; //'10001'
    // description: 'Tasks track small, distinct pieces of work.';
    name: string;
    subtask: boolean;
    // avatarId: 10318;
    // hierarchyLevel: 0;
  }>;
  simplified: boolean;
  style: string; // 'next-gen'
  isPrivate: boolean;
  entityId: UUID;
  uuid: UUID;
};

export type MondayBoard = {
  id: string;
  name: string;
  subitem_board?: {
    id: string;
  };
  groups: Array<{
    id: string;
    title: string;
    position: string;
  }>;
};

export type JiraConnectionPreferences = {
  projectID: string;
  issueType: string;
  subissueType?: string;
};

export type AsanaConnectionPreferences = {
  projectID: string | undefined;
};

export type MondayConnectionPreferences = {
  boardID: string;
  groupID?: string;
};

type TrelloList = {
  id: UUID;
  name: string;
  closed?: string;
  pos?: number;
  softLimit?: string;
  idBoard?: UUID;
  subscriber: boolean;
};

type TrelloBoard = {
  id: UUID;
  name: string;
  idOrganization: UUID;
  lists: TrelloList[];
};

type TrelloOrg = {
  id: UUID;
  name: string;
};

export type TrelloConnectionPreferencesType = {
  id: UUID;
  email: string;
  boards: TrelloBoard[];
  organizations: TrelloOrg[];
};

export type TrelloCard = {
  name: string;
  desc: string;
  idList: UUID;
};

export type AsanaProject = {
  gid: string;
  name: string;
};

export type JiraIssuePreviewData = {
  key: string;
  title: string;
  url: string;
  assignee: string | undefined;
  status: string;
  done: boolean;
  priority: string;
  subtasks: Array<{
    id: string;
    title: string;
    done: boolean;
  }>;
};

export type AsanaTaskPreviewData = {
  title: string;
  url: string;
  assignee: string | undefined;
  done: boolean;
};

export type LinearIssuePreviewData = {
  title: string;
  identifier: string;
  url: string;
  assignee: string | undefined;
  status: string;
  priority: string;
  done: boolean;
  orgName: string | undefined;
};

export type MondayItemPreviewData = {
  title: string;
  url: string;
  assignee: string | undefined;
  done: boolean;
  assigneeColumnID: string | undefined;
  statusColumnID: string | undefined;
};

export type TaskPreviewData =
  | AsanaTaskPreviewData
  | JiraIssuePreviewData
  | LinearIssuePreviewData
  | MondayItemPreviewData;

export enum LinearIssueStateTypes {
  BACKLOG = 'backlog',
  TODO = 'unstarted',
  IN_PROGRESS = 'started',
  DONE = 'completed',
  CANCELED = 'canceled',
}

export type LinearConnectionPreferences = {
  teamID: string;
  projectID?: string;
};

export type APICordTokenData = {
  session_id: UUID;
};

export type AppServerAuthTokenData = {
  app_id: UUID;
};

export type CustomerServerAuthTokenData = {
  customer_id: UUID;
};

export type NotificationChannels = {
  slack: boolean;
  email: boolean;
};

export type CustomLinks = {
  learnMore?: string | null;
  upgradePlan?: string | null;
  leaveFeedback?: string | null;
};

export type ThirdPartyAuth = 'slack' | 'google' | 'ms-teams';

export type OutboundNotificationType =
  | 'slack'
  | 'email'
  | 'slackEmailMatched'
  | 'sharedToSlackChannel'
  | 'sharedToEmail';

export type { Point2D } from '@cord-sdk/types';

export type CustomNUXStepContent = {
  title: string | null;
  text: string | null;
  imageURL: string | null;
};

export type CustomNUX = {
  initialOpen: CustomNUXStepContent | null;
  welcome: CustomNUXStepContent | null;
};

export type SlackOAuthLinkOrgState = {
  data: {
    userID: string;
    orgID: string;
    platformApplicationID: string;
  };
  type: 'link_org';
  nonce: string;
};

export type SlackOAuthConsoleUserState = {
  data: {
    platformApplicationID: string;
  };
  type: 'console_user';
  nonce: string;
};

export type SlackOAuthDecodeState =
  | SlackOAuthLinkOrgState
  | SlackOAuthConsoleUserState;

export type ThreadSupportStatusType = 'open' | 'closed';

export type UserWithOrgDetails = {
  id: UUID;
  externalID: string;
  displayName: string;
  fullName: string;
  name: string | null;
  shortName: string | null;
  profilePictureURL: string | null;
  metadata: EntityMetadata;
  canBeNotifiedOnSlack: boolean;
};

export type OutboundNotificationMetadata =
  OutboundNotificationMetadataByType[OutboundNotificationType];

// when adding new fields to existing metadata types, either make the new
// fields optional or run a backfill migration
export type OutboundNotificationMetadataByType = {
  slack: Record<string, never>;
  email: Record<string, never>;
  slackEmailMatched: Record<string, never>;
  sharedToSlackChannel: {
    type: 'sharedToSlackChannel';
    targetSlackChannelID: string;
  };
  sharedToEmail: {
    type: 'sharedToEmail';
    targetEmail: string;
  };
};

// Internal threads are the standard mirrored Slack threads
// that users can share to their linked Slack org.
// Support threads are the ones mirrored to a vendor's Slack org
// and support channel after a support bot is mentioned.
export type ThreadMirrorType = 'internal' | 'support';

export type Tier = 'prod' | 'staging' | 'test' | 'dev';

export type SharedToSlackInfo = {
  channel: string | null;
  slackURL: string | null;
};

export type ThreadMode =
  // Only shows the first message, and optionally the number of replies
  | 'collapsed'
  // Can show all messages, also includes a composer to add a new message
  | 'inline'
  // Used in the sidebar only - thread spans across the whole page
  | 'fullHeight'
  // The initial state when we are creating a new thread - composer only
  | 'newThread';

export type Announcement =
  | 'welcome'
  | 'completeProfile'
  | 'connectOrgToSlack'
  | 'linkProfileToSlack'
  | 'slackIsConnected';

export type ReferencedUserData = { id: UUID; name: string };

const DEPLOYMENT_TYPES = ['sdk'] as const;

export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number];

export function isDeploymentType(s: string): s is DeploymentType {
  if (DEPLOYMENT_TYPES.includes(s as DeploymentType)) {
    return true;
  }
  return false;
}

export function toDeploymentType(
  s: string | null | undefined,
): DeploymentType | null {
  if (s && isDeploymentType(s)) {
    return s;
  }
  return null;
}

export type ApplicationEnvironment =
  | 'production'
  | 'staging'
  | 'sample' // console self-serve test (not paying) app
  | 'sampletoken' // sample token apps created for docs integration guide and demo apps opensource repos (wiped periodically)
  | 'demo'; // temporary token apps created for docs and cord.com demo apps (wiped periodically)

// NB you there are some classes of token you might expect are environments,
// but actually all belong to one appID:
// The docs live components are all in the CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID app
// The e2e tests are all in the CORD_AUTOMATED_TESTS_APPLICATION_ID app
// The CORD_PLAYGROUND_APPLICATION_ID has been retired from service

export type EmptyJsonObject = Record<string, never>;

export type CustomerType = 'verified' | 'sample';

export type CustomerImplementationStage =
  | 'launched'
  | 'implementing'
  | 'proof_of_concept'
  | 'inactive';

export type AdminCRTComingFrom = 'them' | 'us';

export type AdminCRTDecision = 'done' | 'accepted' | 'rejected' | 'pending';

export type AdminCRTCommunicationStatus =
  | 'none'
  | 'request_acked'
  | 'decision_sent'
  | 'decision_acked';

export type AdminCRTIssueType = 'request' | 'bug' | 'onboarding_step';

export type AdminCRTPriority = 'blocker' | 'high' | 'low';

export type AdminCRTCustomerIssue = {
  customerID: UUID;
  title: string;
  body: string;
  comingFrom: AdminCRTComingFrom;
  decision: AdminCRTDecision;
  communicationStatus: AdminCRTCommunicationStatus;
  lastTouch?: string;
  type: AdminCRTIssueType;
  priority: AdminCRTPriority;
  externallyVisible: boolean;
  assignee?: UUID;
};

export type DocsCachedEmbedding = {
  url: string;
  plaintext: string;
  embedding?: OpenAI.CreateEmbeddingResponse | undefined;
};

export type CordDotComCachedEmbedding = DocsCachedEmbedding & {
  title: string;
};

// This is for the mouse move events within iframes
export type IframeMouseMoveData = { x: number; y: number; frame_id: string };

export type Maybe<T> = T | null | undefined;
export type Nullable<T> = T | null;
