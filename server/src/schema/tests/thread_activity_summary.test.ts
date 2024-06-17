import { Sequelize } from 'sequelize';
import { Viewer } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  defaultTestLocation,
  fetchOrCreateThreadByExternalIDViaGraphQL,
  markThreadSeenViaGraphQL,
  resolveThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import type { ThreadActivitySummary } from 'server/src/schema/resolverTypes.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

// eslint-disable-next-line import/no-restricted-paths
import { ThreadActivityQuery } from 'external/src/graphql/operations.ts';
import { createMentionNode } from '@cord-sdk/react/common/lib/messageNode.ts';

let viewer: Viewer;
let poster: Viewer;

async function checkSummary(v: Viewer, s: ThreadActivitySummary) {
  const result = await executeGraphQLOperation({
    query: ThreadActivityQuery,
    variables: {
      pageContext: { data: defaultTestLocation },
    },
    viewer: v,
  });

  expect(result.data?.activity?.threadSummary).toEqual<ThreadActivitySummary>(
    s,
  );
}

describe('Test activity summary', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [viewerUser, posterUser] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: viewerUser,
      org,
    });
    poster = await Viewer.createLoggedInPlatformViewer({
      user: posterUser,
      org,
    });
  });

  beforeEach(async () => {
    await Promise.all([
      ThreadEntity.truncate({ cascade: true }),
      MessageEntity.truncate({ cascade: true }),
    ]);
  });

  test('Empty', async () => {
    await checkSummary(viewer, {
      totalThreadCount: 0,
      unreadThreadCount: 0,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('Fresh thread', async () => {
    const { threadID } = await createThreadViaGraphQL(poster, {});
    await addMessageViaGraphQL(poster, { threadID });
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 1,
      newThreadCount: 1,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('Seen thread', async () => {
    const { threadID } = await createThreadViaGraphQL(poster, {});
    await addMessageViaGraphQL(poster, { threadID });
    await markThreadSeenViaGraphQL(viewer, threadID);
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 0,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('New message in seen thread', async () => {
    const { threadID } = await createThreadViaGraphQL(poster, {});
    await addMessageViaGraphQL(poster, { threadID });
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addMessageViaGraphQL(poster, { threadID });
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 1,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('Reply to thread counts as seen', async () => {
    const { threadID } = await createThreadViaGraphQL(poster, {});
    await addMessageViaGraphQL(poster, { threadID });
    await addMessageViaGraphQL(viewer, { threadID });
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 0,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('Reply in subscribed thread', async () => {
    const { threadID } = await createThreadViaGraphQL(poster, {});
    await addMessageViaGraphQL(poster, { threadID });
    await addMessageViaGraphQL(viewer, { threadID });
    await addMessageViaGraphQL(poster, { threadID });
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 1,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 1,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('@mention in first message is new and subscribed', async () => {
    await createThreadViaGraphQL(poster, {
      content: [createMentionNode(viewer.externalUserID!, 'somename')],
    });
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 1,
      newThreadCount: 1,
      unreadSubscribedThreadCount: 1,
      resolvedThreadCount: 0,
      emptyThreadCount: 0,
    });
  });

  test('Resolved thread', async () => {
    const { threadID } = await createThreadViaGraphQL(poster, {});
    await resolveThreadViaGraphQL(poster, { threadID });
    await checkSummary(viewer, {
      totalThreadCount: 1,
      unreadThreadCount: 0,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 1,
      emptyThreadCount: 0,
    });
  });

  test('Empty thread', async () => {
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
      externalID: 'myNewThread',
    });
    await checkSummary(viewer, {
      totalThreadCount: 0,
      unreadThreadCount: 0,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 1,
    });
  });

  test('Thread with only deleted message', async () => {
    const { messageID } = await createThreadViaGraphQL(poster, {});
    await MessageEntity.update(
      { deletedTimestamp: Sequelize.fn('now') },
      { where: { id: messageID } },
    );
    await checkSummary(viewer, {
      totalThreadCount: 0,
      unreadThreadCount: 0,
      newThreadCount: 0,
      unreadSubscribedThreadCount: 0,
      resolvedThreadCount: 0,
      emptyThreadCount: 1,
    });
  });

  test('Some of everything', async () => {
    // An empty thread
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
      externalID: 'empty',
    });

    // A new, subscribed thread
    await createThreadViaGraphQL(poster, {
      content: [createMentionNode(viewer.externalUserID!, 'somename')],
    });

    // An unsubscribed thread with a read and a new message
    {
      const { threadID } = await createThreadViaGraphQL(poster, {});
      await addMessageViaGraphQL(poster, { threadID });
      await markThreadSeenViaGraphQL(viewer, threadID);
      await addMessageViaGraphQL(poster, { threadID });
    }

    // A resolved thread with new messages
    {
      const { threadID } = await createThreadViaGraphQL(poster, {});
      await addMessageViaGraphQL(poster, { threadID });
      await resolveThreadViaGraphQL(poster, { threadID });
    }
    await checkSummary(viewer, {
      totalThreadCount: 3,
      unreadThreadCount: 2,
      newThreadCount: 1,
      unreadSubscribedThreadCount: 1,
      resolvedThreadCount: 1,
      emptyThreadCount: 1,
    });
  });
});
