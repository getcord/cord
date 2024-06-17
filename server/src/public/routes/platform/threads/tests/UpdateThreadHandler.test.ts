import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessage,
  addMessageViaGraphQL,
  addReactionViaGraphQL,
  createPage,
  createThread,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import {
  apiCall,
  executeGraphQLOperation,
} from 'server/src/tests/setupEnvironment.ts';

// eslint-disable-next-line import/no-restricted-paths
import type { ThreadFragment } from 'external/src/graphql/operations.ts';
// eslint-disable-next-line import/no-restricted-paths
import { Thread2Query } from 'external/src/graphql/operations.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

let andreiUser: UserEntity;
let flooeyUser: UserEntity;
let nimrodUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let accessToken: string;

let viewer2: Viewer;
let organization2: OrgEntity;

describe('Platform API: PUT /v1/threads/:threadID', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });

    [nimrodUser, flooeyUser] = await Promise.all([
      createUserAndOrgMember({
        name: 'Nimrod',
        externalID: 'nimrod',
        appID: organization.platformApplicationID!,
        email: 'nimrod@example.com',
        orgID: organization.id,
        externalProvider: AuthProviderType.PLATFORM,
      }),
      createUserAndOrgMember({
        name: 'Flooey',
        externalID: 'flooey',
        appID: organization.platformApplicationID!,
        email: 'flooey@example.com',
        orgID: organization.id,
        externalProvider: AuthProviderType.PLATFORM,
      }),
    ]);

    organization2 = await OrgEntity.create({
      state: 'active',
      name: 'Second Org',
      externalID: 'secondorg',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: organization.platformApplicationID,
    });

    const organization2User = await createUserAndOrgMember({
      name: 'Second Org User',
      externalID: 'secondorguser',
      appID: organization2.platformApplicationID!,
      email: 'user2@example.com',
      orgID: organization2.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    viewer2 = await Viewer.createLoggedInPlatformViewer({
      user: organization2User,
      org: organization2,
    });
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('invalid access token', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('update externalID', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const newExternalID = 'some-better-name';
    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ id: newExternalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    expect(await ThreadEntity.findOne({ where: { externalID } })).toBeNull();
    expect(
      await ThreadEntity.findOne({
        where: { externalID: newExternalID },
      }),
    ).toBeDefined();
  });

  test('update externalID conflicting with another thread', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const newExternalID = 'some-better-name';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
      externalID: newExternalID,
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ id: newExternalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(409);
    expect(body.error).toBe('thread_already_exists');
  });

  test('update organizationID', async () => {
    const externalID = 'my-cool-thread';
    const location = { page: 'a really nice page' };
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID, location },
    );
    const { messageID } = await addMessageViaGraphQL(viewer, {
      threadID: internalID,
    });
    await addReactionViaGraphQL(viewer, { messageID });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ organizationID: organization2.externalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const thread = await ThreadEntity.findOne({ where: { externalID } });
    expect(thread?.id).toBe(internalID);
    expect(thread?.orgID).toBe(organization2.id);

    const page = await PageEntity.findOne({
      where: {
        contextHash: thread?.pageContextHash,
        orgID: organization2.id,
      },
    });
    expect(page?.contextData).toStrictEqual(location);

    const message = await MessageEntity.findByPk(messageID);
    expect(message?.orgID).toBe(organization2.id);

    const graphQLResponse = await executeGraphQLOperation({
      query: Thread2Query,
      variables: { threadID: internalID },
      viewer: viewer2,
    });

    const graphQLThread: ThreadFragment = graphQLResponse.data?.thread;
    expect(graphQLThread).toBeDefined();

    expect(graphQLThread.orgID).toBe(organization2.id);
    expect(graphQLThread.location).toStrictEqual(location);

    // The originator of the thread and viewer2 who made this GraphQL query do
    // not share an org -- how do we deal with seeing a thread participant from
    // a user you can't see?
    expect(graphQLThread.participants.length).toBe(1);
    expect(graphQLThread.participants[0].user?.id).toBe(andreiUser.id);
    expect(graphQLThread.replyingUserIDs.length).toBe(0);
    expect(graphQLThread.initialMessagesInclDeleted[0].source.id).toBe(
      viewer.userID,
    );
  });

  test('update organizationID to invalid org', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ organizationID: 'idonotexist' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('organization_not_found');
  });

  test('update name', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const name = 'my new name';
    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ name })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const thread = await ThreadEntity.findOne({ where: { externalID } });
    expect(thread?.name).toBe(name);
  });

  test('update url', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const url = 'https://local.cord.com/sometesturl';
    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ url })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const thread = await ThreadEntity.findOne({ where: { externalID } });
    expect(thread?.url).toBe(url);
  });

  test('update resolvedTimestamp', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const resolvedTimestamp = new Date('20 April 2020');
    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ resolvedTimestamp: resolvedTimestamp.toISOString() })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const thread = await ThreadEntity.findOne({ where: { externalID } });
    expect(thread?.resolvedTimestamp).toStrictEqual(resolvedTimestamp);

    // Resolving without a specified user does not inject a resolved message
    // into the thread.
    expect(
      await MessageEntity.count({ where: { threadID: thread?.id } }),
    ).toEqual(0);
  });

  test('update resolved', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ resolved: true, userID: andreiUser.externalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const thread = await ThreadEntity.findOne({ where: { externalID } });
    expect(thread?.resolvedTimestamp).toBeDefined();

    // Injected a resolved message.
    expect(
      await MessageEntity.count({ where: { threadID: thread?.id } }),
    ).toEqual(1);

    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ resolved: false, userID: andreiUser.externalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode2).toBe(200);
    expect(body2.success).toBe(true);

    const thread2 = await ThreadEntity.findOne({ where: { externalID } });
    expect(thread2?.resolvedTimestamp).toBeNull();

    // Injected a resolved message then an unresolved message.
    expect(
      await MessageEntity.count({ where: { threadID: thread?.id } }),
    ).toEqual(2);
  });

  test('update location', async () => {
    const externalID = 'my-cool-thread';
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID },
    );
    await addMessageViaGraphQL(viewer, {
      threadID: internalID,
    });

    const location = { page: 'my favourite page' };
    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ location })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const thread = await ThreadEntity.findOne({ where: { externalID } });
    const page = await PageEntity.findOne({
      where: { contextHash: thread?.pageContextHash },
    });
    expect(page?.contextData).toStrictEqual(location);
    expect(page?.orgID).toBe(organization.id);
  });

  test('wrong app', async () => {
    const { accessToken: altToken } = await setupPlatformTest();

    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${externalID}`)
      .send({ name: 'New name' })
      .set('Authorization', `Bearer ${altToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
  });

  test('set thread to seen by valid users', async () => {
    const page = await createPage(organization.id);
    const thread = await createThread(
      'test',
      organization.id,
      page.contextHash,
      andreiUser.platformApplicationID!,
    );

    await getSequelize().transaction(async (transaction) => {
      return await addMessage({
        thread,
        viewer,
        transaction,
        message: 'hello!',
      });
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${thread.externalID}`)
      .send({
        seenByUsers: [
          { userID: flooeyUser.externalID, seen: true },
          { userID: nimrodUser.externalID, seen: true },
        ],
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    await checkIsSeen(thread.id, viewer, flooeyUser.id, true);
    await checkIsSeen(thread.id, viewer, nimrodUser.id, true);

    // Second call with other user
    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .put(`/v1/threads/${thread.externalID}`)
      .send({
        seenByUsers: [{ userID: flooeyUser.externalID, seen: false }],
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode2).toBe(200);
    expect(body2.success).toBe(true);

    // User not included still has seen status as true
    await checkIsSeen(thread.id, viewer, nimrodUser.id, true);
  });

  test('set thread to unseen by valid users', async () => {
    const page = await createPage(organization.id);
    const thread = await createThread(
      'test',
      organization.id,
      page.contextHash,
      andreiUser.platformApplicationID!,
    );

    await getSequelize().transaction(async (transaction) => {
      return await addMessage({
        thread,
        viewer,
        transaction,
        message: 'hello!',
      });
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${thread.externalID}`)
      .send({
        seenByUsers: [
          { userID: flooeyUser.externalID, seen: false },
          { userID: nimrodUser.externalID, seen: false },
        ],
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    await checkIsSeen(thread.id, viewer, flooeyUser.id, false);
    await checkIsSeen(thread.id, viewer, nimrodUser.id, false);
  });
});

async function checkIsSeen(
  threadID: string,
  viewerForUser: Viewer,
  userID: string,
  isSeen: boolean,
) {
  const context = await contextWithSession(
    { viewer: viewerForUser },
    getSequelize(),
    null,
    null,
  );

  const participant =
    await context.loaders.threadParticipantLoader.loadForUserNoOrgCheck({
      threadID,
      userID,
    });
  if (isSeen) {
    expect(participant?.lastSeenTimestamp).not.toBeNull();
  } else {
    expect(participant?.lastSeenTimestamp).toBeNull();
  }
}
