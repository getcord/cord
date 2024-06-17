import { v4 as uuid } from 'uuid';
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
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

let user: UserEntity;
let application: ApplicationEntity;
let accessToken: string;

describe('Test filtering notifications', () => {
  let viewer: Viewer;
  let viewerInOrg2: Viewer;

  let org: OrgEntity;
  let org2: OrgEntity;

  let location: PageEntity;
  let location2: PageEntity;

  let sender1: Viewer;
  let sender2: Viewer;
  let org2Sender1: Viewer;
  let org2Sender2: Viewer;

  beforeAll(async () => {
    ({ application, accessToken } = await setupPlatformTest());

    org = await createRandomPlatformOrg(application.id);
    // nothing we can do with org here as the viewer can only belong to one org
    org2 = await createRandomPlatformOrg(application.id);
    location = await PageEntity.create({
      orgID: org2.id,
      contextData: { page: 'foo' },
      contextHash: uuid(),
    });
    location2 = await PageEntity.create({
      orgID: org2.id,
      contextData: { page: 'bar' },
      contextHash: uuid(),
    });
    const [
      viewerUser,
      sender1User,
      sender2User,
      org2Sender2user,
      org2Sender1User,
    ] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org2.id),
      createRandomPlatformUserAndOrgMember(application.id, org2.id),
    ]);
    user = viewerUser;
    // viewer is active in 2 orgs
    await OrgMembersEntity.create({
      userID: user.id,
      orgID: org2.id,
    });

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: viewerUser,
      org,
    });
    viewerInOrg2 = await Viewer.createLoggedInPlatformViewer({
      user: viewerUser,
      org: org2,
    });

    sender1 = await Viewer.createLoggedInPlatformViewer({
      user: sender1User,
      org,
    });
    sender2 = await Viewer.createLoggedInPlatformViewer({
      user: sender2User,
      org,
    });
    org2Sender1 = await Viewer.createLoggedInPlatformViewer({
      user: org2Sender1User,
      org: org2,
    });
    org2Sender2 = await Viewer.createLoggedInPlatformViewer({
      user: org2Sender2user,
      org: org2,
    });

    // create threads in multiple locations and orgs
    const [
      { threadID, messageID },
      { threadID: threadID2, messageID: messageID2 },
      { threadID: threadID3, messageID: messageID3 },
    ] = await Promise.all([
      createThreadViaGraphQL(viewer, {}),
      createThreadViaGraphQL(viewerInOrg2, {
        location: location.contextData,
      }),
      createThreadViaGraphQL(viewerInOrg2, {
        location: location2.contextData,
      }),
    ]);

    await Promise.all([
      addMessageViaGraphQL(sender1, { threadID }),
      addMessageViaGraphQL(sender2, { threadID }),
      addMessageViaGraphQL(org2Sender1, {
        threadID: threadID2,
        location: location.contextData,
      }),
      addMessageViaGraphQL(org2Sender1, {
        threadID: threadID2,
        location: location.contextData,
      }),
      addMessageViaGraphQL(org2Sender2, {
        threadID: threadID3,
        location: location2.contextData,
      }),
    ]);

    await Promise.all([
      // these first 2 would become one in the first test
      addReactionViaGraphQL(sender1, { messageID }),
      addReactionViaGraphQL(sender2, { messageID }),
      addReactionViaGraphQL(org2Sender1, {
        messageID: messageID2,
      }),
      addReactionViaGraphQL(org2Sender2, {
        messageID: messageID3,
      }),
    ]);

    // where recipient
    expect(
      await NotificationEntity.count({ where: { recipientID: viewerUser.id } }),
    ).toBe(9);
  });

  test('fetch all notifs', async () => {
    const result = await fetchNotificationsViaGraphQL(viewer, {});
    expect(result.nodes.length).toBe(8);
    expect(result.paginationInfo.hasNextPage).toBe(false);
  });

  test('fetch notifs with metadata filter where no notifs match the filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { foo: 'bar' },
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    });
    expect(page.nodes.length).toBe(0);
  });

  test('fetch notifs with location filter where no notifs match the filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: undefined,
        location: { page: 'baz' },
        partialMatch: true,
        organizationID: undefined,
      },
    });
    expect(page.nodes.length).toBe(0);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: undefined,
        location: {},
        partialMatch: false,
        organizationID: undefined,
      },
    });
    expect(page2.nodes.length).toBe(0);
  });

  test('fetch notifs with location filter where the preset notif matches the filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewerInOrg2, {
      filter: {
        metadata: undefined,
        location: { page: 'foo' },
        partialMatch: true,
        organizationID: undefined,
      },
    });
    expect(page.nodes.length).toBe(3);
  });

  test('fetch notifs with org filter where the preset notif matches the filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewerInOrg2, {
      filter: {
        metadata: undefined,
        location: undefined,
        partialMatch: undefined,
        organizationID: org2.externalID,
      },
    });
    expect(page.nodes.length).toBe(5);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: undefined,
        location: undefined,
        partialMatch: undefined,
        organizationID: org.externalID,
      },
    });
    expect(page2.nodes.length).toBe(3);
  });

  test('fetch notifs where org and location matches the filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewerInOrg2, {
      filter: {
        metadata: undefined,
        location: { page: 'bar' },
        partialMatch: false,
        organizationID: org2.externalID,
      },
    });
    expect(page.nodes.length).toBe(2);
  });

  test('fetch notifs with matching org but not location filter', async () => {
    const page = await fetchNotificationsViaGraphQL(viewerInOrg2, {
      filter: {
        metadata: undefined,
        location: { page: 'baz' },
        partialMatch: true,
        organizationID: org2.externalID,
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

  // todo: move this into a test.each()
  // also checkin with privacy team on relevance of the org/viewers separations
  test('fetch notifs with metadata, location and org filters', async () => {
    await NotificationEntity.truncate({ cascade: true });

    const { threadID: threadID2, messageID: messageID2 } =
      await createThreadViaGraphQL(viewerInOrg2, {
        location: location.contextData,
      });
    await addReactionViaGraphQL(org2Sender1, {
      messageID: messageID2,
    });
    await addMessageViaGraphQL(org2Sender1, {
      threadID: threadID2,
    });

    const { threadID: threadID3, messageID: messageID3 } =
      await createThreadViaGraphQL(viewerInOrg2, {
        location: location2.contextData,
      });
    await addReactionViaGraphQL(org2Sender2, {
      messageID: messageID3,
    });
    await addMessageViaGraphQL(org2Sender2, {
      threadID: threadID3,
    });

    const { threadID, messageID } = await createThreadViaGraphQL(viewer, {});
    await addMessageViaGraphQL(sender1, { threadID });
    await addReactionViaGraphQL(sender1, { messageID });

    const page0 = await fetchNotificationsViaGraphQL(viewerInOrg2, {
      filter: {
        metadata: { bar: 'baz' },
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    });
    expect(page0.nodes.length).toBe(0);

    // this will return the latest notifications first
    const page = await fetchNotificationsViaGraphQL(viewer, { first: 5 });
    expect(page.nodes.length).toBe(5);
    const iDsToUpdate = page.nodes.map((node) => node.externalID);
    await NotificationEntity.update(
      { metadata: { bar: 'baz' } },
      { where: { externalID: iDsToUpdate } },
    );

    const page1 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    });
    expect(page1.nodes.length).toBe(5);

    const page2 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: location.pageContext.data,
        partialMatch: true,
        organizationID: undefined,
      },
    });
    expect(page2.nodes.length).toBe(1);

    const page3 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: location2.pageContext.data,
        partialMatch: true,
        organizationID: undefined,
      },
    });
    expect(page3.nodes.length).toBe(2);

    const page4 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: undefined,
        partialMatch: undefined,
        organizationID: org.externalID,
      },
    });
    expect(page4.nodes.length).toBe(2);

    const page5 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: undefined,
        partialMatch: undefined,
        organizationID: org2.externalID,
      },
    });
    expect(page5.nodes.length).toBe(3);

    const page6 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: location.pageContext.data,
        partialMatch: true,
        organizationID: org.externalID,
      },
    });
    expect(page6.nodes.length).toBe(0);

    const page7 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'baz' },
        location: location.pageContext.data,
        partialMatch: true,
        organizationID: org2.externalID,
      },
    });
    expect(page7.nodes.length).toBe(1);

    const page8 = await fetchNotificationsViaGraphQL(viewer, {
      filter: {
        metadata: { bar: 'bazz' },
        location: location.pageContext.data,
        partialMatch: true,
        organizationID: org.externalID,
      },
    });
    expect(page8.nodes.length).toBe(0);
  });
});
