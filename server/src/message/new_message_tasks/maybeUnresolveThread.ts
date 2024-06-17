import { v4 as uuid } from 'uuid';

import type { RequestContext } from 'server/src/RequestContext.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { getActionMessageContent } from 'server/src/message/util/getActionMessageContent.ts';
import {
  MessageActionIconURLs,
  MessageActionTranslationKeys,
} from 'common/const/MessageActions.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishEventToWebhook } from 'server/src/webhook/webhook.ts';
import { createThreadActionNotifications } from 'server/src/entity/thread/update_thread_tasks/createThreadActionNotifications.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

export async function maybeUnresolveThread(
  context: RequestContext,
  thread: ThreadEntity,
  message: MessageEntity,
) {
  if (thread && thread.resolvedTimestamp) {
    const userID = assertViewerHasUser(context.session.viewer);
    const user = await context.loaders.userLoader.loadUser(userID);
    if (!user) {
      throw new Error("User doesn't exist?!?");
    }
    const unresolveActionMessage = await new MessageMutator(
      context.session.viewer,
      context.loaders,
    ).createMessage({
      id: uuid(),
      thread,
      content: getActionMessageContent('thread_unresolved', user),
      url: null,
      iconURL: MessageActionIconURLs['thread_unresolved'],
      translationKey: MessageActionTranslationKeys['thread_unresolved'],
      type: 'action_message',
      // Make sure resolve action message is displayed before the actual message in the UI
      timestamp: new Date(message.timestamp.getTime() - 1),
    });

    const threadMutator = new ThreadMutator(
      context.session.viewer,
      context.loaders,
    );
    await threadMutator.setThreadResolved(thread.id, false);

    await Promise.all([
      publishPubSubEvent('thread-properties-updated', {
        threadID: thread.id,
      }),
      publishPubSubEvent(
        'thread-filterable-properties-updated',
        { orgID: thread.orgID },
        {
          threadID: thread.id,
          changes: { resolved: { old: true, new: false } },
        },
      ),
      createThreadActionNotifications({
        context,
        threadID: thread.id,
        messageID: unresolveActionMessage.id,
        threadActionType: 'unresolve',
      }),
    ]);

    if (unresolveActionMessage) {
      const app = await ApplicationEntity.findByPk(
        unresolveActionMessage.platformApplicationID,
      );
      if (!app) {
        throw new Error(
          `Could not find app ${unresolveActionMessage.platformApplicationID} when unresolving thread`,
        );
      }

      backgroundPromise(
        Promise.all([
          publishPubSubEvent(
            'thread-message-added',
            { threadID: unresolveActionMessage.threadID },
            { messageID: unresolveActionMessage.id },
          ),
          publishEventToWebhook(app, {
            type: 'thread-message-added',
            threadID: thread.id,
            messageID: unresolveActionMessage.id,
          }),
        ]),
        context.logger,
      );
    }
  }
}
