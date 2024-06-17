import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { unique } from 'radash';

import type { Transaction } from 'sequelize';
import { Viewer } from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import type { MessageContent } from 'common/types/index.ts';
import { validateMessageContent } from 'server/src/message/util/validateMessageContent.ts';
import { executeNewMessageCreationTasks } from 'server/src/message/executeMessageTasks.ts';
import {
  getSequelize,
  serializableTransactionWithRetries,
} from 'server/src/entity/sequelize.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import {
  internalizeContent,
  getValidExternalToInternalReactionUsers,
} from 'server/src/public/routes/platform/messages/util.ts';
import type {
  CreateAttachment,
  ServerCreateMessage,
  UUID,
} from '@cord-sdk/types';
import { MessageReactionMutator } from 'server/src/entity/message_reaction/MessageReactionMutator.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';
import { addGroupIDIfNotExistCreateThreadMessageHandler } from 'server/src/public/routes/platform/addGroupIDWhereOrgIDExists.ts';
import { createThread as createThreadFunction } from 'server/src/public/routes/platform/threads/CreateThreadHandler.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { ScreenshotAttachmentInput } from 'common/graphql/types.ts';

async function createThreadMessageHandler(req: Request, res: Response) {
  // This is in place until we remove organizationID
  const reqBodyWithGroupID = addGroupIDIfNotExistCreateThreadMessageHandler(
    req.body,
    req.appID,
  );
  const vars = validate.CreateMessageVariables(reqBodyWithGroupID);

  const message = await createThreadMessage({
    ...vars,
    platformApplicationID: req.appID,
    threadID: req.params.threadID,
    internalMessageID: uuid(),
  });

  res.status(200).json({
    success: true,
    message: 'Message created.',
    messageID: message.externalID,
  });
}

export async function createThreadMessage({
  platformApplicationID,
  threadID: externalThreadID,
  id: externalMessageID,
  internalMessageID,
  authorID: externalSourceID,
  content: rawContent,
  url,
  createdTimestamp: timestamp,
  deletedTimestamp,
  updatedTimestamp: lastUpdatedTimestamp,
  iconURL,
  translationKey,
  type,
  createThread,
  metadata,
  extraClassnames,
  addReactions,
  addAttachments = [],
  skipLinkPreviews,
  subscribeToThread,
  screenshotAttachment,
  ...rest
}: ServerCreateMessage & {
  internalMessageID: UUID;
  threadID: string;
  platformApplicationID: string | undefined;
  screenshotAttachment?: ScreenshotAttachmentInput | null | undefined;
}) {
  // Check that all properties in ServerCreateMessage are destructured
  const _: Record<string, never> = rest;

  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const app = await ApplicationEntity.findByPk(platformApplicationID);
  if (!app) {
    throw new ApiCallerError('invalid_request');
  }

  if (externalMessageID) {
    validateExternalID(externalMessageID, 'id');
  }
  validateExternalID(externalSourceID, 'authorID');

  const existingThread = await ThreadEntity.findOne({
    where: {
      externalID: externalThreadID,
      platformApplicationID,
    },
  });

  if (!existingThread && !createThread) {
    throw new ApiCallerError('thread_not_found', {
      message: 'Could not find thread with ID ' + externalThreadID,
    });
  } else if (!existingThread) {
    validateExternalID(externalThreadID, 'threadID');
  }

  if (externalMessageID) {
    const messageExists = await MessageEntity.findOne({
      where: {
        externalID: externalMessageID,
        platformApplicationID,
      },
    });

    if (messageExists) {
      throw new ApiCallerError('message_already_exists', {
        message: `Message with id: ${externalMessageID} already exists. Please use a different ID or update the message via our update message endpoint https://docs.cord.com/rest-apis/messages#Update-a-message.`,
      });
    }
  }

  const [org, sender] = await Promise.all([
    existingThread
      ? OrgEntity.findOne({
          where: {
            id: existingThread.orgID,
            platformApplicationID,
          },
        })
      : OrgEntity.findOne({
          where: {
            externalID: createThread!.organizationID ?? createThread!.groupID,
            platformApplicationID,
          },
        }),
    UserEntity.findOne({
      where: {
        externalID: externalSourceID,
        platformApplicationID,
      },
    }),
  ]);

  if (!org) {
    throw new ApiCallerError('organization_not_found');
  }

  if (!sender) {
    throw new ApiCallerError('user_not_found', {
      message: `Invalid message sender user id: ${externalSourceID}.`,
    });
  }

  const orgMemberCount = await OrgMembersEntity.count({
    where: {
      userID: sender.id,
      orgID: org.id,
    },
  });

  if (orgMemberCount !== 1) {
    throw new ApiCallerError('invalid_request', {
      message:
        'message author is not a member of the organization ' +
        'the thread belongs to',
    });
  }

  let content: MessageContent;
  try {
    validateMessageContent(rawContent);
    content = await internalizeContent(
      rawContent,
      platformApplicationID,
      org.id,
    );
  } catch (e) {
    throw new ApiCallerError('invalid_field', {
      message: 'content field is invalid: ' + (e as Error).message,
    });
  }

  const pendingFileAttachments = await validateAddAttachments(
    addAttachments,
    sender,
  );

  const reactionsToAdd = addReactions ?? [];

  const externalReactionUserIDs = unique(
    reactionsToAdd.map((reaction) => reaction.userID),
  );

  const viewer = await Viewer.createLoggedInPlatformViewer({
    user: sender,
    org,
  });

  const context = await contextWithSession(
    { viewer },
    getSequelize(),
    null,
    null,
  );

  const externalToInternalReactionUsers =
    await getValidExternalToInternalReactionUsers(
      context,
      externalReactionUserIDs,
      org,
    );

  const viewerReactionMutator = new MessageReactionMutator(
    viewer,
    context.loaders,
  );

  const [message, thread, senderContext, isFirstMessage, fileAttachments] =
    // We use SERIALIZABLE here because it's needed to ensure the threads and
    // preallocated_thread_ids tables remain consistent, see thread_by_external_id.ts
    await serializableTransactionWithRetries(async (transaction) => {
      let existingOrCreatedThread: ThreadEntity;
      let threadWasCreated = false;
      if (existingThread) {
        existingOrCreatedThread = existingThread;
      } else {
        if (!createThread) {
          // NOTE(flooey): This is redundant with the same check up above, but
          // it's here to give the typechecker the knowledge that createThread
          // must be defined.
          throw new ApiCallerError('thread_not_found');
        }

        if (createThread.resolved !== undefined) {
          deprecated('createThreadMessageHandler:createThread:resolved');
        }

        const { thread: newThread } = await createThreadFunction({
          platformApplicationID,
          id: externalThreadID,
          transaction,
          viewer,
          ...createThread,
        });
        existingOrCreatedThread = newThread;
        threadWasCreated = true;
      }

      const createdMessage = await new MessageMutator(
        viewer,
        context.loaders,
      ).createMessageExternal(
        {
          id: internalMessageID,
          thread: existingOrCreatedThread,
          sourceID: sender.id,
          externalID: externalMessageID,
          content,
          url,
          timestamp: timestamp || new Date(),
          deletedTimestamp: deletedTimestamp ?? undefined,
          lastUpdatedTimestamp: lastUpdatedTimestamp ?? undefined,
          type: type ?? 'user_message',
          iconURL: iconURL ?? undefined,
          translationKey: translationKey ?? undefined,
          metadata,
          extraClassnames: extraClassnames ?? undefined,
          skipLinkPreviews,
        },
        transaction,
      );

      await Promise.all(
        reactionsToAdd.map(async (reactionToAdd) => {
          const user = externalToInternalReactionUsers.get(
            reactionToAdd.userID,
          );

          if (!user) {
            return;
          }

          let mutator: MessageReactionMutator;
          if (user.id === viewer.userID) {
            mutator = viewerReactionMutator;
          } else {
            const reactionViewer = await Viewer.createLoggedInPlatformViewer({
              user,
              org,
            });
            mutator = new MessageReactionMutator(reactionViewer, null);
          }

          return await mutator.createOne(
            createdMessage.id,
            reactionToAdd.reaction,
            reactionToAdd.timestamp,
            transaction,
          );
        }),
      );

      return [
        createdMessage,
        existingOrCreatedThread,
        context,
        threadWasCreated,
        pendingFileAttachments,
      ];
    });

  const flagsUser: FlagsUser = {
    userID: message.sourceID,
    orgID: message.orgID,
    platformApplicationID: app.id,
    version: null,
    customerID: app.customerID,
  };

  const page = await PageEntity.findOne({
    where: {
      contextHash: thread.pageContextHash,
      orgID: message.orgID,
    },
  });

  if (!page) {
    throw new Error(
      `Could not find page for message ${message.id} and thread ${thread.id}`,
    );
  }

  await executeNewMessageCreationTasks({
    context: senderContext,
    flagsUser,
    application: app,
    page,
    thread,
    message,
    fileAttachments: fileAttachments.map((a) => ({
      id: uuid(),
      fileID: a.id,
    })),
    annotationAttachments: [],
    isFirstMessage,
    task: null,
    screenshotAttachment,
    subscribeToThread: subscribeToThread ?? true,
  });

  return message;
}

export async function validateAddAttachments(
  addAttachments: CreateAttachment[],
  sender: UserEntity,
  transaction?: Transaction,
) {
  const pendingFileAttachments = addAttachments.filter(
    (a) => a.type === 'file',
  );

  const idsToAttach = new Set(pendingFileAttachments.map((f) => f.id));
  if (idsToAttach.size !== pendingFileAttachments.length) {
    throw new ApiCallerError('invalid_field', {
      message: 'Cannot attach the same file multiple times',
    });
  }

  const filesToAttach = await FileEntity.findAll({
    where: {
      id: pendingFileAttachments.map((a) => a.id),
    },
    transaction,
  });

  if (filesToAttach.length !== pendingFileAttachments.length) {
    throw new ApiCallerError('file_not_found');
  }

  if (filesToAttach.some((f) => f.userID !== sender.id)) {
    throw new ApiCallerError('file_belongs_to_different_user');
  }

  return pendingFileAttachments;
}

export default forwardHandlerExceptionsToNext(createThreadMessageHandler);
