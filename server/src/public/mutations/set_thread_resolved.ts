import { v4 as uuid } from 'uuid';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import type { MessageActionsType } from 'common/const/MessageActions.ts';
import {
  MessageActionIconURLs,
  MessageActionTranslationKeys,
} from 'common/const/MessageActions.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishEventToWebhook } from 'server/src/webhook/webhook.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { getActionMessageContent } from 'server/src/message/util/getActionMessageContent.ts';
import { createThreadActionNotifications } from 'server/src/entity/thread/update_thread_tasks/createThreadActionNotifications.ts';

export const setThreadResolvedResolver: Resolvers['Mutation']['setThreadResolved'] =
  async (_, args, originalContext) => {
    const { threadID, resolved } = args;

    const thread =
      await originalContext.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    const context = await getRelevantContext(originalContext, thread.orgID);
    const { viewer } = context.session;
    const { userID, orgID } = assertViewerHasIdentity(viewer);

    const user = await originalContext.loaders.userLoader.loadUser(userID);
    if (!user) {
      throw new Error("The user doesn't exist?!?");
    }

    // If the thread is already in the right state, do nothing
    if ((thread.resolvedTimestamp !== null) === resolved) {
      return { success: true, failureDetails: null };
    }

    const originalSubscribers = new Set(
      await context.loaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
        thread.id,
      ),
    );

    const actionType: MessageActionsType = resolved
      ? 'thread_resolved'
      : 'thread_unresolved';

    try {
      const messageMutator = new MessageMutator(viewer, context.loaders);

      const threadMutator = new ThreadMutator(viewer, context.loaders);
      let result = false;
      const { success, message } = await getSequelize().transaction(
        async (transaction) => {
          const createdMessage = await messageMutator.createMessage(
            {
              id: uuid(),
              thread,
              content: getActionMessageContent(actionType, user),
              url: null,
              iconURL: MessageActionIconURLs[actionType],
              translationKey: MessageActionTranslationKeys[actionType],
              type: 'action_message',
            },
            transaction,
          );

          const updateThread = await threadMutator.setThreadResolved(
            threadID,
            resolved,
            transaction,
          );

          const threadParticipantMutator = new ThreadParticipantMutator(
            viewer,
            context.loaders,
          );

          // if a user has resolved or reopened, we should subscribe them to
          await threadParticipantMutator.setViewerSubscribed(
            thread,
            true,
            transaction,
          );

          await threadParticipantMutator.markThreadSeen({
            threadID,
            setSubscribed: true,
            transaction,
          });

          await threadParticipantMutator.markThreadNewlyActiveForOtherUsers(
            threadID,
            createdMessage.id,
            transaction,
          );

          return {
            success: updateThread && !!createdMessage,
            message: createdMessage,
          };
        },
      );

      result = success;

      if (result) {
        const app = await ApplicationEntity.findByPk(
          message.platformApplicationID,
        );

        if (!app) {
          throw new Error('No application found when resolving thread');
        }

        backgroundPromise(
          Promise.all([
            publishPubSubEvent(
              'thread-message-added',
              { threadID: message.threadID },
              { messageID: message.id },
            ),

            publishEventToWebhook(app, {
              type: 'thread-message-added',
              threadID: thread.id,
              messageID: message.id,
            }),
          ]),
          context.logger,
        );
      }

      const page =
        await context.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(
          threadID,
        );

      if (!page) {
        throw new Error(`Thread does not exist on a page.`);
      }
      const newSubscribers = new Set(
        await context.loaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
          thread.id,
        ),
      );

      const removed = [...originalSubscribers].filter(
        (s) => !newSubscribers.has(s),
      );
      const added = [...newSubscribers].filter(
        (s) => !originalSubscribers.has(s),
      );
      const pageContextHash = page.contextHash;

      await Promise.all([
        publishPubSubEvent(
          'thread-filterable-properties-updated',
          { orgID },
          {
            threadID,
            changes: {
              resolved: { old: !resolved, new: resolved },
              ...((added.length > 0 || removed.length > 0) && {
                subscribers: { added, removed },
              }),
            },
          },
        ),
        publishPubSubEvent('thread-properties-updated', { threadID }),
        publishPubSubEvent('annotations-on-page-updated', {
          pageContextHash,
          orgID,
        }),
        createThreadActionNotifications({
          context,
          threadID: thread.id,
          messageID: message.id,
          threadActionType:
            actionType === 'thread_resolved' ? 'resolve' : 'unresolve',
        }),
      ]);

      return { success: result, failureDetails: null };
    } catch (e) {
      context.logger.logException(
        'Error while setting resolve thread status',
        e,
        {
          userID,
          threadID,
          resolved,
        },
      );
      return { success: false, failureDetails: null };
    }
  };
