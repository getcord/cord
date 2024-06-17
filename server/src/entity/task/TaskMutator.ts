import type { UUID } from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import {
  createAsanaTask,
  updateAsanaTask,
} from 'server/src/third_party_tasks/asana/actions.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { TaskLoader } from 'server/src/entity/task/TaskLoader.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import {
  updateLinearTask,
  createLinearTask,
} from 'server/src/third_party_tasks/linear/actions.ts';
import {
  createSimpleJiraTask,
  updateJiraTask,
} from 'server/src/third_party_tasks/jira/actions.ts';
import { createTrelloTask } from 'server/src/third_party_tasks/trello/actions.ts';
import {
  MessageAttachmentLoader,
  getFileAttachmentEntities,
} from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import type {
  MessageAnnotationAttachmentData,
  MessageFileAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { FileLoader } from 'server/src/entity/file/FileLoader.ts';
import { MessageAttachmentMutator } from 'server/src/entity/message_attachment/MessageAttachmentMutator.ts';
import type {
  TaskInput,
  TaskInputType,
  ThirdPartyConnectionType,
} from 'server/src/schema/resolverTypes.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { isDefined } from 'common/util/index.ts';
import {
  createMondayTask,
  updateMondayTask,
} from 'server/src/third_party_tasks/monday/actions.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';

export class TaskMutator {
  logger: Logger;

  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders,
  ) {
    this.logger = new Logger(viewer);
  }

  async createTask(task: TaskInput, messageID: UUID) {
    const orgID = assertViewerHasOrg(this.viewer);

    const entity = await TaskEntity.create({
      id: task.id,
      messageID,
      done: task.done,
      orgID,
    });

    await this.createExternalTask(entity, task.type);

    return entity;
  }

  private async createExternalTask(task: TaskEntity, type: TaskInputType) {
    switch (type) {
      case 'jira': {
        await createSimpleJiraTask(this.viewer, task);
        break;
      }
      case 'asana': {
        await createAsanaTask(this.viewer, task);
        break;
      }
      case 'linear': {
        await createLinearTask(this.viewer, task);
        break;
      }
      case 'trello': {
        await createTrelloTask(this.logger, this.viewer, task);
        break;
      }
      case 'monday': {
        await createMondayTask(this.viewer, task);
        break;
      }
    }

    // attach existing file attachments to external task
    const messageAttachmentLoader = new MessageAttachmentLoader(this.viewer);
    const messageAttachments =
      await messageAttachmentLoader.loadAttachmentsForMessage(task.messageID);

    const fileIDs = getFileAttachmentEntities(messageAttachments)
      .map((attachment) => {
        switch (attachment.type) {
          case MessageAttachmentType.FILE:
            return (attachment.data as MessageFileAttachmentData).fileID;
          case MessageAttachmentType.ANNOTATION:
            return (attachment.data as MessageAnnotationAttachmentData)
              .screenshotFileID;
          case MessageAttachmentType.SCREENSHOT:
            // TODO: Do we want to attach the screenshot to the task?
            return null;
          default:
            return null;
        }
      })
      .filter(isDefined);

    if (fileIDs.length > 0) {
      const fileLoader = new FileLoader(this.viewer);
      const files = await fileLoader.loadFiles(fileIDs);
      return await new MessageAttachmentMutator(
        this.viewer,
        this.loaders,
      ).attachFilesToExternalTasks(task, files);
    }
    return;
  }

  async createOrUpdateTask(task: TaskInput, messageID: UUID) {
    const orgID = assertViewerHasOrg(this.viewer);
    const taskLoader = new TaskLoader(this.viewer);
    const existingTask = await taskLoader.loadTask(task.id, orgID);

    let lastUpdatedBy: UUID | undefined | null;
    if (task.doneStatusUpdate === 'update') {
      lastUpdatedBy = this.viewer.userID;
    } else if (task.doneStatusUpdate === 'remove') {
      lastUpdatedBy = null;
    }
    if (existingTask) {
      const [updateCount] = await TaskEntity.update(
        {
          done: task.done,
          ...(lastUpdatedBy !== undefined && {
            doneStatusLastUpdatedBy: lastUpdatedBy,
          }),
        },
        { where: { id: task.id, orgID } },
      );

      if (updateCount === 0) {
        return existingTask;
      } else {
        const entity = await TaskEntity.findByPk(task.id);

        if (entity && task.type !== 'cord') {
          await this.updateOrCreateExternalTasks(entity, task.type);
        }

        return entity;
      }
    } else {
      return await this.createTask(task, messageID);
    }
  }

  private async updateOrCreateExternalTasks(
    task: TaskEntity,
    type: ThirdPartyConnectionType,
  ) {
    const externalReference = await TaskThirdPartyReference.findForTask(
      task.id,
      type,
    );

    if (externalReference) {
      switch (externalReference.externalConnectionType) {
        case 'asana':
          return await updateAsanaTask(
            this.viewer,
            externalReference,
            task.done,
          );
        case 'linear':
          return await updateLinearTask(
            this.viewer,
            externalReference,
            task.done,
          );
        case 'jira':
          return await updateJiraTask(
            this.viewer,
            externalReference,
            task.done,
          );
        case 'monday':
          return await updateMondayTask(
            this.viewer,
            externalReference,
            task.done,
          );
        default:
          this.logger.info(
            `updating of ${externalReference.externalConnectionType} is not supported yet`,
          );
          return null;
      }
    } else {
      await this.createExternalTask(task, type);
    }
  }

  // Deleting task also deletes Todos and Assignees
  async deleteTaskFromMessageID(messageID: string, orgID: UUID) {
    return await TaskEntity.destroy({ where: { messageID, orgID } });
  }
}
