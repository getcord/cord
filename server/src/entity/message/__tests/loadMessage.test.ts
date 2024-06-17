import { v4 as uuid } from 'uuid';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { MessageLoader } from 'server/src/entity/message/MessageLoader.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUser,
  createPageAndThread,
  addMessage,
} from 'server/src/public/routes/tests/util.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

async function ml(viewer: Viewer): Promise<MessageLoader> {
  return (await getNewLoaders(viewer)).messageLoader;
}

async function v(user: UserEntity, org: OrgEntity | null): Promise<Viewer> {
  return await Viewer.createLoggedInPlatformViewer({ user, org });
}

describe('Test MessageLoader.loadMessage and loadMessageByExternalID', () => {
  let org: OrgEntity;
  let org2: OrgEntity;
  let user: UserEntity;
  let application: ApplicationEntity;
  let thread: ThreadEntity;
  const messages: MessageEntity[] = [];

  beforeAll(async () => {
    initMockFeatureFlagForTest(
      async (k) => k === FeatureFlags.GRANULAR_PERMISSIONS.key,
    );

    application = await createPlatformApplication();

    [org, org2] = await Promise.all([
      createRandomPlatformOrg(application.id),
      createRandomPlatformOrg(application.id),
    ]);

    let author: UserEntity;
    [user, author] = await Promise.all([
      createRandomPlatformUser(application.id, {
        metadata: { admin: true },
      }),
      createRandomPlatformUser(application.id, {}),
    ]);

    const authorViewer = await v(author, org);

    ({ thread } = await createPageAndThread(authorViewer, application.id, {
      metadata: { colour: 'org1Colour' },
    }));

    // We don't care about the transaction, but the helper function requires it
    // (because most callers do care).
    await getSequelize().transaction(async (transaction) => {
      messages.push(
        await addMessage({
          thread,
          viewer: authorViewer,
          transaction,
        }),
      );

      messages.push(
        await addMessage({
          thread,
          viewer: authorViewer,
          transaction,
        }),
      );
    });
  });

  afterEach(async () => {
    await OrgMembersEntity.truncate({ cascade: true });
    await PermissionRuleEntity.truncate({ cascade: true });
  });

  test('Non-existent message', async () => {
    const viewer = await v(user, org2);
    const loader = await ml(viewer);
    expect(await loader.loadMessage(uuid())).toBeNull();
    expect(
      await loader.loadMessageByExternalID(uuid(), application.id),
    ).toBeNull();
  });

  type FetcherFn = (
    l: MessageLoader,
    m: MessageEntity,
  ) => Promise<MessageEntity | null>;
  const fetcherFns: [string, FetcherFn][] = [
    ['loadMessage', (l, m) => l.loadMessage(m.id)],
    [
      'loadMessageByExternalID',
      (l, m) => l.loadMessageByExternalID(m.externalID, application.id),
    ],
  ];

  describe.each(fetcherFns)('%s', (_name, fetch) => {
    test('Cannot read message without org membership or permission rule', async () => {
      const viewer = await v(user, org2);
      const loader = await ml(viewer);
      const message = messages[0];

      expect(await fetch(loader, message)).toBeNull();
    });

    test('Org membership grants access', async () => {
      await OrgMembersEntity.create({ userID: user.id, orgID: org.id });

      const viewer = await v(user, org2);
      const message = messages[0];

      const receivedMessage = await fetch(await ml(viewer), message);
      expect(receivedMessage).toBeInstanceOf(MessageEntity);
      expect(receivedMessage?.id).toEqual(message.id);
    });

    test('thread:read is not enough to read messages', async () => {
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${user.externalID}"`,
        resourceSelector: `$.id == "${thread.externalID}"`,
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      const viewer = await v(user, org2);
      expect(await fetch(await ml(viewer), messages[0])).toBeNull();
    });

    test('message:read on message lets you read it', async () => {
      await Promise.all([
        PermissionRuleEntity.create({
          userSelector: `$.id == "${user.externalID}"`,
          resourceSelector: `$.id == "${thread.externalID}"`,
          permissions: ['thread:read'],
          platformApplicationID: application.id,
        }),
        PermissionRuleEntity.create({
          userSelector: `$.id == "${user.externalID}"`,
          resourceSelector: `$.id == "${messages[0].externalID}"`,
          permissions: ['message:read'],
          platformApplicationID: application.id,
        }),
      ]);

      const viewer = await v(user, org2);

      const receivedMessage = await fetch(await ml(viewer), messages[0]);
      expect(receivedMessage).toBeInstanceOf(MessageEntity);
      expect(receivedMessage?.id).toEqual(messages[0].id);

      expect(await (await ml(viewer)).loadMessage(messages[1].id)).toBeNull();
    });

    test('message:read on thread lets you read all messages', async () => {
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${user.externalID}"`,
        resourceSelector: `$.id == "${thread.externalID}"`,
        permissions: ['thread:read', 'message:read'],
        platformApplicationID: application.id,
      });

      const viewer = await v(user, org2);
      for (const message of messages) {
        const receivedMessage = await fetch(await ml(viewer), message);
        expect(receivedMessage).toBeInstanceOf(MessageEntity);
        expect(receivedMessage?.id).toEqual(message.id);
      }
    });

    test('cannot read message if you cannot read thread', async () => {
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${user.externalID}"`,
        resourceSelector: `$.id == "${messages[0].externalID}"`,
        permissions: ['message:read'],
        platformApplicationID: application.id,
      });

      const viewer = await v(user, org2);
      expect(await fetch(await ml(viewer), messages[0])).toBeNull();
    });
  });
});
