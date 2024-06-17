import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  markThreadSeenViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

import type {
  MessageFragment,
  // eslint-disable-next-line import/no-restricted-paths
} from 'external/src/graphql/operations.ts';
import {
  OlderThreadMessagesQuery,
  // eslint-disable-next-line import/no-restricted-paths
} from 'external/src/graphql/operations.ts';

let viewer: Viewer;
let creator: Viewer;
let threadID: UUID;

async function fetchThread(
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  viewer: Viewer,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  threadID: UUID,
): Promise<{
  newMessagesCount: number;
  messagesCountExcludingDeleted: number;
}> {
  const result = await executeGraphQLOperation({
    query: `query($threadID: UUID!) {
      thread(threadID: $threadID) {
        newMessagesCount
        messagesCountExcludingDeleted
      }
    }`,
    variables: {
      threadID,
    },
    viewer,
  });

  return result?.data?.thread;
}

async function fetchMessages(
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  viewer: Viewer,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  threadID: UUID,
): Promise<[MessageFragment]> {
  const result = await executeGraphQLOperation({
    query: OlderThreadMessagesQuery,
    variables: {
      threadID,
      cursor: null,
      range: -1000,
      ignoreDeleted: true,
    },
    viewer,
  });

  return result.data?.thread.loadMessages.messages;
}

describe('Test marking threads and messages as seen', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [creatorUser, user] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    viewer = await Viewer.createLoggedInPlatformViewer({ user, org });
    creator = await Viewer.createLoggedInPlatformViewer({
      user: creatorUser,
      org,
    });
  });

  beforeEach(async () => {
    ({ threadID } = await createThreadViaGraphQL(creator, {}));

    await addMessageViaGraphQL(creator, {
      threadID,
    });

    await addMessageViaGraphQL(creator, { threadID });
  });

  test('new thread is unseen', async () => {
    const thread = await fetchThread(viewer, threadID);
    expect(thread.messagesCountExcludingDeleted).toBe(3);
    expect(thread.newMessagesCount).toBe(3);
  });

  test('all messages in new thread are unseen', async () => {
    const messages = await fetchMessages(viewer, threadID);
    expect(messages.length).toBe(3);
    messages.forEach((message: MessageFragment) =>
      expect(message.seen).toBe(false),
    );
  });

  test('marking thread as seen marks thread as seen', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    const thread = await fetchThread(viewer, threadID);
    expect(thread.newMessagesCount).toBe(0);
  });

  test('marking thread as seen marks all messages as seen', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    const messages = await fetchMessages(viewer, threadID);
    messages.forEach((message: MessageFragment) =>
      expect(message.seen).toBe(true),
    );
  });

  test('marking thread as seen does not mark new message as seen', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);

    await addMessageViaGraphQL(creator, { threadID });

    const messages = await fetchMessages(viewer, threadID);
    expect(messages.length).toBe(4);
    expect(messages[messages.length - 1].seen).toBe(false);
  });
});
