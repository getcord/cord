import type { Request, Response } from 'express';
import type { LinearIssueStateTypes, UUID } from 'common/types/index.ts';
import {
  handleAssigneeChange,
  handleIssueStatusChange,
  hasAssigneeChanged,
} from 'server/src/third_party_tasks/linear/actions.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

// IP addresses taken from https://developers.linear.app/docs/graphql/webhooks
const LINEAR_IP_ADDRESSES = ['35.231.147.226', '35.243.134.228'];

export default async function LinearEventApiHandler(
  req: Request,
  res: Response,
) {
  const payload = req.body;
  anonymousLogger().debug('LinearEventApiHandler', { linearEvent: payload });

  const requestFromIp = req.get('x-forwarded-for');
  // to check that the web hooks are coming from Linear when not in running dev
  if (
    process.env.NODE_ENV !== 'development' &&
    (!requestFromIp || !LINEAR_IP_ADDRESSES.includes(requestFromIp))
  ) {
    anonymousLogger().error('LinearEventApiHandler', {
      linearEvent: payload,
      message: 'ip address does not match linear ones',
    });
    res.sendStatus(403);
    return;
  }
  res.sendStatus(200);
  await handleLinearEvent(payload);
}

type LinearEvent = {
  action: 'create' | 'update' | 'remove';
  createdAt: string;
  data: LinearEventDataType;
  updatedFrom: UpdatedFromDataType<LinearEventDataType>;
  url: string;
  type: string;
};

type LinearEventDataType = {
  id: UUID;
  createdAt: string;
  updatedAt: string;
  number: number;
  title: string;
  description: string | null | undefined;
  priority: number;
  boardOrder: number;
  previousIdentifiers: string[];
  subIssueSortOrder: number;
  priorityLabel: string;
  teamId: UUID;
  stateId: UUID;
  parentId: UUID;
  assigneeId: UUID;
  subscriberIds: UUID[];
  assignee: { id: UUID; name: string } | null | undefined;
  creatorId: UUID;
  labelIds: UUID[];
  state: {
    id: UUID;
    name: string;
    color: string;
    type: string;
  };
  team: {
    id: UUID;
    name: string;
    key: string;
  };
};

type UpdatedFromDataType<T> = {
  [Property in keyof T]: T[Property];
};

async function handleLinearEvent(event: LinearEvent) {
  const { action, data, updatedFrom, type } = event;

  if (type !== 'Issue') {
    return;
  }

  // this is to detect if any assignees have changed. We are ignoring subscribers
  if (action === 'update') {
    if (hasAssigneeChanged(updatedFrom.assigneeId, data.assigneeId)) {
      return await handleAssigneeChange(
        data.id,
        data.assigneeId,
        updatedFrom.assigneeId,
        data.assignee,
      );
    }

    if (updatedFrom.stateId) {
      return await handleIssueStatusChange(
        data.id,
        data.state.type as LinearIssueStateTypes,
        data.state.name,
      );
    }
  }
  return;
}
