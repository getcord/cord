import type { Request, Response } from 'express';
import { unique } from 'radash';
import { v4 as uuid } from 'uuid';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type {
  FileAttachmentInput,
  MessageContent,
} from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import {
  Viewer,
  assertViewerHasPlatformApplicationID,
} from 'server/src/auth/index.ts';

import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import {
  internalizeContent,
  getValidExternalToInternalReactionUsers,
  loadThreadMessage,
} from 'server/src/public/routes/platform/messages/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { isValidExternalID } from 'common/util/externalIDs.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { validateMessageContent } from 'server/src/message/util/validateMessageContent.ts';
import { executeUpdateMessageTasks } from 'server/src/message/executeMessageTasks.ts';
import type { ServerUpdateMessage } from '@cord-sdk/types';
import { MessageReactionEntity } from 'server/src/entity/message_reaction/MessageReactionEntity.ts';
import { getFileAttachmentEntities } from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import type {
  MessageAnnotationAttachmentData,
  MessageFileAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { AnnotationAttachmentInput } from 'server/src/schema/resolverTypes.ts';
import { validateAddAttachments } from 'server/src/public/routes/platform/messages/CreateThreadMessageHandler.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageReactionMutator } from 'server/src/entity/message_reaction/MessageReactionMutator.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';

async function UpdateThreadMessageHandler(req: Request, res: Response) {
  const vars = validate.UpdateMessageVariables(req.body);

  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const [thread, message] = await Promise.all([
    ThreadEntity.findOne({
      where: {
        externalID: req.params.threadID,
        platformApplicationID,
      },
    }),
    MessageEntity.findOne({
      where: {
        externalID: req.params.messageID,
        platformApplicationID,
      },
    }),
  ]);

  if (!thread) {
    throw new ApiCallerError('thread_not_found');
  }

  if (!message || message.threadID !== thread.id) {
    throw new ApiCallerError('message_not_found');
  }

  const [sender, org] = await Promise.all([
    UserEntity.findByPk(message.sourceID),
    OrgEntity.findByPk(message.orgID),
  ]);

  if (!org) {
    throw new ApiCallerError('organization_not_found');
  }

  if (!sender) {
    throw new ApiCallerError('user_not_found', {
      message: `Message author not found`,
    });
  }

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

  await updateThreadMessage({
    ...vars,
    context,
    thread,
    message,
  });

  return res.status(200).json({
    success: true,
    message: `✅ You successfully updated message ${req.params.messageID}`,
  });
}

// TODO: Do we need to handle MessageAttachmentType.SCREENSHOT?
export async function updateThreadMessage({
  context,
  thread,
  message,
  id: externalID,
  content: rawContent,
  createdTimestamp,
  authorID: newExternalSourceID,
  url,
  deleted,
  iconURL,
  translationKey,
  type,
  metadata,
  extraClassnames,
  deletedTimestamp: deletedTimestampInput,
  updatedTimestamp: updatedTimestampInput,
  addReactions,
  removeReactions,
  addAttachments = [],
  removeAttachments = [],
  skipLinkPreviews: skipLinkPreviewsRaw,
  ...rest
}: ServerUpdateMessage & {
  context: RequestContext;
  thread: ThreadEntity;
  message: MessageEntity;
}) {
  // Check that all properties in ServerUpdateMessage are destructured
  const _: Record<string, never> = rest;
  const platformApplicationID = assertViewerHasPlatformApplicationID(
    context.session.viewer,
  );

  if (externalID) {
    if (!isValidExternalID(externalID)) {
      throw new ApiCallerError('invalid_field', {
        message: `${externalID} is not a valid identifier: https://docs.cord.com/reference/identifiers`,
      });
    }
    // NOT using context.loaders here so that we still error even if there's a
    // message the viewer can't see that has the specified externalID.
    const dupeMessage = await loadThreadMessage(
      platformApplicationID,
      externalID,
    );
    if (dupeMessage) {
      throw new ApiCallerError('message_already_exists', {
        message: `Cannot change ID to ${externalID} since a message with that ID already exists`,
      });
    }
  }

  const [org, sender] = await Promise.all([
    context.loaders.orgLoader.loadOrg(thread.orgID),
    context.loaders.userLoader.loadUser(message.sourceID),
  ]);

  if (!org) {
    throw new ApiCallerError('organization_not_found');
  }

  if (!sender) {
    throw new ApiCallerError('user_not_found', {
      message: `Message author not found`,
    });
  }

  let newAuthor: UserEntity | null = null;
  if (newExternalSourceID && sender.externalID !== newExternalSourceID) {
    newAuthor = await UserEntity.findOne({
      where: {
        externalID: newExternalSourceID,
        platformApplicationID,
      },
    });
    if (!newAuthor) {
      throw new ApiCallerError('user_not_found', {
        message: `Invalid message author id: ${newExternalSourceID}.`,
      });
    }
  }

  let updatedTimestamp: Date | null | undefined = undefined;
  if (updatedTimestampInput !== undefined) {
    updatedTimestamp = updatedTimestampInput;
  }

  let content: MessageContent | undefined = undefined;
  if (rawContent && !isEqual(rawContent, message.content)) {
    try {
      validateMessageContent(rawContent);
      content = await internalizeContent(
        rawContent,
        platformApplicationID,
        message.orgID,
      );

      if (updatedTimestampInput === undefined) {
        updatedTimestamp = new Date();
      }
    } catch (e) {
      throw new ApiCallerError('invalid_field', {
        message: 'content field is invalid: ' + (e as Error).message,
      });
    }
  }

  const skipLinkPreviews: boolean =
    skipLinkPreviewsRaw ?? message.skipLinkPreviews;

  let deletedTimestamp: Date | null | undefined = undefined;
  if (deletedTimestampInput !== undefined) {
    deletedTimestamp = deletedTimestampInput;
  } else if (deleted !== undefined) {
    deletedTimestamp = deleted ? new Date() : null;
  }

  const reactionsToAdd = addReactions ?? [];
  const reactionsToRemove = removeReactions ?? [];

  for (const reactionToAdd of reactionsToAdd) {
    for (const reactionToDelete of reactionsToRemove) {
      if (
        reactionToAdd.userID === reactionToDelete.userID &&
        reactionToAdd.reaction === reactionToDelete.reaction
      ) {
        throw new ApiCallerError('invalid_field', {
          message: 'Adding and removing the same reaction is invalid.',
        });
      }
    }
  }

  const externalReactionUserIDs = unique([
    ...reactionsToAdd.map((reaction) => reaction.userID),
    ...reactionsToRemove.map((reaction) => reaction.userID),
  ]);

  const externalToInternalReactionUsers =
    await getValidExternalToInternalReactionUsers(
      context,
      externalReactionUserIDs,
      org,
    );

  let fileAttachmentInputs: FileAttachmentInput[] | null = null;
  let annotationAttachmentInputs: AnnotationAttachmentInput[] | null = null;
  if (addAttachments.length > 0 || removeAttachments.length > 0) {
    for (const addAttachment of addAttachments) {
      for (const removeAttachment of removeAttachments) {
        if (
          addAttachment.type === removeAttachment.type &&
          addAttachment.id === removeAttachment.id
        ) {
          throw new ApiCallerError('invalid_field', {
            message: 'Adding and removing the same attachment is invalid.',
          });
        }
      }
    }

    const fileIDsToRemove = new Set<string>(
      removeAttachments
        .filter((remove) => remove.type === 'file')
        .map((remove) => remove.id),
    );

    const existingAttachments = getFileAttachmentEntities(
      await context.loaders.messageAttachmentLoader.loadAttachmentsForMessage(
        message.id,
      ),
    );

    annotationAttachmentInputs = existingAttachments
      .filter((a) => a.type === MessageAttachmentType.ANNOTATION)
      .map((a) => {
        const data = a.data as MessageAnnotationAttachmentData;
        return {
          id: a.id,
          screenshotFileID: data.screenshotFileID,
          blurredScreenshotFileID: data.blurredScreenshotFileID,
          location: data.location,
          customLocation: data.customLocation,
          customHighlightedTextConfig: data.customHighlightedTextConfig,
          customLabel: data.customLabel,
          coordsRelativeToTarget: data.coordsRelativeToTarget,
        };
      });

    fileAttachmentInputs = existingAttachments
      .filter((a) => a.type === MessageAttachmentType.FILE)
      .filter(
        (a) =>
          !fileIDsToRemove.has((a.data as MessageFileAttachmentData).fileID),
      )
      .map((a) => {
        const data = a.data as MessageFileAttachmentData;
        return {
          id: a.id,
          fileID: data.fileID,
        };
      });

    const newFileAttachments = await validateAddAttachments(
      addAttachments,
      sender,
    );

    fileAttachmentInputs.push(
      ...newFileAttachments.map((a) => ({ id: uuid(), fileID: a.id })),
    );

    const newlyAttachedInputs = new Set(
      fileAttachmentInputs.map((a) => a.fileID),
    );
    if (newlyAttachedInputs.size !== fileAttachmentInputs.length) {
      throw new ApiCallerError('invalid_field', {
        message: 'Cannot attach an already-attached file',
      });
    }
  }

  const originalSubscribers = new Set(
    await context.loaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
      thread.id,
    ),
  );

  await getSequelize().transaction(async (transaction) => {
    const viewerReactionMutator = new MessageReactionMutator(
      context.session.viewer,
      context.loaders,
    );
    const viewerNotificationMutator = new NotificationMutator(
      context.session.viewer,
    );
    const viewerThreadParticipantMutator = new ThreadParticipantMutator(
      context.session.viewer,
      context.loaders,
    );
    await Promise.all([
      ...reactionsToAdd.map(async (reactionToAdd) => {
        const user = externalToInternalReactionUsers.get(reactionToAdd.userID);
        if (!user) {
          context.logger.logException(
            'Reaction author to add a reaction not found',
            undefined,
            {
              externalID: reactionToAdd.userID,
            },
          );

          return;
        }

        const reactionExists = await MessageReactionEntity.findOne({
          where: {
            userID: user.id,
            messageID: message.id,
            unicodeReaction: reactionToAdd.reaction,
          },
          transaction,
        });

        if (reactionExists) {
          // If the reaction already exists, the only thing we might have to do
          // is reset the timestamp. Don't do any of the other stuff like
          // sending notifications since the reaction already exists.
          if (reactionToAdd.timestamp !== undefined) {
            reactionExists.timestamp = reactionToAdd.timestamp;
            await reactionExists.save({ transaction });
          }
          return;
        }

        let reactionMutator: MessageReactionMutator;
        let notificationMutator: NotificationMutator;
        let threadParticipantMutator: ThreadParticipantMutator;

        if (user.id === context.session.viewer.userID) {
          reactionMutator = viewerReactionMutator;
          notificationMutator = viewerNotificationMutator;
          threadParticipantMutator = viewerThreadParticipantMutator;
        } else {
          const reactionViewer = await Viewer.createLoggedInPlatformViewer({
            user,
            org,
          });
          reactionMutator = new MessageReactionMutator(reactionViewer, null);
          notificationMutator = new NotificationMutator(reactionViewer);
          threadParticipantMutator = new ThreadParticipantMutator(
            reactionViewer,
            null,
          );
        }

        const newReaction = await reactionMutator.createOne(
          message.id,
          reactionToAdd.reaction,
          reactionToAdd.timestamp,
          transaction,
        );

        await Promise.all([
          message.sourceID !== user.id &&
            notificationMutator.create(
              {
                recipientID: message.sourceID,
                type: 'reaction',
                reactionID: newReaction.id,
                aggregationKey: message.id,
                messageID: message.id,
                threadID: message.threadID,
              },
              transaction,
            ),
          threadParticipantMutator.markThreadNewlyActiveForUser(
            thread.id,
            newReaction.id,
            message.sourceID,
            transaction,
          ),
        ]);
      }),
      ...reactionsToRemove.map(async (reactionToRemove) => {
        const user = externalToInternalReactionUsers.get(
          reactionToRemove.userID,
        );
        if (!user) {
          context.logger.logException(
            'Reaction author to remove a reaction not found',
            undefined,
            {
              externalID: reactionToRemove.userID,
            },
          );
          return;
        }

        if (user.id === context.session.viewer.userID) {
          await viewerReactionMutator.deleteUnicodeReaction(
            message.id,
            reactionToRemove.reaction,
            transaction,
          );
        } else {
          await MessageReactionEntity.destroy({
            where: {
              userID: user.id,
              messageID: message.id,
              unicodeReaction: reactionToRemove.reaction,
            },
            transaction,
          });
        }
      }),
    ]);

    const updatedMessage = await message.update(
      {
        externalID,
        content,
        url,
        sourceID: newAuthor?.id,
        timestamp: createdTimestamp ?? undefined,
        deletedTimestamp,
        lastUpdatedTimestamp: updatedTimestamp,
        type,
        iconURL,
        translationKey,
        extraClassnames: extraClassnames ?? undefined,
        metadata,
        skipLinkPreviews,
      },
      { transaction },
    );

    const wasDeletedOrUndeleted = !isEqual(
      message.deletedTimestamp,
      updatedMessage.deletedTimestamp,
    );

    let contextForUpdateMessageTasks = context;
    if (newAuthor && context.session.viewer.userID !== newAuthor.id) {
      const newViewer = await Viewer.createLoggedInPlatformViewer({
        user: newAuthor,
        org,
      });
      contextForUpdateMessageTasks = await contextWithSession(
        { viewer: newViewer },
        context.sequelize,
        null,
        null,
      );
    }

    const hidePreviewLinksIDs = removeAttachments
      .filter((remove) => remove.type === 'link_preview')
      .map((remove) => remove.id);

    if (hidePreviewLinksIDs.length > 0) {
      const linkPreviews = await MessageLinkPreviewEntity.findAll({
        where: { id: hidePreviewLinksIDs, messageID: message.id },
        transaction,
      });

      if (linkPreviews.length !== hidePreviewLinksIDs.length) {
        throw new Error('Link previews were not loaded');
      }

      if (
        message.sourceID !== contextForUpdateMessageTasks.session.viewer.userID
      ) {
        throw new Error('Only the message author can edit the link previews');
      }

      await MessageLinkPreviewEntity.update(
        {
          hidden: true,
        },
        {
          where: {
            id: hidePreviewLinksIDs,
          },
          transaction,
        },
      );
    }

    transaction.afterCommit(() =>
      executeUpdateMessageTasks({
        context: contextForUpdateMessageTasks,
        message: updatedMessage,
        thread,
        wasDeletedOrUndeleted,
        content,
        authorUpdated: !!newAuthor,
        annotationAttachments: annotationAttachmentInputs,
        fileAttachments: fileAttachmentInputs,
        originalSubscribers,
      }),
    );
  });
}

export default forwardHandlerExceptionsToNext(UpdateThreadMessageHandler);
