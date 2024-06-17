import { v4 as uuid } from 'uuid';

import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  createMentionNode,
  messageContentFromString,
} from '@cord-sdk/react/common/lib/messageNode.ts';

// eslint-disable-next-line import/no-restricted-paths
import InboxCountQuery from 'external/src/graphql/InboxCountQuery.graphql';
// eslint-disable-next-line import/no-restricted-paths
import CreateThreadMessageMutation from 'external/src/graphql/CreateThreadMessageMutation.graphql';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

let viewer: Viewer;
let application: ApplicationEntity;
let org: OrgEntity;
let user: UserEntity;

describe('Test Query.viewer.inbox', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    org = await createRandomPlatformOrg(application.id);
    user = await createRandomPlatformUserAndOrgMember(application.id, org.id);

    viewer = Viewer.createLoggedInViewer(user.id, org.id);
  });

  test('empty inbox', async () => {
    const result = await executeGraphQLOperation({
      query: InboxCountQuery,
      viewer,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.viewer?.inbox?.count).toBe(0);
  });

  test('inbox with @mention', async () => {
    const anotherUser = await createRandomPlatformUserAndOrgMember(
      application.id,
      org.id,
    );
    const anotherViewer = await Viewer.createLoggedInPlatformViewer({
      user: anotherUser,
      org,
    });

    // create a message that @mentions andrei
    const messageContent = messageContentFromString('hello');
    messageContent.push(createMentionNode(user.externalID, 'andrei'));

    const threadID = uuid();
    const createMessageResult = await executeGraphQLOperation({
      query: CreateThreadMessageMutation,
      variables: {
        input: {
          threadID,
          messageID: uuid(),
          pageContext: {
            data: { location: 'https://cord.com' },
          },
          createNewThread: true,
          externalContent: messageContent,
          url: 'https://cord.com',
          fileAttachments: [],
          annotationAttachments: [],
        },
      },
      viewer: anotherViewer,
    });

    expect(createMessageResult.data?.createThreadMessage.success).toBe(true);

    const inboxCountResult = await executeGraphQLOperation({
      query: InboxCountQuery,
      viewer,
    });

    expect(inboxCountResult.errors).toBeUndefined();
    expect(inboxCountResult.data?.viewer?.inbox?.count).toBe(1);

    const threadInboxResult = await executeGraphQLOperation({
      query: `query ThreadInbox {
          viewer {
            inbox {
              threads {
                id
                newMessagesCount
              }
            }
          }
        }`,
      viewer,
    });

    expect(threadInboxResult.data?.viewer.inbox.threads).toContainEqual(
      expect.objectContaining({
        id: threadID,
        newMessagesCount: 1,
      }),
    );
  });
});
