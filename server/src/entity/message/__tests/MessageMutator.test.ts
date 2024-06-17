import { v4 as uuid } from 'uuid';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import {
  createPlatformApplication,
  createThread,
  createRandomPlatformUserAndOrgMember,
  createRandomPlatformOrg,
  createPage,
} from 'server/src/public/routes/tests/util.ts';
import type { MessageTextNode } from '@cord-sdk/types';
import 'server/src/tests/setupEnvironment';
import { Viewer } from 'server/src/auth/index.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';

let application: ApplicationEntity;
let organization: OrgEntity;
let alan: UserEntity;
let steve: UserEntity;
let page: PageEntity;
let thread: ThreadEntity;
let alanViewer: Viewer;
let steveViewer: Viewer;

describe('Test Mutation permissions', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    organization = await createRandomPlatformOrg(application.id);
    page = await createPage(organization.id);

    [steve, alan, thread] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, organization.id),
      createRandomPlatformUserAndOrgMember(application.id, organization.id),
      createThread('Marmot', organization.id, page.contextHash, application.id),
    ]);

    alanViewer = await Viewer.createLoggedInPlatformViewer({
      user: alan,
      org: organization,
    });
    steveViewer = await Viewer.createLoggedInPlatformViewer({
      user: steve,
      org: organization,
    });
  });

  test('User can send message, and edit it. Then other user can read message, but not edit it.', async () => {
    // Can alan write a message
    const alanLoaders = await getNewLoaders(alanViewer);
    const mutator = new MessageMutator(alanViewer, alanLoaders);
    const alanMessageContent = [
      {
        type: undefined,
        text: 'Alan! Alan!',
      },
    ];
    const steveMessageContent = [
      {
        type: undefined,
        text: 'Steve! Steve!',
      },
    ];
    const messageID = uuid();
    const message = await mutator.createMessage({
      id: messageID,
      thread,
      url: 'some/url',
      content: alanMessageContent,
    });
    expect(message).not.toBeNull();
    if (message != null) {
      expect(message.content[0] as MessageTextNode).toMatchObject({
        text: 'Alan! Alan!',
      });
      expect(
        await mutator.updateContent(
          new Logger(alanViewer),
          message,
          steveMessageContent,
        ),
      ).toBeTruthy();
    }

    const steveLoaders = await getNewLoaders(steveViewer);
    const readMessage = await steveLoaders.messageLoader.loadMessage(messageID);
    expect(readMessage).not.toBeNull();
    if (readMessage != null) {
      expect(readMessage.content).toEqual([
        {
          type: undefined,
          text: 'Steve! Steve!',
        },
      ]);
      const steveWrites = new MessageMutator(steveViewer, steveLoaders);
      await expect(
        steveWrites.updateContent(
          new Logger(steveViewer),
          readMessage,
          alanMessageContent,
        ),
      ).rejects.toThrowError(
        'User does not have write permissions to message created by another user',
      );
    }
  });

  test('User can send message, and delete it. Then other user can read message, but not delete it.', async () => {
    // Can alan write a message
    const alanLoaders = await getNewLoaders(alanViewer);
    const mutator = new MessageMutator(alanViewer, alanLoaders);
    const alanMessageContent = [
      {
        type: undefined,
        text: 'Alan! Alan!',
      },
    ];
    const messageID = uuid();
    const message = await mutator.createMessage({
      id: messageID,
      thread,
      url: 'some/url',
      content: alanMessageContent,
    });
    expect(message).not.toBeNull();

    const steveLoaders = await getNewLoaders(steveViewer);
    const readMessage = await steveLoaders.messageLoader.loadMessage(messageID);
    expect(readMessage).not.toBeNull();
    if (readMessage != null) {
      expect(readMessage.content).toEqual([
        {
          type: undefined,
          text: 'Alan! Alan!',
        },
      ]);
      const steveWrites = new MessageMutator(steveViewer, steveLoaders);
      await expect(steveWrites.deleteMessage(readMessage)).rejects.toThrowError(
        'User does not have write permissions to message created by another user',
      );
    }
    if (message != null) {
      expect(message.content[0] as MessageTextNode).toMatchObject({
        text: 'Alan! Alan!',
      });
      expect(await mutator.deleteMessage(message)).toBeTruthy();
    }
    const readDeletedMessage =
      await steveLoaders.messageLoader.loadMessage(messageID);
    expect(readDeletedMessage).toBeNull();
  });
});
