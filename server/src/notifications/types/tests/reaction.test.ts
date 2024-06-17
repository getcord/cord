import { Viewer } from 'server/src/auth/index.ts';
import {
  addReactionViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import type { UUID } from 'common/types/index.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import { MessageReactionEntity } from 'server/src/entity/message_reaction/MessageReactionEntity.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

// eslint-disable-next-line import/no-restricted-paths
import { UpdateMessageByExternalIDMutation } from 'external/src/graphql/operations.ts';

let threadAuthor: Viewer;
let reactor1: Viewer;
let reactor2: Viewer;
let reactor3: Viewer;
let threadID: UUID;
let messageID: UUID;

async function getNotif(viewer: Viewer) {
  const { nodes: notifs } = await fetchNotificationsViaGraphQL(viewer);
  expect(notifs).not.toBeNull();
  expect(notifs.length).toBe(1);

  return notifs[0];
}

describe('Test notifications from reacting to a message', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [threadAuthorUser, reactor1User, reactor2User, reactor3User] =
      await Promise.all([
        createRandomPlatformUserAndOrgMember(application.id, org.id),
        createRandomPlatformUserAndOrgMember(application.id, org.id),
        createRandomPlatformUserAndOrgMember(application.id, org.id),
        createRandomPlatformUserAndOrgMember(application.id, org.id),
      ]);

    threadAuthor = await Viewer.createLoggedInPlatformViewer({
      user: threadAuthorUser,
      org,
    });
    reactor1 = await Viewer.createLoggedInPlatformViewer({
      user: reactor1User,
      org,
    });
    reactor2 = await Viewer.createLoggedInPlatformViewer({
      user: reactor2User,
      org,
    });
    reactor3 = await Viewer.createLoggedInPlatformViewer({
      user: reactor3User,
      org,
    });

    ({ threadID, messageID } = await createThreadViaGraphQL(threadAuthor, {}));
  });

  beforeEach(async () => {
    await MessageReactionEntity.truncate({ cascade: true });
    await NotificationEntity.truncate({ cascade: true });
  });

  test('thread author has notif from reactor', async () => {
    await addReactionViaGraphQL(reactor1, { messageID });

    const notif = await getNotif(threadAuthor);
    expect(notif.senders.length).toBe(1);
    expect(notif.senders[0].id).toBe(reactor1.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
    expect(notif.readStatus).toBe('unread');

    const header = notif.header;
    expect(header.length).toBe(2);
    expect(
      header[0].__typename === 'NotificationHeaderUserNode' &&
        header[0].user.id,
    ).toBe(reactor1.userID);
    expect(header[1].__typename).toBe('NotificationHeaderTextNode');
  });

  test('thread author has aggregated notif from two reactors', async () => {
    await addReactionViaGraphQL(reactor1, { messageID });
    await addReactionViaGraphQL(reactor2, { messageID });

    const notif = await getNotif(threadAuthor);
    expect(notif.senders.length).toBe(2);
    expect(notif.senders[0].id).toBe(reactor2.userID);
    expect(notif.senders[1].id).toBe(reactor1.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
    expect(notif.readStatus).toBe('unread');

    const header = notif.header;
    expect(header.length).toBe(4);
    expect(
      header[0].__typename === 'NotificationHeaderUserNode' &&
        header[0].user.id,
    ).toBe(reactor2.userID);
    expect(header[1].__typename).toBe('NotificationHeaderTextNode');
    expect(
      header[2].__typename === 'NotificationHeaderUserNode' &&
        header[2].user.id,
    ).toBe(reactor1.userID);
    expect(header[3].__typename).toBe('NotificationHeaderTextNode');
  });

  test('header of aggregated notif with 3 reactors says "and N more"', async () => {
    await addReactionViaGraphQL(reactor1, { messageID });
    await addReactionViaGraphQL(reactor2, { messageID });
    await addReactionViaGraphQL(reactor3, { messageID });

    const notif = await getNotif(threadAuthor);
    const header = notif.header;
    expect(header.length).toBe(3);
    expect(
      header[0].__typename === 'NotificationHeaderUserNode' &&
        header[0].user.id,
    ).toBe(reactor3.userID);
    expect(
      header[1].__typename === 'NotificationHeaderTextNode' && header[1].text,
    ).toContain('2 others');
    expect(header[2].__typename).toBe('NotificationHeaderTextNode');
  });

  test('Reacting via update message creates notif', async () => {
    const [thread, message] = await Promise.all([
      ThreadEntity.findByPk(threadID),
      MessageEntity.findByPk(messageID),
    ]);

    const result = await executeGraphQLOperation({
      query: UpdateMessageByExternalIDMutation,
      variables: {
        input: {
          externalThreadID: thread!.externalID,
          externalMessageID: message!.externalID,
          addReactions: ['!'],
        },
      },
      viewer: reactor1,
    });

    expect(result.data?.updateMessageByExternalID.success).toBe(true);
    expect(await MessageReactionEntity.count()).toBe(1);

    const notif = await getNotif(threadAuthor);
    expect(notif.senders.length).toBe(1);
    expect(notif.senders[0].id).toBe(reactor1.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
    expect(notif.readStatus).toBe('unread');
  });

  test('Reacting to own message does not create notif', async () => {
    await addReactionViaGraphQL(threadAuthor, { messageID });
    expect(await NotificationEntity.count()).toBe(0);
  });
});
