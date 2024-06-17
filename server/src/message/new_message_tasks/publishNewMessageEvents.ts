import type { Transaction } from 'sequelize';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { publishNewThreadEvents } from 'server/src/entity/thread/new_thread_tasks/publishNewThreadEvents.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishEventToWebhook } from 'server/src/webhook/webhook.ts';

export async function publishNewMessageEvents(
  application: ApplicationEntity,
  page: PageEntity,
  thread: ThreadEntity,
  message: MessageEntity,
  isFirstMessageInThread: boolean,
  hasAnnotations: boolean,
  mentionedUserIDs: string[],
  context: RequestContext,
  transaction?: Transaction,
) {
  const pageContextHash = thread.pageContextHash || page.contextHash;

  if (isFirstMessageInThread) {
    await publishNewThreadEvents(page.contextData, thread, transaction);
  }

  const notify = async () => {
    if (hasAnnotations && pageContextHash) {
      backgroundPromise(
        publishPubSubEvent('annotations-on-page-updated', {
          pageContextHash,
          orgID: thread.orgID,
        }),
      );
    }

    backgroundPromise(
      Promise.all([
        publishPubSubEvent(
          'thread-message-added',
          { threadID: thread.id },
          { messageID: message.id },
        ),
        publishEventToWebhook(application, {
          type: 'thread-message-added',
          threadID: thread.id,
          messageID: message.id,
        }),
        context.segmentLogger.publishMessageSendEvent(
          thread,
          message,
          isFirstMessageInThread,
          mentionedUserIDs.length,
        ),
      ]),
      context.logger,
    );
  };

  if (transaction) {
    transaction.afterCommit(notify);
  } else {
    await notify();
  }
}
