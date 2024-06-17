import type { UUID } from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type {
  MessageAttachmentData,
  MessageFileAttachmentData,
  MessageAnnotationAttachmentData,
  MessageScreenshotAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import { addJiraTaskAttachments } from 'server/src/third_party_tasks/jira/actions.ts';
import { addAsanaTaskAttachments } from 'server/src/third_party_tasks/asana/actions.ts';
import type { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { addLinearTaskAttachments } from 'server/src/third_party_tasks/linear/actions.ts';
import { FileMutator } from 'server/src/entity/file/FileMutator.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { isDefined } from 'common/util/index.ts';
import { addMondayTaskAttachments } from 'server/src/third_party_tasks/monday/actions.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { CordError } from 'server/src/util/CordError.ts';

export class MessageAttachmentMutator {
  logger: Logger;

  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders,
  ) {
    this.logger = new Logger(viewer);
  }

  async setMessageAttachments(
    message: MessageEntity,
    attachments: Array<{
      id: UUID;
      type: MessageAttachmentType;
      data: MessageAttachmentData;
    }>,
  ) {
    const userID = assertViewerHasUser(this.viewer);

    if (message.sourceID !== userID) {
      throw new Error('You can only attach files to your own message.');
    }

    const oldAttachments = await MessageAttachmentEntity.findAll({
      where: { messageID: message.id },
    });

    const oldAttachmentIDs = new Set(
      oldAttachments.map((attachment) => attachment.id),
    );

    const newAttachmentIDs = new Set(
      attachments.map((attachment) => attachment.id),
    );

    const attachmentsToCreate = attachments.filter(
      (attachment) => !oldAttachmentIDs.has(attachment.id),
    );

    const attachmentIDsToDelete = oldAttachments
      .filter((oldAttachment) => !newAttachmentIDs.has(oldAttachment.id))
      .map((attachment) => {
        return {
          attachmentID: attachment.id,
          // TODO(flooey): We used to delete files when their associated
          // attachments were deleted, but that makes our public APIs for
          // writing attachments annoying to use, because they look like you can
          // use the same file multiple times and it mostly works, but if you
          // delete an attachment the file isn't valid anymore and any other
          // uses of it break.  Instead, just leave the files there, and we can
          // garbage collect them later.
          fileIDs:
            attachment.type === MessageAttachmentType.FILE
              ? []
              : attachment.getFileIDs(),
        };
      });
    const deleted = await Promise.all(
      attachmentIDsToDelete.map((attachmentId) =>
        this.deleteAttachment(attachmentId, message),
      ),
    );
    const deletedAttachmentsCount = deleted.filter(
      (result) => result === true,
    ).length;

    const fileIDs = attachmentsToCreate
      .map((attachment) => {
        switch (attachment.type) {
          case MessageAttachmentType.FILE:
            return (attachment.data as MessageFileAttachmentData).fileID;
          case MessageAttachmentType.ANNOTATION:
            return (attachment.data as MessageAnnotationAttachmentData)
              .screenshotFileID;
          case MessageAttachmentType.SCREENSHOT:
            return (attachment.data as MessageScreenshotAttachmentData)
              .screenshotFileID;

          default:
            return null;
        }
      })
      .filter(isDefined);

    let files: FileEntity[] = [];
    if (fileIDs.length > 0) {
      files = await this.loaders.fileLoader.loadFiles(fileIDs);

      if (files.length !== fileIDs.length) {
        // this is lazy catch-all error in case not all user-provided file IDs are
        // visible to them (bad scenario).
        throw new CordError('Not all attached files were loaded.', {
          files: JSON.stringify(files),
          fileIDs,
        });
      }

      for (const file of files) {
        if (file.userID !== userID) {
          throw new Error('You can only attach your own files to a message.');
        }
      }
    }

    // at this point we've confirmed that all file attachments are visible and correct
    const createdAttachments = await Promise.all([
      ...attachmentsToCreate.map((attachment) =>
        MessageAttachmentEntity.create({
          messageID: message.id,
          id: attachment.id,
          type: attachment.type,
          data: attachment.data,
        }),
      ),
    ]);

    await this.attachFilesToExternalTasksFromMessage(message, files);

    return [deletedAttachmentsCount, createdAttachments, files] as const;
  }

  private async deleteAttachment(
    { attachmentID, fileIDs }: { attachmentID: UUID; fileIDs: UUID[] },
    message: MessageEntity,
  ) {
    const deleted = await MessageAttachmentEntity.destroy({
      where: {
        messageID: message.id,
        id: attachmentID,
      },
    });

    if (fileIDs.length > 0) {
      const mutator = new FileMutator(this.viewer, this.loaders);
      await Promise.all(fileIDs.map((f) => mutator.deleteFile(f)));
    }

    return deleted === 1;
  }

  private async attachFilesToExternalTasksFromMessage(
    message: MessageEntity,
    files: FileEntity[],
  ) {
    if (files.length === 0) {
      return;
    }
    const task = await this.loaders.taskLoader.loadTaskForMessageNoOrgCheck(
      message.id,
    );
    if (!task) {
      return;
    }
    return await this.attachFilesToExternalTasks(task, files);
  }

  public async attachFilesToExternalTasks(
    task: TaskEntity,
    files: FileEntity[],
  ) {
    if (files.length === 0) {
      return;
    }
    const externalReferences = await TaskThirdPartyReference.findAllForTask(
      task.id,
    );

    return await Promise.all(
      externalReferences.map((externalReference) => {
        switch (externalReference.externalConnectionType) {
          case 'jira':
            return addJiraTaskAttachments(
              this.viewer,
              externalReference.externalID,
              files,
            );
          case 'asana':
            return addAsanaTaskAttachments(
              this.viewer,
              externalReference.externalID,
              files,
            );
          case 'linear':
            return addLinearTaskAttachments(
              this.viewer,
              externalReference.externalID,
              files,
            );
          case 'monday':
            return addMondayTaskAttachments(
              this.viewer,
              externalReference.externalID,
              files,
            );
          default:
            this.logger.info(
              `attaching files to ${externalReference.externalConnectionType} tasks is not supported yet`,
            );
            return null;
        }
      }),
    );
  }
}
