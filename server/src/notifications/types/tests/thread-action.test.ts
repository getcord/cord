import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  resolveThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
// eslint-disable-next-line import/no-restricted-paths
import { SetSubscribedMutation } from 'external/src/graphql/operations.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';

let applicationID: UUID;
let org: OrgEntity;

let threadAuthor: Viewer;
let threadActor: Viewer;
let threadReplyer: Viewer;

let threadID: UUID;

describe('Test notifications from resolving/unresolving a thread', () => {
  beforeAll(async () => {
    applicationID = (await createPlatformApplication()).id;
    org = await createRandomPlatformOrg(applicationID);

    const [threadAuthorUser, threadActorUser, threadReplyerUser] =
      await Promise.all([
        createRandomPlatformUserAndOrgMember(applicationID, org.id),
        createRandomPlatformUserAndOrgMember(applicationID, org.id),
        createRandomPlatformUserAndOrgMember(applicationID, org.id),
      ]);
    threadAuthor = await Viewer.createLoggedInPlatformViewer({
      user: threadAuthorUser,
      org,
    });
    threadActor = await Viewer.createLoggedInPlatformViewer({
      user: threadActorUser,
      org,
    });

    threadReplyer = await Viewer.createLoggedInPlatformViewer({
      user: threadReplyerUser,
      org,
    });
  });

  beforeEach(async () => {
    // create thread before each test so we can resolve it separately
    ({ threadID } = await createThreadViaGraphQL(threadAuthor, {}));
    await NotificationEntity.truncate({ cascade: true });
  });

  test('actor has no notif', async () => {
    await resolveThreadViaGraphQL(threadActor, { threadID });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadActor);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(0);
  });

  test('all thread participants get notifs', async () => {
    await addMessageViaGraphQL(threadReplyer, {
      threadID,
    });
    await resolveThreadViaGraphQL(threadActor, { threadID });

    const { nodes: authorNotifs } =
      await fetchNotificationsViaGraphQL(threadAuthor);
    expect(authorNotifs).not.toBeNull();
    // 2 notifs: 1 from reply and the other from resolve
    expect(authorNotifs.length).toBe(2);

    const { nodes: replierNotifs } =
      await fetchNotificationsViaGraphQL(threadReplyer);
    expect(replierNotifs).not.toBeNull();
    expect(replierNotifs.length).toBe(1);

    const replierNotif = replierNotifs[0];
    expect(replierNotif.senders[0].id).toBe(threadActor.userID);
    expect(
      replierNotif.attachment?.__typename === 'NotificationThreadAttachment' &&
        replierNotif.attachment.thread.id,
    ).toBe(threadID);
    expect(
      replierNotif.header[1].__typename === 'NotificationHeaderTextNode' &&
        replierNotif.header[1].text,
    ).toContain('resolved');
    expect(replierNotif.readStatus).toBe('unread');
  });

  test('non-participant has no notif', async () => {
    await resolveThreadViaGraphQL(threadActor, { threadID });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadReplyer);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(0);
  });

  test('subscribed user gets notif', async () => {
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

    await resolveThreadViaGraphQL(threadActor, { threadID });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(rando);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(1);

    const notif = notifs[0];
    expect(notif.senders[0].id).toBe(threadActor.userID);
    expect(
      notif.attachment?.__typename === 'NotificationThreadAttachment' &&
        notif.attachment.thread.id,
    ).toBe(threadID);
  });

  test('unsubscribed user has no notif', async () => {
    await addMessageViaGraphQL(threadReplyer, {
      threadID,
    });

    const result = await executeGraphQLOperation({
      query: SetSubscribedMutation,
      variables: {
        threadID,
        subscribed: false,
      },
      viewer: threadReplyer,
    });
    expect(result.data?.setSubscribed).toBe(true);

    await resolveThreadViaGraphQL(threadActor, { threadID });

    const { nodes: notifs } = await fetchNotificationsViaGraphQL(threadReplyer);
    expect(notifs).not.toBeNull();
    expect(notifs.length).toBe(0);
  });
});
