import { v4 as uuid } from 'uuid';
import { Viewer } from 'server/src/auth/index.ts';

import type { EntityMetadata, PageContext } from 'common/types/index.ts';
import type { MessageContent, UUID } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import { PageLoader } from 'server/src/entity/page/PageLoader.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { PageVisitorMutator } from 'server/src/entity/page_visitor/PageVisitorMutator.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { MessageReactionMutator } from 'server/src/entity/message_reaction/MessageReactionMutator.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  createMentionNode,
  createParagraphNode,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';

export type MessageAnnotationType =
  | 'canvas-new'
  | 'dashboard'
  | 'document'
  | 'videoPlayer';

export function getReplyContent(messageAnnotationType: MessageAnnotationType) {
  switch (messageAnnotationType) {
    case 'dashboard':
      return `Some ideas: reply to this comment, click on the barchart to add your own comment, or share this link with someone else to collaborate live!`;

    case 'videoPlayer':
      return `Some ideas: reply to this comment, click "Comment on a frame" and then on the video to add a comment on a specific point in time, or share this link with someone else to collaborate live!`;

    case 'document':
      return 'Edit, resolve, and delete messages';

    case 'canvas-new':
      return 'Did you have any feedback or are you just showing off how good Cord is?';

    default:
      throw new Error('Invalid message annotation type');
  }
}

export async function createDemoAppsMessage({
  addReply = false,
  content,
  org,
  anonymousUser,
  sentBy,
  threadTitle,
  URL,
  cordLocation,
  messageAnnotationType,
  threadExternalId,
  threadMetadata,
}: {
  org: OrgEntity;
  anonymousUser: UserEntity;
  sentBy: UserEntity;
  threadTitle: string;
  URL: string;
  cordLocation: PageContext['data'];
  messageAnnotationType: MessageAnnotationType;
  threadExternalId?: string;
  threadMetadata?: EntityMetadata;
  content?: MessageContent;
  /** @deprecated please use addReplyToThread instead.
   * TODO: get rid of addReply altogether */
  addReply?: boolean;
}) {
  const senderViewer = await createDummyViewer(sentBy, org);
  const senderLoaders = await getNewLoaders(senderViewer);

  const { page } = await createDemoAppsPageContext(senderViewer, cordLocation);

  const thread = await createDemoAppsThread({
    externalID: threadExternalId,
    createdBy: senderViewer,
    title: threadTitle,
    URL,
    page,
    metadata: threadMetadata,
    appID: org.platformApplicationID!,
  });

  const threadParticipants = [senderViewer.userID!, anonymousUser.id];
  const threadParticipantMutator = new ThreadParticipantMutator(
    senderViewer,
    senderLoaders,
  );
  await threadParticipantMutator.subscribeUsersToThread(
    thread.id,
    threadParticipants,
  );

  const message = await new MessageMutator(
    senderViewer,
    senderLoaders,
  ).createMessage({
    id: uuid(),
    thread,
    url: URL,
    content: content ?? [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'Welcome, ' },
          createMentionNode(anonymousUser.id, anonymousUser.name!),
          { text: '!' },
        ],
      },
      createParagraphNode('You can comment and mention on this page.'),
    ],
  });

  // Hacks on hacks. We are directly creating a message, so notifs don't get
  // automatically generated, so we need to do that by hand. But since we
  // generate demo apps data for all of the demo apps at the same time,
  // in the same org, they'll all show notifs from all of the apps, which is a
  // bit confusing. So only generate a notif for the one app which actually has
  // a notif launcher on it.
  if (messageAnnotationType === 'dashboard') {
    await new NotificationMutator(senderViewer).create({
      recipientID: anonymousUser.id,
      type: 'reply',
      messageID: message.id,
      replyActions: ['create-thread', 'mention'],
      threadID: message.threadID,
    });
  }

  if (addReply) {
    await addReplyToThread({
      replyContent: [
        createParagraphNode(getReplyContent(messageAnnotationType)),
      ],
      senderViewer,
      senderLoaders,
      cordLocation,
      thread,
      replyReactions: ['👍️', '❤️'],
      threadParticipantMutator,
    });
  }

  return { thread, senderViewer, threadParticipantMutator };
}

async function createDemoAppsPageContext(
  viewer: Viewer,
  cordLocation: PageContext['data'],
) {
  const pageContext: PageContext = {
    providerID: null,
    data: cordLocation,
  };

  const pageContextHash = await new PageMutator(viewer).createPageIfNotExists(
    pageContext,
  );
  const page = (await new PageLoader(viewer).getPageFromContextHash(
    pageContextHash,
  )) as PageEntity;

  await new PageVisitorMutator(viewer).markPresentInPage(pageContextHash);

  return { page, pageContextHash };
}

export async function createDemoAppsThread({
  externalID,
  createdBy,
  URL,
  page,
  title,
  metadata,
  appID,
}: {
  externalID?: string;
  createdBy: Viewer;
  page: PageEntity;
  title: string;
  URL: string;
  metadata?: EntityMetadata;
  appID: UUID;
}) {
  return await getSequelize().transaction(
    async (transaction) =>
      await new ThreadMutator(createdBy, null).createThreadOnPage(
        uuid(),
        URL,
        page,
        title,
        transaction,
        appID,
        externalID ?? null,
        { ...metadata, autogenerated: true },
      ),
  );
}

export async function addReplyToThread({
  senderViewer,
  senderLoaders,
  replyReactions,
  replyContent,
  thread,
  threadParticipantMutator,
  cordLocation,
}: {
  thread: ThreadEntity;
  replyContent: MessageContent;
  senderViewer: Viewer;
  senderLoaders: RequestContextLoaders;
  replyReactions: string[];
  threadParticipantMutator: ThreadParticipantMutator;
  cordLocation: PageContext['data'];
}) {
  await createDemoAppsPageContext(senderViewer, cordLocation);

  const reply = await new MessageMutator(
    senderViewer,
    senderLoaders,
  ).createMessage({
    id: uuid(),
    thread,
    url: thread.url,
    content: replyContent,
    metadata: { autogenerated: true },
  });

  for (const reaction of replyReactions) {
    await new MessageReactionMutator(senderViewer, senderLoaders).createOne(
      reply.id,
      reaction,
    );
  }

  await threadParticipantMutator.markThreadNewlyActiveForOtherUsers(
    thread.id,
    reply.id,
  );
}

export function createDummyViewer(user: UserEntity, org: OrgEntity) {
  return Viewer.createLoggedInPlatformViewer({
    user,
    org,
  });
}

type ChartThreadMetadata = {
  type: string;
  chartId: string;
  seriesId: string;
  x: number;
  y: number;
};
export function getDashboardExternalThreadId(
  chartThreadMetadata: ChartThreadMetadata,
  orgExternalID: string,
) {
  return `${orgExternalID}_${chartThreadMetadata.chartId}_${chartThreadMetadata.seriesId}_${chartThreadMetadata.x}_${chartThreadMetadata.y}`;
}
