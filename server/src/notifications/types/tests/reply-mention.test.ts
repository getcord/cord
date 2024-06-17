import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  updateMessageViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import {
  createMentionNode,
  createParagraphNode,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';

let mentioner: Viewer;
let mentionee: Viewer;
let threadID: UUID;
let replyID: UUID;
let reply2ID: UUID;

describe('Test notifications from replying to a thread', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [creatorUser, mentionerUser, mentioneeUser] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    const creator = await Viewer.createLoggedInPlatformViewer({
      user: creatorUser,
      org,
    });
    mentioner = await Viewer.createLoggedInPlatformViewer({
      user: mentionerUser,
      org,
    });
    mentionee = await Viewer.createLoggedInPlatformViewer({
      user: mentioneeUser,
      org,
    });

    ({ threadID } = await createThreadViaGraphQL(creator, {}));

    ({ messageID: replyID } = await addMessageViaGraphQL(mentioner, {
      threadID,
      content: [createMentionNode(mentioneeUser.externalID, 'Mentionee')],
    }));

    ({ messageID: reply2ID } = await addMessageViaGraphQL(mentioner, {
      threadID,
      content: [createParagraphNode('nothing here yet')],
    }));
  });

  test('message author has notif from mentioner', async () => {
    const { nodes: notifs } = await fetchNotificationsViaGraphQL(mentionee);
    expect(notifs).not.toBeNull();

    const notif = notifs[notifs.length - 1];
    expect(notif.senders[0].id).toBe(mentioner.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(replyID);
    expect(
      notif.header[1].__typename === 'NotificationHeaderTextNode' &&
        notif.header[1].text,
    ).toContain('mention');
    expect(notif.readStatus).toBe('unread');
  });

  test('updating message to mention sends notif', async () => {
    await updateMessageViaGraphQL(mentioner, {
      messageID: reply2ID,
      content: [createMentionNode(mentionee.userID!, 'Mentionee')],
    });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(mentionee);
    expect(notifs).not.toBeNull();
    // Original mention, reply, mention.
    // TODO(notifications) replace the reply with the second mention?
    expect(notifs.length).toBe(3);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(mentioner.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(reply2ID);
    expect(
      notif.header[1].__typename === 'NotificationHeaderTextNode' &&
        notif.header[1].text,
    ).toContain('mention');
  });

  test('mentioner has no notif', async () => {
    const { nodes: notifs } = await fetchNotificationsViaGraphQL(mentioner);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(0);
  });

  test('mentioning in initial message sends notif', async () => {
    await NotificationEntity.truncate();
    const { messageID } = await createThreadViaGraphQL(mentioner, {
      content: [createMentionNode(mentionee.externalUserID!, 'Mentionee')],
    });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(mentionee);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(1);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(mentioner.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
    expect(
      notif.header[1].__typename === 'NotificationHeaderTextNode' &&
        notif.header[1].text,
    ).toContain('mention');
  });
});
