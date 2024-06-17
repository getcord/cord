import type { Request, Response } from 'express';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import {
  onAsanaAssigneeChanged,
  onAsanaUserChangedTaskStatus,
} from 'server/src/third_party_tasks/asana/actions.ts';
export default function AsanaEventApiHandler(req: Request, res: Response) {
  // The very first webhook request from Asana comes with X-Hook-Secret. We're
  // supposed to store it and then use it to authenticate future requests.
  const webhookSecret = req.get('X-Hook-Secret');
  if (webhookSecret) {
    // this is the initial webhook request
    res.setHeader('X-Hook-Secret', webhookSecret);
    // TODO: Store the webhookSecret for future authentication
    res.sendStatus(200);
    return;
  }

  // TODO: Authenticate the request here
  res.sendStatus(200);
  void handleEvents(req.body['events']);
}

type Event = {
  user: {
    gid: string;
    resource_type: string;
  };
  created_at: string;
  action: string;
  resource?: {
    gid: string;
    resource_type: string;
    resource_subtype: string;
  };
  parent: {
    gid: string;
    resource_type: string;
    resource_subtype: string;
  };
  change?: {
    field: string;
    action: string;
    new_value: null | {
      gid: string;
      resource_type: string;
    };
  };
};

async function handleEvents(events: Event[]) {
  if (!events) {
    anonymousLogger().error(`asana events was null or undefined: ${events}`);
    return;
  }
  for (const event of events) {
    if (!event.resource) {
      anonymousLogger().warn('asana event without a resource', event);
      continue;
    }

    // for now only act when the "completed" task field changed
    if (event.resource.resource_type !== 'task') {
      // only handle task updates
      continue;
    }

    if (
      event.change?.action === 'changed' &&
      event.change?.field === 'completed'
    ) {
      const taskGID = event.resource.gid;
      const asanaUserGID = event.user.gid;
      await onAsanaUserChangedTaskStatus(asanaUserGID, taskGID);
    } else if (
      event.change?.action === 'changed' &&
      event.change?.field === 'assignee'
    ) {
      const taskGID = event.resource.gid;
      const asanaAssignerGID = event.user.gid;
      const newAssigneeGID = event.change?.new_value?.gid;
      await onAsanaAssigneeChanged(asanaAssignerGID, taskGID, newAssigneeGID);
    }
  }
}
