import { Op } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { updateJiraTaskAssigneeAndWatchers } from 'server/src/third_party_tasks/jira/actions.ts';
import { addAsanaTaskAssignees } from 'server/src/third_party_tasks/asana/actions.ts';
import { updateLinearTaskAssigneeAndSubscribers } from 'server/src/third_party_tasks/linear/actions.ts';
import { addAssigneesToTrelloTask } from 'server/src/third_party_tasks/trello/actions.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { TaskLoader } from 'server/src/entity/task/TaskLoader.ts';
import { addMondayAssignees } from 'server/src/third_party_tasks/monday/actions.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';

export class TaskAssigneeMutator {
  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders,
  ) {}

  async createTaskAssignees(taskID: UUID, userIDs: UUID[]): Promise<UUID[]> {
    if (userIDs.length === 0) {
      return [];
    }

    const orgID = assertViewerHasOrg(this.viewer);

    // we used to use sequelize's bulkCreate() here, but it does not behave as
    // expected. See for example:
    // https://github.com/sequelize/sequelize/issues/11204
    const [returnedColumns] = await getSequelize().query(
      `INSERT INTO
      "${TaskAssigneeEntity.tableName}"
      ("userID", "taskID", "orgID", "assignerID")
      VALUES
      ${userIDs.map(() => '(?)').join(',')}
      ON CONFLICT DO NOTHING
      RETURNING "userID"`, // sequelize returns column names in lower-case
      {
        replacements: userIDs.map((userID) => [
          userID,
          taskID,
          orgID,
          this.viewer.userID,
        ]),
      },
    );

    const newUserIDs = (returnedColumns as { userID: UUID }[]).map(
      (row) => row.userID,
    );

    await this.updateExternalTaskAssignees(taskID, newUserIDs, userIDs);

    return newUserIDs;
  }

  async updateTaskAssignees(taskID: UUID, userIDs: UUID[]) {
    const orgID = assertViewerHasOrg(this.viewer);
    const task = await new TaskLoader(this.viewer).loadTask(taskID, orgID);
    const removedAssignees = await TaskAssigneeEntity.findAll({
      attributes: ['userID'],
      where: {
        taskID,
        orgID,
        userID: { [Op.notIn]: userIDs },
      },
    });

    const messageMutator = new MessageMutator(this.viewer, this.loaders);
    if (task !== null && task !== undefined && removedAssignees.length > 0) {
      await messageMutator.removeAssignees(task.messageID, removedAssignees);
    }

    await TaskAssigneeEntity.destroy({
      where: {
        taskID,
        orgID,
        userID: { [Op.notIn]: userIDs },
      },
    });

    const newAssigneeIDs = await this.createTaskAssignees(taskID, userIDs);
    // no need to update external task assignees here, it's done in createTaskAssignees()

    return {
      newAssigneeIDs,
      removedAssigneeIDs: removedAssignees.map(({ userID }) => userID),
    };
  }

  private async updateExternalTaskAssignees(
    taskID: UUID,
    newUserIDs: UUID[],
    assigneeIDs: UUID[],
  ) {
    const externalReferences =
      await TaskThirdPartyReference.findAllForTask(taskID);

    return await Promise.all(
      externalReferences.map((externalReference) => {
        switch (externalReference.externalConnectionType) {
          case 'jira':
            return updateJiraTaskAssigneeAndWatchers(
              this.viewer,
              taskID,
              assigneeIDs,
            );
          case 'asana':
            return addAsanaTaskAssignees(this.viewer, taskID, newUserIDs);
          case 'linear':
            return updateLinearTaskAssigneeAndSubscribers(
              this.viewer,
              taskID,
              assigneeIDs,
            );
          case 'trello':
            return addAssigneesToTrelloTask(this.viewer, taskID, newUserIDs);
          case 'monday':
            return addMondayAssignees(this.viewer, taskID, newUserIDs);
        }
      }),
    );
  }
}
