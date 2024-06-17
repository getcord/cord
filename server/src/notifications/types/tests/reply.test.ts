import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
// eslint-disable-next-line import/no-restricted-paths
import { SetSubscribedMutation } from 'external/src/graphql/operations.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

let applicationID: UUID;
let org: OrgEntity;

let threadAuthor: Viewer;
let threadReplyer: Viewer;

let threadID: UUID;
let replyID: UUID;

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

    ({ messageID: replyID } = await addMessageViaGraphQL(threadReplyer, {
      threadID,
    }));
  });

  test('thread author has notif from replyer', async () => {
    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadAuthor);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(1);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(threadReplyer.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(replyID);
    expect(
      notif.header[1].__typename === 'NotificationHeaderTextNode' &&
        notif.header[1].text,
    ).toContain('replied');
    expect(notif.readStatus).toBe('unread');
  });

  test('replyer has no notif', async () => {
    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadReplyer);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(0);
  });

  test('author gets no notification if reply is deleted', async () => {
    const message = await MessageEntity.findByPk(replyID);
    expect(message).not.toBeNull();

    const replyerContext = await contextWithSession(
      { viewer: threadReplyer },
      getSequelize(),
      null,
      null,
    );

    const isDeleted = await new MessageMutator(
      threadReplyer,
      replyerContext.loaders,
    ).setDeleted(message!, true);

    expect(isDeleted).toBe(true);

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadAuthor);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(0);
  });

  test('subscribed user gets reply notif', async () => {
    const randoUser = await createRandomPlatformUserAndOrgMember(
      applicationID,
      org.id,
    );
    const rando = await Viewer.createLoggedInPlatformViewer({
      user: randoUser,
      org,
    });
    expect((await fetchNotificationsViaGraphQL(rando)).nodes.length).toBe(0);

    const result = await executeGraphQLOperation({
      query: SetSubscribedMutation,
      variables: {
        threadID,
        subscribed: true,
      },
      viewer: rando,
    });
    expect(result.data?.setSubscribed).toBe(true);

    const { messageID } = await addMessageViaGraphQL(threadReplyer, {
      threadID,
    });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(rando);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(1);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(threadReplyer.userID);
    expect(
      notif.attachment?.__typename === 'NotificationMessageAttachment' &&
        notif.attachment.message.id,
    ).toBe(messageID);
  });
});
