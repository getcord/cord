import { Viewer } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import {
  addMessageViaGraphQL,
  addReactionViaGraphQL,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { fetchNotificationsViaGraphQL } from 'server/src/notifications/tests/utils.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

let user: UserEntity;
let viewer: Viewer;
let application: ApplicationEntity;
let accessToken: string;

describe('Test paginating notifications', () => {
  beforeAll(async () => {
    ({ application, accessToken } = await setupPlatformTest());

    const org = await createRandomPlatformOrg(application.id);

    const [viewerUser, sender1User, sender2User] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);
    user = viewerUser;

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: viewerUser,
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

    // The order matters here, as does doing these serially, not in a
    // Promise.all -- we are paginating through these and so care which ones
    // come in which order.
    const { threadID, messageID } = await createThreadViaGraphQL(viewer, {});
    await addMessageViaGraphQL(sender1, { threadID });
    await addReactionViaGraphQL(sender1, { messageID });
    await addReactionViaGraphQL(sender2, { messageID });
    await addMessageViaGraphQL(sender2, { threadID });

    // where recipient
    expect(
      await NotificationEntity.count({ where: { recipientID: viewerUser.id } }),
    ).toBe(4);
  });

  test('fetch all notifs', async () => {
    const result = await fetchNotificationsViaGraphQL(viewer, {});
    expect(result.nodes.length).toBe(3);
    expect(result.paginationInfo.hasNextPage).toBe(false);
  });

  test('fetch first notif then rest', async () => {
    const page1 = await fetchNotificationsViaGraphQL(viewer, { first: 1 });
    expect(page1.nodes.length).toBe(1);
    expect(page1.paginationInfo.hasNextPage).toBe(true);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      after: page1.paginationInfo.endCursor,
    });
    expect(page2.nodes.length).toBe(2);
    expect(page2.paginationInfo.hasNextPage).toBe(false);
  });

  test('fetch aggregated notif then rest', async () => {
    // Ask for 3 notifs but only get 2, since this translates directly into DB
    // rows and then two get aggregated into one notif. If that is ever fixed,
    // this test should be adjusted to first:2 to grab the reply and then
    // aggregated notif (the idea of the test is that the endCursor is from the
    // aggregated notif).
    const page1 = await fetchNotificationsViaGraphQL(viewer, { first: 3 });
    expect(page1.nodes.length).toBe(2);
    expect(page1.paginationInfo.hasNextPage).toBe(true);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      after: page1.paginationInfo.endCursor,
    });
    expect(page2.nodes.length).toBe(1);
    expect(page2.paginationInfo.hasNextPage).toBe(false);
  });

  test('fetch exactly as many notifs as there are', async () => {
    // Same issue as above with aggregation / DB counts.
    const page1 = await fetchNotificationsViaGraphQL(viewer, { first: 4 });
    expect(page1.nodes.length).toBe(3);

    // Unclear if this is the right response (it probably is not, there are no
    // more notifs). See comment above definition of hasNextPage in
    // queries/notifications.ts
    expect(page1.paginationInfo.hasNextPage).toBe(true);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      first: 1,
      after: page1.paginationInfo.endCursor,
    });
    expect(page2.nodes.length).toBe(0);
    expect(page2.paginationInfo.hasNextPage).toBe(false);
  });

  test('fetch notifs with metadata filter where no notifs match the filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewer, {
      first: 4,
      filter: {
        metadata: { foo: 'bar' },
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    });
    expect(page.nodes.length).toBe(0);
  });

  test('fetch notifs with metadata filter where some notifs match the filter', async () => {
    // Post a notification that specifies the metadata we are filtering on.
    const { statusCode } = await apiCall()
      .post('/v1/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actor_id: user.externalID,
        recipient_id: user.externalID,
        template: '{{actor}} says hello',
        type: 'url',
        url: 'http://www.example.com/',
        metadata: { foo: 'bar' },
      });
    expect(statusCode).toBe(200);

    const page1 = await fetchNotificationsViaGraphQL(viewer, {
      first: 4,
      filter: {
        metadata: { foo: 'bar' },
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    });
    expect(page1.nodes.length).toBe(1);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      first: 4,
      filter: {
        metadata: { foo: 'baz' },
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    });
    expect(page2.nodes.length).toBe(0);
  });
});
