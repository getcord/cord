import type { Viewer } from 'server/src/auth/index.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import { MessageLoader } from 'server/src/entity/message/MessageLoader.ts';
import { MessageAttachmentLoader } from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import { FileLoader } from 'server/src/entity/file/FileLoader.ts';
import { MessageReactionLoader } from 'server/src/entity/message_reaction/MessageReactionLoader.ts';
import { SlackChannelLoader } from 'server/src/entity/slack_channel/SlackChannelLoader.ts';
import { UserPreferenceLoader } from 'server/src/entity/user_preference/UserPreferenceLoader.ts';
import { TaskLoader } from 'server/src/entity/task/TaskLoader.ts';
import { TaskAssigneeLoader } from 'server/src/entity/task_assignee/TaskAssigneeLoader.ts';
import { TaskTodoLoader } from 'server/src/entity/task_todo/TaskTodoLoader.ts';
import { ProviderLoader } from 'server/src/entity/provider/ProviderLoader.ts';
import { ProviderRuleLoader } from 'server/src/entity/provider_rule/ProviderRuleLoader.ts';
import { ProviderDocumentMutatorLoader } from 'server/src/entity/provider_document_mutator/ProviderDocumentMutatorLoader.ts';
import { ProviderRuleTestLoader } from 'server/src/entity/provider_rule_test/ProviderRuleTestLoader.ts';
import { PublishedProviderLoader } from 'server/src/entity/published_provider/PublishedProviderLoader.ts';
import { PageLoader } from 'server/src/entity/page/PageLoader.ts';
import { ThreadLoader } from 'server/src/entity/thread/ThreadLoader.ts';
import { PageVisitorLoader } from 'server/src/entity/page_visitor/PageVisitorLoader.ts';
import { ThreadParticipantLoader } from 'server/src/entity/thread_participant/ThreadParticipantLoader.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';
import { ApplicationLoader } from 'server/src/entity/application/ApplicationLoader.ts';
import { HeimdallLoader } from 'server/src/entity/heimdall/HeimdallLoader.ts';
import { EmailSubscriptionLoader } from 'server/src/entity/email_subscription/EmailSubscriptionLoader.ts';
import { LinkedOrgsLoader } from 'server/src/entity/linked_orgs/LinkedOrgsLoader.ts';
import { LinkedUsersLoader } from 'server/src/entity/linked_users/LinkedUsersLoader.ts';
import { SlackMirroredThreadLoader } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadLoader.ts';
import { ConsoleUserLoader } from 'server/src/entity/user/ConsoleUserLoader.ts';
import { DeploysLoader } from 'server/src/entity/deploys/DeploysLoader.ts';
import { CustomerLoader } from 'server/src/entity/customer/CustomerLoader.ts';
import { ApplicationUsageMetricLoader } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricLoader.ts';
import { NotificationLoader } from 'server/src/entity/notification/NotificationLoader.ts';
import { MessageLinkPreviewLoader } from 'server/src/entity/message_link_preview/MessageLinkPreviewLoader.ts';
import {
  FeatureFlags,
  flagsUserFromViewer,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { PrivacyLoader } from 'server/src/entity/privacy/PrivacyLoader.ts';
import { MessageMentionLoader } from 'server/src/entity/message_mention/MessageMentionLoader.ts';

export type RequestContextLoaders = {
  userLoader: UserLoader;
  orgLoader: OrgLoader;
  messageLoader: MessageLoader;
  messageAttachmentLoader: MessageAttachmentLoader;
  messageReactionLoader: MessageReactionLoader;
  messageMentionLoader: MessageMentionLoader;
  fileLoader: FileLoader;
  pageLoader: PageLoader;
  threadLoader: ThreadLoader;
  pageVisitorLoader: PageVisitorLoader;
  threadParticipantLoader: ThreadParticipantLoader;
  slackChannelLoader: SlackChannelLoader;
  userPreferenceLoader: UserPreferenceLoader;
  taskLoader: TaskLoader;
  deploysLoader: DeploysLoader;
  taskAssigneeLoader: TaskAssigneeLoader;
  taskTodoLoader: TaskTodoLoader;
  providerLoader: ProviderLoader;
  providerRuleLoader: ProviderRuleLoader;
  providerDocumentMutatorLoader: ProviderDocumentMutatorLoader;
  providerRuleTestLoader: ProviderRuleTestLoader;
  publishedProviderLoader: PublishedProviderLoader;
  orgMembersLoader: OrgMembersLoader;
  s3BucketLoader: S3BucketLoader;
  applicationLoader: ApplicationLoader;
  customerLoader: CustomerLoader;
  heimdallLoader: HeimdallLoader;
  emailSubscriptionLoader: EmailSubscriptionLoader;
  linkedOrgsLoader: LinkedOrgsLoader;
  linkedUsersLoader: LinkedUsersLoader;
  slackMirroredThreadLoader: SlackMirroredThreadLoader;
  consoleUserLoader: ConsoleUserLoader;
  applicationUsageMetricLoader: ApplicationUsageMetricLoader;
  notificationLoader: NotificationLoader;
  messageLinkPreviewLoader: MessageLinkPreviewLoader;
};

export type RequestContextLoadersInternal = RequestContextLoaders & {
  privacyLoader: PrivacyLoader;
};

export async function getNewLoaders(
  viewer: Viewer,
): Promise<RequestContextLoaders> {
  const flagsUser = flagsUserFromViewer(viewer);
  const cache = await getTypedFeatureFlagValue(
    FeatureFlags.LOADER_CACHES,
    flagsUser,
  );

  // Because some loaders themselves need a reference to the loaders object,
  // they take that as an anonymous function which returns the loaders instead,
  // to avoid a circular definition dependency.
  const loaders: RequestContextLoadersInternal = {
    fileLoader: new FileLoader(viewer),
    messageAttachmentLoader: new MessageAttachmentLoader(viewer),
    messageLoader: new MessageLoader(viewer, () => loaders),
    messageMentionLoader: new MessageMentionLoader(viewer),
    orgLoader: new OrgLoader(viewer, cache),
    userLoader: new UserLoader(viewer, () => loaders, cache),
    pageLoader: new PageLoader(viewer),
    threadLoader: new ThreadLoader(viewer, () => loaders),
    pageVisitorLoader: new PageVisitorLoader(viewer),
    threadParticipantLoader: new ThreadParticipantLoader(viewer, () => loaders),
    messageReactionLoader: new MessageReactionLoader(viewer, cache),
    slackChannelLoader: new SlackChannelLoader(viewer),
    userPreferenceLoader: new UserPreferenceLoader(viewer),
    deploysLoader: new DeploysLoader(viewer),
    taskLoader: new TaskLoader(viewer),
    taskAssigneeLoader: new TaskAssigneeLoader(viewer),
    taskTodoLoader: new TaskTodoLoader(viewer),
    providerLoader: new ProviderLoader(viewer),
    providerRuleLoader: new ProviderRuleLoader(viewer),
    providerDocumentMutatorLoader: new ProviderDocumentMutatorLoader(viewer),
    providerRuleTestLoader: new ProviderRuleTestLoader(viewer),
    publishedProviderLoader: new PublishedProviderLoader(viewer),
    orgMembersLoader: new OrgMembersLoader(viewer),
    s3BucketLoader: new S3BucketLoader(viewer),
    applicationLoader: new ApplicationLoader(viewer),
    customerLoader: new CustomerLoader(viewer),
    heimdallLoader: new HeimdallLoader(viewer),
    emailSubscriptionLoader: new EmailSubscriptionLoader(viewer),
    linkedOrgsLoader: new LinkedOrgsLoader(viewer, cache),
    linkedUsersLoader: new LinkedUsersLoader(viewer),
    slackMirroredThreadLoader: new SlackMirroredThreadLoader(viewer),
    consoleUserLoader: new ConsoleUserLoader(viewer),
    applicationUsageMetricLoader: new ApplicationUsageMetricLoader(viewer),
    notificationLoader: new NotificationLoader(viewer),
    messageLinkPreviewLoader: new MessageLinkPreviewLoader(viewer),
    privacyLoader: new PrivacyLoader(viewer, () => loaders),
  };

  return loaders;
}
