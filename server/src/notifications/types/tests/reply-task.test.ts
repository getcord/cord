import { v4 as uuid } from 'uuid';
import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  updateMessageViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

let applicationID: UUID;
let org: OrgEntity;

let threadAuthor: Viewer;
let threadReplyer: Viewer;

let threadID: UUID;

describe('Test notifications from replying to a thread', () => {
  beforeAll(async () => {
    applicationID = (await createPlatformApplication()).id;
    org = await createRandomPlatformOrg(applicationID);

    const [threadAuthorUser, threadReplyerUser] = await Promise.all([
      createRandomPlatformUserAndOrgMember(applicationID, org.id),
      createRandomPlatformUserAndOrgMember(applicationID, org.id),
    ]);

    threadAuthor = await Viewer.createLoggedInPlatformViewer({
      user: threadAuthorUser,
      org,
    });
    threadReplyer = await Viewer.createLoggedInPlatformViewer({
      user: threadReplyerUser,
      org,
    });

    ({ threadID } = await createThreadViaGraphQL(threadAuthor, {}));
  });

  beforeEach(async () => {
    await NotificationEntity.truncate();
  });

  test('thread author has notif from assigner', async () => {
    const { messageID } = await addMessageViaGraphQL(threadReplyer, {
      threadID,
      task: {
        id: uuid(),
        done: false,
        assigneeIDs: [threadAuthor.userID!],
        todos: [],
        doneStatusUpdate: undefined,
        type: 'cord',
      },
    });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadAuthor);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(1);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(threadReplyer.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
    expect(
      notif.header[1].__typename === 'NotificationHeaderTextNode' &&
        notif.header[1].text,
    ).toContain('assigned');
    expect(notif.readStatus).toBe('unread');
  });

  test('thread author has notif from unassigner', async () => {
    const partialTask = {
      id: uuid(),
      done: false,
      todos: [],
      doneStatusUpdate: undefined,
      type: 'cord' as const,
    };

    const { messageID } = await addMessageViaGraphQL(threadReplyer, {
      threadID,
      task: {
        ...partialTask,
        assigneeIDs: [threadAuthor.userID!],
      },
    });

    await updateMessageViaGraphQL(threadReplyer, {
      messageID,
      task: { ...partialTask, assigneeIDs: [] },
    });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadAuthor);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(2);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(threadReplyer.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
    expect(
      notif.header[1].__typename === 'NotificationHeaderTextNode' &&
        notif.header[1].text,
    ).toContain('unassigned');
    expect(notif.readStatus).toBe('unread');
  });
});
