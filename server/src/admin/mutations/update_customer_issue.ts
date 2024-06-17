import { sendCustomerIssueNotification } from 'server/src/admin/crt_notifications.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { AdminCRTIssueChangeDetail } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueChangeEntity.ts';
import { AdminCRTCustomerIssueChangeEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueChangeEntity.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';

export const updateCustomerIssueResolver: Resolvers['Mutation']['updateCustomerIssue'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const {
      id,
      customerID,
      title,
      body,
      comingFrom,
      decision,
      lastTouch,
      communicationStatus,
      type,
      priority,
      assignee,
      externallyVisible,
    } = args;

    const previous = await AdminCRTCustomerIssueEntity.findByPk(id);
    if (!previous) {
      throw new Error("Updating issue that doesn't exist");
    }
    const [updated, newRows] = await AdminCRTCustomerIssueEntity.update(
      {
        customerID,
        title,
        body,
        comingFrom,
        decision,
        lastTouch,
        communicationStatus,
        type,
        priority,
        assignee,
        externallyVisible,
      },
      { where: { id }, returning: true },
    );

    if (newRows.length === 1) {
      const changeDetail = {
        updated: [] as NonNullable<AdminCRTIssueChangeDetail['updated']>,
      };
      const newRow = newRows[0];
      const attrs = AdminCRTCustomerIssueEntity.getAttributes();
      for (const field of Object.keys(attrs)) {
        if (field === 'createdTimestamp') {
          continue;
        }
        if (field === 'lastTouch') {
          const prevDate = previous.getDataValue(field) as Date | null;
          const newDate = newRow.getDataValue(field) as Date | null;
          if (
            (prevDate === null) !== (newDate === null) ||
            (prevDate !== null &&
              newDate !== null &&
              prevDate.getTime() !== newDate.getTime())
          ) {
            changeDetail.updated.push({
              field,
              oldValue: prevDate?.toISOString() ?? null,
              newValue: newDate?.toISOString() ?? null,
            });
          }
        } else if (
          previous.getDataValue(field) !== newRow.getDataValue(field)
        ) {
          changeDetail.updated.push({
            field,
            oldValue: previous.getDataValue(field),
            newValue: newRow.getDataValue(field),
          });
        }
      }
      if (changeDetail.updated.length > 0) {
        await AdminCRTCustomerIssueChangeEntity.create({
          issueID: id,
          userID,
          changeDetail,
        });

        await sendCustomerIssueNotification({
          issueID: id,
          actor: userID,
          assignee: assignee,
          template: `{{actor}} updated issue: ${title}`,
        });
      }
    }

    return {
      success: updated === 1,
      failureDetails: null,
    };
  };
