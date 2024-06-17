import gql from 'graphql-tag';
import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addReactionViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import {
  MessageReactionEntity,
  REACTION_MAX_LENGTH,
} from 'server/src/entity/message_reaction/MessageReactionEntity.ts';

let creator: Viewer;
let reactor1: Viewer;
let reactor2: Viewer;
let threadID: UUID;
let messageID: UUID;

describe('Test making a reaction', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [creatorUser, reactor1User, reactor2User] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    creator = await Viewer.createLoggedInPlatformViewer({
      user: creatorUser,
      org,
    });
    reactor1 = await Viewer.createLoggedInPlatformViewer({
      user: reactor1User,
      org,
    });
    reactor2 = await Viewer.createLoggedInPlatformViewer({
      user: reactor2User,
      org,
    });

    ({ threadID, messageID } = await createThreadViaGraphQL(creator, {}));
    await addReactionViaGraphQL(reactor1, { messageID, unicodeReaction: '1' });
    await addReactionViaGraphQL(reactor2, { messageID, unicodeReaction: '2' });
  });

  test('Can load reactions', async () => {
    const result = await executeGraphQLOperation({
      query: gql.default`
        query ($id: UUID!) {
          thread(threadID: $id) {
            initialMessagesInclDeleted {
              id
              reactions {
                unicodeReaction
                user {
                  id
                }
              }
            }
          }
        }
      `,
      variables: {
        id: threadID,
      },
      viewer: creator,
    });

    const message = result.data?.thread.initialMessagesInclDeleted[0];
    expect(message.id).toBe(messageID);
    expect(message.reactions.length).toBe(2);
    expect(message.reactions[0].user.id).toBe(reactor1.userID);
    expect(message.reactions[0].unicodeReaction).toBe('1');
    expect(message.reactions[1].user.id).toBe(reactor2.userID);
    expect(message.reactions[1].unicodeReaction).toBe('2');
  });

  test('Creating duplicate reaction is a no-op', async () => {
    const originalReactions = await MessageReactionEntity.findAll();
    await addReactionViaGraphQL(reactor1, { messageID, unicodeReaction: '1' });
    const updatedReactions = await MessageReactionEntity.findAll();
    expect(updatedReactions).toHaveLength(originalReactions.length);
    originalReactions.forEach((r) =>
      expect(updatedReactions).toContainEqual(r),
    );
  });

  test('Cannot create a gigantic reaction', async () => {
    await addReactionViaGraphQL(
      reactor1,
      {
        messageID,
        unicodeReaction: '!'.repeat(REACTION_MAX_LENGTH * 2),
      },
      false,
    );
  });
});
