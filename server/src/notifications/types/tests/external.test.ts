import * as jsonwebtoken from 'jsonwebtoken';
import { Viewer } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let sender: Viewer;
let recipient: Viewer;

const SECRET = 'secret';
const EXAMPLE_URL = 'https://www.example.com/';
const TEXT = 'ate a sandwich stolen from';

describe('Test notification sent via REST API', () => {
  beforeAll(async () => {
    const app = await createPlatformApplication('cool test app', SECRET);
    const org = await createRandomPlatformOrg(app.id);

    const [senderUser, recipientUser] = await Promise.all([
      createRandomPlatformUserAndOrgMember(app.id, org.id),
      createRandomPlatformUserAndOrgMember(app.id, org.id),
    ]);

    sender = await Viewer.createLoggedInPlatformViewer({
      user: senderUser,
      org,
    });
    recipient = await Viewer.createLoggedInPlatformViewer({
      user: recipientUser,
      org,
    });

    const token = jsonwebtoken.sign({ app_id: app.id }, SECRET, {
      algorithm: 'HS512',
    });

    const { body } = await apiCall()
      .post('/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        actor_id: senderUser.externalID,
        recipient_id: recipientUser.externalID,
        template: `{{actor}} ${TEXT} {{recipient}}`,
        url: EXAMPLE_URL,
        type: 'url',
      });

    expect(body.success).toBe(true);
  });

  test('recipient has a notif', async () => {
    const { nodes: notifs } = await fetchNotificationsViaGraphQL(recipient);
    expect(notifs.length).toBe(1);

    const notif = notifs[0];
    expect(notif.senders.length).toBe(1);
    expect(notif.senders[0].id).toBe(sender.userID);
    expect(
      notif.attachment?.__typename === 'NotificationURLAttachment' &&
        notif.attachment.url,
    ).toBe(EXAMPLE_URL);
    expect(notif.readStatus).toBe('unread');
  });

  test('notif header is correct', async () => {
    const { nodes: notifs } = await fetchNotificationsViaGraphQL(recipient);
    const header = notifs[0].header;

    expect(header.length).toBe(3);
    expect(
      header[0].__typename === 'NotificationHeaderUserNode' &&
        header[0].user.id,
    ).toBe(sender.userID);
    expect(
      header[1].__typename === 'NotificationHeaderTextNode' && header[1].text,
    ).toBe(` ${TEXT} `);
    expect(
      header[2].__typename === 'NotificationHeaderUserNode' &&
        header[2].user.id,
    ).toBe(recipient.userID);
  });

  test('only one notif was sent', async () => {
    expect(await NotificationEntity.count()).toBe(1);
  });
});
