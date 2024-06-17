import type { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize';

import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type {
  UUID,
  ImportedSlackMessageType,
  MessageType,
  ThreadMirrorType,
  EntityMetadata,
} from 'common/types/index.ts';
import { MessageNodeType } from '@cord-sdk/types';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasOrg,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { Counter, incCounterWithAppID } from 'server/src/logging/prometheus.ts';
import {
  isMessageNodeType,
  getMessageNodeChildren,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import type { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';
import type { MessageTextNode, MessageContent } from '@cord-sdk/types';
import type { RequestContext } from 'server/src/RequestContext.ts';
import {
  contextWithSession,
  getRelevantContext,
} from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { SlackBotCredentials } from 'server/src/slack/util.ts';
import {
  addMessageToSelectedSlackChannel,
  findSlackBotCredentials,
} from 'server/src/slack/util.ts';
import { withSlackMirroredThreadLock } from 'server/src/util/locks.ts';
import { SlackMessageEntity } from 'server/src/entity/slack_message/SlackMessageEntity.ts';
import type { SlackMirroredThreadEntity } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadEntity.ts';
import { SlackMirroredSupportThreadEntity } from 'server/src/entity/slack_mirrored_support_thread/SlackMirroredSupportThreadEntity.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import type {
  RequestContextLoaders,
  RequestContextLoadersInternal,
} from 'server/src/RequestContextLoaders.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';

const counter = Counter({
  name: 'MessageCreated',
  help: 'Count of created messages',
  labelNames: ['appID'],
});

interface CreateMessageArgs {
  id: UUID;
  externalID?: string;
  thread: ThreadEntity;
  content: MessageContent;
  url: string | null | undefined;
  timestamp?: Date;
  importedSlackChannelID?: string | null;
  importedSlackMessageTS?: string | null;
  importedSlackMessageType?: ImportedSlackMessageType | null;
  importedSlackMessageThreadTS?: string | null;
  replyToEmailNotificationID?: UUID | null;
  type?: MessageType | null;
  iconURL?: string;
  translationKey?: string | null;
  metadata?: EntityMetadata;
  extraClassnames?: string;
  skipLinkPreviews?: boolean;
}

interface CreateMessageArgsUnsafe extends CreateMessageArgs {
  sourceID: UUID;
  deletedTimestamp?: Date;
  lastUpdatedTimestamp?: Date;
}

function undefinedNull<T>(x: T | undefined): T | null {
  return x === undefined ? null : x;
}

export class MessageMutator {
  logger: Logger;
  loaders: RequestContextLoadersInternal;

  constructor(
    private viewer: Viewer,
    loaders: RequestContextLoaders,
  ) {
    this.logger = new Logger(viewer);
    this.loaders = loaders as RequestContextLoadersInternal;
  }

  async mirrorMessageToSlack(
    args: CreateMessageArgsUnsafe,
    message: MessageEntity,
  ): Promise<void> {
    incCounterWithAppID(this.viewer, counter);

    const { threadID } = message;
    const context = await contextWithSession(
      { viewer: this.viewer },
      getSequelize(),
      null,
      null,
    );

    const promises = await Promise.allSettled([
      context.loaders.slackMirroredThreadLoader.loadFromThreadID(threadID),
      SlackMirroredSupportThreadEntity.findByPk(threadID),
    ]);

    const [slackMirroredThread, slackMirroredSupportThread] = promises.map(
      (promise) => {
        if (promise.status === 'fulfilled') {
          return promise.value;
        }
        return null;
      },
    );

    if (
      slackMirroredThread &&
      (args.importedSlackChannelID !== slackMirroredThread.slackChannelID ||
        args.importedSlackMessageThreadTS !==
          slackMirroredThread.slackMessageTimestamp)
    ) {
      addMessageToMirroredSlackThread(
        message,
        this.viewer,
        context,
        threadID,
        slackMirroredThread,
        'internal',
      ).catch(
        this.logger.exceptionLogger(
          'Importing Slack reply from mirrored support thread or reply from Cord thread to mirrored internal thread failed.',
        ),
      );
    }

    if (
      slackMirroredSupportThread &&
      (args.importedSlackChannelID !==
        slackMirroredSupportThread.slackChannelID ||
        args.importedSlackMessageThreadTS !==
          slackMirroredSupportThread.slackMessageTimestamp)
    ) {
      addMessageToMirroredSlackThread(
        message,
        this.viewer,
        context,
        threadID,
        slackMirroredSupportThread,
        'support',
      ).catch(
        this.logger.exceptionLogger(
          'Importing Slack reply from mirrored internal thread or reply from Cord thread to mirrored support thread failed.',
        ),
      );
    }
  }

  async createMessage(
    args: CreateMessageArgs,
    transaction?: Transaction,
  ): Promise<MessageEntity> {
    return await this.createMessageImpl(
      {
        ...args,
        sourceID: assertViewerHasUser(this.viewer),
      },
      transaction,
    );
  }

  async createMessageExternal(
    args: CreateMessageArgsUnsafe,
    transaction?: Transaction,
  ): Promise<MessageEntity> {
    return await this.createMessageImpl(args, transaction);
  }

  private async createMessageImpl(
    args: CreateMessageArgsUnsafe,
    transaction?: Transaction,
  ): Promise<MessageEntity> {
    const canSend =
      await this.loaders.privacyLoader.viewerCanSendMessageToThread(
        args.thread,
        transaction,
      );
    if (!canSend) {
      throw new Error(
        `User ${this.viewer.userID} is not allowed to send message to thread ${args.thread.id}`,
      );
    }

    const message = await MessageEntity.create(
      {
        id: args.id,
        externalID: args.externalID,
        sourceID: args.sourceID,
        orgID: args.thread.orgID,
        threadID: args.thread.id,
        platformApplicationID: args.thread.platformApplicationID,
        content: args.content,
        url: args.url,
        ...(args.timestamp ? { timestamp: args.timestamp } : null),
        ...(args.lastUpdatedTimestamp
          ? { lastUpdatedTimestamp: args.lastUpdatedTimestamp }
          : null),
        ...(args.deletedTimestamp
          ? { deletedTimestamp: args.deletedTimestamp }
          : null),
        importedSlackChannelID: undefinedNull(args.importedSlackChannelID),
        importedSlackMessageTS: undefinedNull(args.importedSlackMessageTS),
        importedSlackMessageType: undefinedNull(args.importedSlackMessageType),
        importedSlackMessageThreadTS: undefinedNull(
          args.importedSlackMessageThreadTS,
        ),
        replyToEmailNotificationID: undefinedNull(
          args.replyToEmailNotificationID,
        ),
        type: args.type ?? undefined,
        iconURL: args.iconURL,
        translationKey: args.translationKey,
        metadata: args.metadata,
        extraClassnames: args.extraClassnames ?? '',
        skipLinkPreviews: args.skipLinkPreviews ?? false,
      },
      { transaction },
    );

    const mirror = () => this.mirrorMessageToSlack(args, message);
    if (transaction) {
      transaction.afterCommit(mirror);
    } else {
      await mirror();
    }

    return message;
  }

  async updateContent(
    logger: Logger,
    message: MessageEntity,
    content: MessageContent,
  ): Promise<boolean> {
    assertViewerIsMessageOwner(this.logger, this.viewer, message);
    return await this.updateContentWithoutCheckingOwnership(message, content);
  }

  private async updateContentWithoutCheckingOwnership(
    message: MessageEntity,
    content: MessageContent,
  ): Promise<boolean> {
    const userID = assertViewerHasUser(this.viewer);
    const id = message.id;

    const [updateCount] = await MessageEntity.update(
      {
        content,
        lastUpdatedTimestamp: Sequelize.fn('NOW'),
      },
      { where: { id, sourceID: userID, orgID: message.orgID } },
    );

    return updateCount === 1;
  }

  async setDeleted(message: MessageEntity, deleted: boolean) {
    const userID = assertViewerHasUser(this.viewer);
    assertViewerIsMessageOwner(this.logger, this.viewer, message);

    const [updateCount] = await MessageEntity.update(
      {
        deletedTimestamp: deleted ? Sequelize.fn('NOW') : null,
      },
      { where: { id: message.id, sourceID: userID, orgID: message.orgID } },
    );
    return updateCount === 1;
  }

  async deleteMessage(message: MessageEntity): Promise<boolean> {
    const { orgID } = assertViewerHasIdentity(this.viewer);

    assertViewerIsMessageOwner(this.logger, this.viewer, message);

    const { id } = message;

    const messageDeleted = await MessageEntity.destroy({
      where: {
        id,
        orgID,
      },
    });

    return messageDeleted === 1;
  }

  async removeAssignees(
    messageID: string,
    removedAssignees: TaskAssigneeEntity[],
  ) {
    const message = await this.loaders.messageLoader.loadMessage(messageID);
    const content = message?.content ?? [];
    const newContent = convertAssignees(content, removedAssignees);
    const [updateCount] = await MessageEntity.update(
      {
        content: newContent,
        lastUpdatedTimestamp: Sequelize.fn('NOW'),
      },
      { where: { id: messageID } },
    );

    return updateCount === 1;
  }

  async resetSlackImportForThread(threadID: UUID) {
    const orgID = assertViewerHasOrg(this.viewer);

    await MessageEntity.update(
      {
        importedSlackChannelID: null,
        importedSlackMessageTS: null,
        importedSlackMessageType: null,
        importedSlackMessageThreadTS: null,
      },
      {
        where: { threadID, orgID },
      },
    );
  }
}

function convertAssignees(
  content: MessageContent,
  removedAssignees: TaskAssigneeEntity[],
): MessageContent {
  return content.map((node) => {
    if (isMessageNodeType(node, MessageNodeType.ASSIGNEE)) {
      const removed = removedAssignees.find(
        (assignee) => assignee.userID === node.user.id,
      );
      if (removed !== undefined) {
        return {
          type: undefined,
          text: (node.children[0] as MessageTextNode).text,
        };
      } else {
        return node;
      }
    }
    let children = null;
    try {
      children = getMessageNodeChildren(node);
    } catch (_) {
      children = null;
    }
    if (children !== null && children !== undefined) {
      return {
        ...node,
        children: convertAssignees(children, removedAssignees),
      };
    }
    return node;
  });
}

export function assertViewerIsMessageOwner(
  logger: Logger,
  viewer: Viewer,
  message: MessageEntity,
) {
  if (viewer.userID !== message.sourceID) {
    logger.error('User does not have write permissions to message.', {
      actingUser: viewer.userID,
      messageOwner: message.sourceID,
    });
    throw new Error(
      'User does not have write permissions to message created by another user',
    );
  }
}

async function addMessageToMirroredSlackThread(
  message: MessageEntity,
  viewer: Viewer,
  originalContext: RequestContext,
  threadID: UUID,
  mirroredThread: SlackMirroredThreadEntity | SlackMirroredSupportThreadEntity,
  mirrorType: ThreadMirrorType,
) {
  return await withSlackMirroredThreadLock(
    threadID,
    mirrorType,
  )(async () => {
    // While we were waiting to acquire the lock, the Cord thread might have get
    // shared to Slack, in which case this message was already imported to
    // Slack. Let's quickly check whether that is the case, and if so, stop
    // here.
    if (
      (await SlackMessageEntity.count({
        where: {
          slackOrgID: mirroredThread.slackOrgID,
          slackChannelID: mirroredThread.slackChannelID,
          messageID: message.id,
        },
      })) > 0
    ) {
      return;
    }

    let slackBotCredentials: SlackBotCredentials | null = null;

    const context = await getRelevantContext(originalContext, message.orgID);
    if (mirrorType === 'internal') {
      slackBotCredentials = await findSlackBotCredentials(context);
      if (!slackBotCredentials) {
        context.logger.warn(
          'addMessageToMirroredSlackThread: no Slack bot credentials available for viewer',
          { viewerOrgID: viewer.orgID, viewerUserID: viewer.userID },
        );
        return;
      }

      if (slackBotCredentials.org.id !== mirroredThread.slackOrgID) {
        context.logger.warn(
          'addMessageToMirroredSlackThread: Slack workspace mismatch',
          {
            viewerOrgID: viewer.orgID,
            linkedSlackOrgID: slackBotCredentials.org.id,
            mirroredTheadSlackOrgID: mirroredThread.slackOrgID,
          },
        );
        return;
      }
    } else if (mirrorType === 'support') {
      const supportOrg = await context.loaders.orgLoader.loadOrg(
        mirroredThread.slackOrgID,
      );
      if (!supportOrg) {
        throw new Error(
          'Could not find org with ID ' + mirroredThread.slackOrgID,
        );
      }

      slackBotCredentials = await supportOrg.getSlackBotCredentials();
    }

    if (!slackBotCredentials) {
      throw new Error('No valid slackBotCredentials found.');
    }

    const thread = await context.loaders.threadLoader.loadThread(threadID);
    if (!thread) {
      throw new Error('Thread does not exist');
    }

    const user = await context.loaders.userLoader.loadUserInAnyViewerOrg(
      message.sourceID,
    );
    if (!user) {
      throw new Error('User does not exist');
    }

    await addMessageToSelectedSlackChannel(
      context,
      slackBotCredentials,
      mirroredThread.slackChannelID,
      user,
      message,
      thread,
      mirrorType,
      mirroredThread.slackMessageTimestamp,
    );
  });
}
