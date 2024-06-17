import type { UUID } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export function publishUpdatedMessageEvents(
  context: RequestContext,
  thread: ThreadEntity,
  message: MessageEntity,
  updateAnnotations: boolean,
  newUserReferenceIDs: UUID[],
  originalSubscribers: Set<UUID>,
) {
  const pageContextHash = thread.pageContextHash;

  if (pageContextHash && updateAnnotations) {
    backgroundPromise(
      publishPubSubEvent('annotations-on-page-updated', {
        pageContextHash: pageContextHash,
        orgID: message.orgID,
      }),
    );
  }

  if (newUserReferenceIDs.length > 0) {
    const notify = async () => {
      const page =
        await context.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(
          thread.id,
        );
      if (!page) {
        throw new Error('Unable to find thread location');
      }
      const location = page.contextData;
      await Promise.all(
        newUserReferenceIDs.map((userID) =>
          publishPubSubEvent(
            'inbox-updated',
            { userID },
            { threadID: thread.id, location },
          ),
        ),
      );
    };
    backgroundPromise(notify());
  }

  backgroundPromise(
    publishPubSubEvent(
      'thread-message-updated',
      { threadID: message.threadID },
      { messageID: message.id },
    ),
  );

  backgroundPromise(
    (async (): Promise<void> => {
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
      if (removed.length > 0 || added.length > 0) {
        backgroundPromise(
          publishPubSubEvent(
            'thread-filterable-properties-updated',
            { orgID: thread.orgID },
            {
              threadID: thread.id,
              changes: { subscribers: { added, removed } },
            },
          ),
        );
      }
    })(),
  );
}

export function publishAppendedMessageContentEvents(
  message: MessageEntity,
  appendedContent: string,
) {
  backgroundPromise(
    publishPubSubEvent(
      'thread-message-content-appended',
      { threadID: message.threadID },
      {
        messageID: message.id,
        appendedContent,
      },
    ),
  );
}
