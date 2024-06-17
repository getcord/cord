import {
  ClearNotificationsForMessageMutation,
  // eslint-disable-next-line import/no-restricted-paths
} from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  addReactionViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  unreadNotificationCountViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { NotificationReadStatus } from 'server/src/schema/resolverTypes.ts';
import { initMockFeatureFlagForTest } from 'server/src/featureflags/index.ts';

let recipient1: Viewer;
let sender1: Viewer;
let firstMessage: string;
let firstReplyToMessage: string;

async function markAsRead(viewer: Viewer, messageID: UUID) {
  const result = await executeGraphQLOperation({
    query: ClearNotificationsForMessageMutation,
    variables: { messageID, byExternalID: false },
    viewer,
  });

  expect(result.data?.clearNotificationsForMessage.success).toBe(true);
}

async function countNotifEntities(
  recipientID: UUID,
  readStatus: NotificationReadStatus,
) {
  return await NotificationEntity.count({ where: { recipientID, readStatus } });
}

describe('Test marking message as read', () => {
  beforeAll(async () => {
    initMockFeatureFlagForTest(async (flag: string) => {
      return flag !== 'user_is_blocked';
    });

    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    // Data configuration:
    // - Recipient1 creates a thread.
    // - Sender1 replies the thread. -> triggers 1 notif to recipient1
    // - Sender1 reacts to first message. -> triggers 1 notif to recipient1
    // - Sender2 replies the thread. -> triggers 2 notifs to recipient1 and sender1

    const [recipient1User, sender1User] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    recipient1 = await Viewer.createLoggedInPlatformViewer({
      user: recipient1User,
      org,
    });
    sender1 = await Viewer.createLoggedInPlatformViewer({
      user: sender1User,
      org,
    });
    const sender2 = await Viewer.createLoggedInPlatformViewer({
      user: sender1User,
      org,
    });

    const [{ messageID: firstMessage1ID, threadID: thread1ID }] =
      await Promise.all([createThreadViaGraphQL(recipient1, {})]);
    firstMessage = firstMessage1ID;

    const { messageID: firstReply } = await addMessageViaGraphQL(sender1, {
      threadID: thread1ID,
    });
    firstReplyToMessage = firstReply;

    await Promise.all([
      addReactionViaGraphQL(sender1, { messageID: firstMessage }),
    ]);

    await addMessageViaGraphQL(sender2, {
      threadID: thread1ID,
    });

    expect(await NotificationEntity.count()).toBe(4);
  });

  beforeEach(async () => {
    await NotificationEntity.update({ readStatus: 'unread' }, { where: {} });
  });

  test('mark reply as read marks just that notif', async () => {
    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(3);

    expect(await countNotifEntities(sender1.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(sender1.userID!, 'unread')).toBe(1);
    expect(await unreadNotificationCountViaGraphQL(sender1)).toBe(1);

    // Recipient reads the first reply
    await markAsRead(recipient1, firstReplyToMessage);

    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(1);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(2);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(2);

    // Sender numbers don't change
    expect(await countNotifEntities(sender1.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(sender1.userID!, 'unread')).toBe(1);
    expect(await unreadNotificationCountViaGraphQL(sender1)).toBe(1);

    // Sender reads the first message
    await markAsRead(sender1, firstMessage);

    // Recipient numbers don't change
    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(1);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(2);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(2);

    expect(await countNotifEntities(sender1.userID!, 'read')).toBe(1);
    expect(await countNotifEntities(sender1.userID!, 'unread')).toBe(0);
    expect(await unreadNotificationCountViaGraphQL(sender1)).toBe(0);
  });
});
