import type { UUID } from 'common/types/index.ts';
// eslint-disable-next-line import/no-restricted-paths
import { DeleteNotificationMutation } from 'external/src/graphql/operations.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import {
  addMessageViaGraphQL,
  addReactionViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

let applicationID: UUID;
let orgID: UUID;
let recipient: Viewer;

async function deleteNotif(
  viewer: Viewer,
  notificationID: string,
  byExternalID: boolean,
) {
  const result = await executeGraphQLOperation({
    query: DeleteNotificationMutation,
    variables: { notificationID, byExternalID },
    viewer,
  });

  return !!result.data?.deleteNotification.success;
}

describe('Test deleting notifications', () => {
  // Use beforeEach so we reset everything between test cases, to make it
  // easier to check we aren't deleting too many things.
  beforeEach(async () => {
    await NotificationEntity.truncate();
    const application = await createPlatformApplication();
    applicationID = application.id;
    const org = await createRandomPlatformOrg(application.id);
    orgID = org.id;

    // Data configuration:
    // - Recipient creates a thread.
    // - Sender1 replies to it.
    // - Sender1 and Sender2 react to the first message.
    const [recipientUser, sender1User, sender2User] = await Promise.all([
      createRandomPlatformUserAndOrgMember(applicationID, orgID),
      createRandomPlatformUserAndOrgMember(applicationID, orgID),
      createRandomPlatformUserAndOrgMember(applicationID, orgID),
    ]);

    recipient = await Viewer.createLoggedInPlatformViewer({
      user: recipientUser,
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

    const { messageID: firstMessageID, threadID: threadID } =
      await createThreadViaGraphQL(recipient, {});
    await Promise.all([
      addMessageViaGraphQL(sender1, { threadID }),
      addReactionViaGraphQL(sender1, { messageID: firstMessageID }),
      addReactionViaGraphQL(sender2, { messageID: firstMessageID }),
    ]);

    expect(await NotificationEntity.count()).toBe(3);
  });

  test('delete unaggregated notif', async () => {
    const reply = await NotificationEntity.findOne({
      where: { recipientID: recipient.userID, type: 'reply' },
    });
    expect(reply).not.toBeNull();

    const replyID = reply!.id;
    expect(await deleteNotif(recipient, replyID, false)).toBe(true);

    expect(await NotificationEntity.findByPk(replyID)).toBeNull();
    expect(
      await NotificationEntity.findOne({
        where: { recipientID: recipient.userID, type: 'reply' },
      }),
    ).toBeNull();
    expect(await NotificationEntity.count()).toBe(2);
  });

  test('delete aggregated notif', async () => {
    const reaction = await NotificationEntity.findOne({
      where: { recipientID: recipient.userID, type: 'reaction' },
    });
    expect(reaction).not.toBeNull();

    expect(await deleteNotif(recipient, reaction!.id, false)).toBe(true);

    expect(
      await NotificationEntity.findOne({
        where: { recipientID: recipient.userID, type: 'reaction' },
      }),
    ).toBeNull();
    expect(await NotificationEntity.count()).toBe(1);
  });

  test('cannot delete a notif that is not yours', async () => {
    const notif = await NotificationEntity.findOne({
      where: { recipientID: recipient.userID },
    });
    expect(notif).not.toBeNull();

    const randoUser = await createRandomPlatformUserAndOrgMember(
      applicationID,
      orgID,
    );
    const rando = Viewer.createLoggedInViewer(randoUser.id, orgID);

    expect(await deleteNotif(rando, notif!.id, false)).toBe(false);
    expect(await NotificationEntity.count()).toBe(3);
  });

  test('delete unaggregated notif by external id', async () => {
    const reply = await NotificationEntity.findOne({
      where: { recipientID: recipient.userID, type: 'reply' },
    });
    expect(reply).not.toBeNull();

    const replyID = reply!.id;
    const replyExternalID = reply!.externalID;
    expect(await deleteNotif(recipient, replyExternalID, true)).toBe(true);

    expect(await NotificationEntity.findByPk(replyID)).toBeNull();
    expect(
      await NotificationEntity.findOne({
        where: { recipientID: recipient.userID, type: 'reply' },
      }),
    ).toBeNull();
    expect(await NotificationEntity.count()).toBe(2);
  });

  test('delete aggregated notif by external id', async () => {
    const reaction = await NotificationEntity.findOne({
      where: { recipientID: recipient.userID, type: 'reaction' },
    });
    expect(reaction).not.toBeNull();

    expect(await deleteNotif(recipient, reaction!.externalID, true)).toBe(true);

    expect(
      await NotificationEntity.findOne({
        where: { recipientID: recipient.userID, type: 'reaction' },
      }),
    ).toBeNull();
    expect(await NotificationEntity.count()).toBe(1);
  });

  test('cannot delete a notif that is not yours by external id', async () => {
    const notif = await NotificationEntity.findOne({
      where: { recipientID: recipient.userID },
    });
    expect(notif).not.toBeNull();

    const randoUser = await createRandomPlatformUserAndOrgMember(
      applicationID,
      orgID,
    );
    const rando = Viewer.createLoggedInViewer(randoUser.id, orgID);

    expect(await deleteNotif(rando, notif!.externalID, true)).toBe(false);
    expect(await NotificationEntity.count()).toBe(3);
  });
});
