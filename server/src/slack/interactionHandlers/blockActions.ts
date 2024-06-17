// A file with functions that handle various Slack interaction events with
// type block_actions
import { IncomingWebhook } from '@slack/webhook';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { supportStatusButton } from 'server/src/util/interactiveSupportButton.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { LogLevel } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { Logger } from 'server/src/logging/Logger.ts';

export async function handleSupportThreadStatusChange(
  event: any,
  org: OrgEntity,
) {
  const logger = new Logger(Viewer.createOrgViewer(org.id), { event });
  const actionId = event.actions[0].action_id;
  const value = event.actions[0].value;

  const threadID = value.split('_')[1];
  const supportStatus = actionId === 'support_close_thread' ? 'closed' : 'open';

  await ThreadEntity.update(
    { supportStatus },
    {
      where: { id: threadID },
    },
  );

  const newStatus = (await ThreadEntity.findByPk(threadID))?.supportStatus;

  if (!newStatus) {
    logger.error('Thread support status not found', {
      threadID,
      slackOrg: event.user.team_id,
      orgID: org.id,
    });
  }

  logServerEvent({
    session: { viewer: Viewer.createOrgViewer(org.id) },
    logLevel: LogLevel.DEBUG,
    type: `support-thread-${supportStatus}`,
    payload: {
      orgID: org.id,
      threadID,
    },
  });

  const newActionBlock =
    newStatus === 'closed'
      ? supportStatusButton('open', threadID)
      : supportStatusButton('close', threadID);

  const replacementMessage = [
    ...event.message.blocks.filter((block: any) => block.type !== 'actions'),
    newActionBlock,
  ];

  const responseUrl = event.response_url;
  const webhook = new IncomingWebhook(responseUrl);

  // Bizarrely this returns a 404 for other problems like incorrectly formatted input
  await webhook.send({
    blocks: replacementMessage,
  });
}
