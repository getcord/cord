import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasPlatformUser,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { MAX_FILE_UPLOADING_TIME_SECONDS } from 'common/const/Timing.ts';
import { MessageAttachmentLoader } from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import { TaskLoader } from 'server/src/entity/task/TaskLoader.ts';
import type { FileUploadStatus } from 'server/src/schema/resolverTypes.ts';
import { FileLoader } from 'server/src/entity/file/FileLoader.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { MessageAttachmentMutator } from 'server/src/entity/message_attachment/MessageAttachmentMutator.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

export class FileMutator {
  logger: Logger;

  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders,
  ) {
    this.logger = new Logger(viewer);
  }

  async createFileForUpload(
    id: UUID,
    name: string,
    mimeType: string,
    size: number,
    uploadStatus?: FileUploadStatus,
  ): Promise<FileEntity> {
    const { userID, platformApplicationID } = assertViewerHasPlatformUser(
      this.viewer,
    );
    const application = await this.loaders.applicationLoader.load(
      platformApplicationID,
    );

    // ignoreDuplicates is only supported for bulkCreate
    const file = (
      await FileEntity.bulkCreate(
        [
          {
            id,
            name,
            mimeType,
            size,
            userID,
            platformApplicationID,
            uploadStatus: uploadStatus || 'uploading',
            s3Bucket: application?.customS3Bucket,
          },
        ],
        {
          // in case the request is retried - no need to error
          ignoreDuplicates: true,
        },
      )
    )[0];

    // If the `uploadStatus` is still `UPLOADING` in
    // `MAX_FILE_UPLOADING_TIME_SECONDS`, then set the file's `uploadStatus`
    // to `CANCELLED`.
    setTimeout(() => {
      backgroundPromise(
        (async () => {
          try {
            const [updated] = await FileEntity.update(
              { uploadStatus: 'cancelled' },
              {
                where: {
                  id,
                  userID,
                  uploadStatus: 'uploading',
                },
              },
            );
            if (updated > 0) {
              // If we actually cancelled the file upload, try to find the message
              // it's attached to so we can inform any subscribers that the status
              // changed.
              const attachment = await MessageAttachmentEntity.findOne({
                where: { data: { fileID: id } },
              });
              if (!attachment) {
                return;
              }
              const message = await MessageEntity.findOne({
                where: { id: attachment.messageID },
              });
              if (!message) {
                return;
              }
              backgroundPromise(
                publishPubSubEvent(
                  'thread-message-updated',
                  { threadID: message.threadID },
                  { messageID: message.id },
                ),
                this.logger,
              );
            }
          } catch (e) {
            this.logger.logException('File upload auto-cancel failed', e);
          }
        })(),
      );
    }, MAX_FILE_UPLOADING_TIME_SECONDS * 1000);
    return file;
  }

  async setFileUploadStatus(
    id: UUID,
    uploadStatus: FileUploadStatus,
    size?: number | null,
  ) {
    const userID = assertViewerHasUser(this.viewer);
    const [count, updatedEntities] = await FileEntity.update(
      size ? { uploadStatus, size } : { uploadStatus },
      { where: { id, userID }, returning: true },
    );

    const file = count > 0 ? updatedEntities[0] : null;
    if (file && uploadStatus === 'uploaded') {
      const task = await this.getTaskFromFile(file);
      if (task) {
        await new MessageAttachmentMutator(
          this.viewer,
          this.loaders,
        ).attachFilesToExternalTasks(task, [file]);
      }
    }

    return file;
  }

  private async getTaskFromFile(file: FileEntity) {
    const attachment = await new MessageAttachmentLoader(
      this.viewer,
    ).getAttachmentFromFileID(file.id);
    if (!attachment) {
      return null;
    }

    const message = await this.loaders.messageLoader.loadMessage(
      attachment.messageID,
    );
    if (!message) {
      return null;
    }

    return await new TaskLoader(this.viewer).loadTaskForMessageNoOrgCheck(
      message.id,
    );
  }

  async deleteFile(id: UUID): Promise<boolean> {
    const userID = assertViewerHasUser(this.viewer);
    const file = await new FileLoader(this.viewer).loadFile(id);
    const bucketLoader = new S3BucketLoader(this.viewer);
    const deletionURL = await file!.getDeleteURL(bucketLoader);
    const headers = {
      method: 'DELETE',
    };

    const deleteResponse = await fetch(deletionURL, headers);

    if (!deleteResponse.ok) {
      this.logger.error(
        `Attachment deletion failed with status ${deleteResponse.status}`,
        { id },
      );
      // TODO: Mark deletion to happen later.
      return false;
    }
    this.logger.info(
      'Deletion request has returned, and there is no longer a file in S3.',
      { id },
    );
    const deletedRows = await FileEntity.destroy({
      where: {
        id,
        userID,
      },
    });

    return deletedRows === 1;
  }
}
