import {
  MarkNotificationAsReadMutation,
  MarkAllNotificationsAsReadMutation,
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

let recipient1: Viewer;
let recipient2: Viewer;

async function markAsRead(
  viewer: Viewer,
  notificationID: UUID,
  byExternalID = false,
) {
  const result = await executeGraphQLOperation({
    query: MarkNotificationAsReadMutation,
    variables: { notificationID, byExternalID },
    viewer,
  });

  expect(result.data?.markNotificationAsRead.success).toBe(true);
}

async function markAllAsRead(viewer: Viewer) {
  const result = await executeGraphQLOperation({
    query: MarkAllNotificationsAsReadMutation,
    variables: {},
    viewer,
  });

  expect(result.data?.markAllNotificationsAsRead.success).toBe(true);
}

async function countNotifEntities(
  recipientID: UUID,
  readStatus: NotificationReadStatus,
) {
  return await NotificationEntity.count({ where: { recipientID, readStatus } });
}

describe('Test marking notifications as read', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    // Data configuration:
    // - Recipient1 and Recipient2 each create a thread.
    // - Sender1 replies to both threads.
    // - Sender1 and Sender2 react to the first message of each thread.
    const [recipient1User, recipient2User, sender1User, sender2User] =
      await Promise.all([
        createRandomPlatformUserAndOrgMember(application.id, org.id),
        createRandomPlatformUserAndOrgMember(application.id, org.id),
        createRandomPlatformUserAndOrgMember(application.id, org.id),
        createRandomPlatformUserAndOrgMember(application.id, org.id),
      ]);

    recipient1 = await Viewer.createLoggedInPlatformViewer({
      user: recipient1User,
      org,
    });
    recipient2 = await Viewer.createLoggedInPlatformViewer({
      user: recipient2User,
      org,
    });
    const sender1 = await Viewer.createLoggedInPlatformViewer({
      user: sender1User,
      org,
    });
    const sender2 = await Viewer.createLoggedInPlatformViewer({
      user: sender2User,
      org,
    });

    const [
      { messageID: firstMessage1ID, threadID: thread1ID },
      { messageID: firstMessage2ID, threadID: thread2ID },
    ] = await Promise.all([
      createThreadViaGraphQL(recipient1, {}),
      createThreadViaGraphQL(recipient2, {}),
    ]);

    await Promise.all([
      addMessageViaGraphQL(sender1, { threadID: thread1ID }),
      addMessageViaGraphQL(sender1, { threadID: thread2ID }),
    ]);

    await Promise.all([
      addReactionViaGraphQL(sender1, { messageID: firstMessage1ID }),
      addReactionViaGraphQL(sender2, { messageID: firstMessage1ID }),
      addReactionViaGraphQL(sender1, { messageID: firstMessage2ID }),
      addReactionViaGraphQL(sender2, { messageID: firstMessage2ID }),
    ]);

    expect(await NotificationEntity.count()).toBe(6);
  });

  beforeEach(async () => {
    await NotificationEntity.update({ readStatus: 'unread' }, { where: {} });
  });

  test('mark reply as read marks just that notif', async () => {
    const reply = await NotificationEntity.findOne({
      where: { recipientID: recipient1.userID, type: 'reply' },
    });
    expect(reply).not.toBeNull();

    await markAsRead(recipient1, reply!.id);

    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(1);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(2);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(1);
    expect(await countNotifEntities(recipient2.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient2.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient2)).toBe(2);
  });

  test('mark reaction as read marks all aggregates', async () => {
    const notif = await NotificationEntity.findOne({
      where: { recipientID: recipient1.userID, type: 'reaction' },
    });
    expect(notif).not.toBeNull();

    await markAsRead(recipient1, notif!.id);

    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(2);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(1);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(1);
    expect(await countNotifEntities(recipient2.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient2.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient2)).toBe(2);
  });

  test('mark all as read marks all as read', async () => {
    await markAllAsRead(recipient1);
    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(3);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(0);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(0);
    expect(await countNotifEntities(recipient2.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient2.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient2)).toBe(2);
  });

  test('cannot mark another recipient notif as read', async () => {
    const notif = await NotificationEntity.findOne({
      where: { recipientID: recipient2.userID },
    });

    const result = await executeGraphQLOperation({
      query: MarkNotificationAsReadMutation,
      variables: { notificationID: notif!.id, byExternalID: false },
      viewer: recipient1,
    });

    expect(result.data?.markNotificationAsRead.success).toBe(false);
    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(2);
    expect(await countNotifEntities(recipient2.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient2.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient2)).toBe(2);
  });

  test('can mark as read by external ID', async () => {
    const reply = await NotificationEntity.findOne({
      where: { recipientID: recipient1.userID, type: 'reply' },
    });
    expect(reply).not.toBeNull();

    await markAsRead(recipient1, reply!.externalID, true);

    expect(await countNotifEntities(recipient1.userID!, 'read')).toBe(1);
    expect(await countNotifEntities(recipient1.userID!, 'unread')).toBe(2);
    expect(await unreadNotificationCountViaGraphQL(recipient1)).toBe(1);
    expect(await countNotifEntities(recipient2.userID!, 'read')).toBe(0);
    expect(await countNotifEntities(recipient2.userID!, 'unread')).toBe(3);
    expect(await unreadNotificationCountViaGraphQL(recipient2)).toBe(2);
  });
});
