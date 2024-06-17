import * as jsonwebtoken from 'jsonwebtoken';
import { MessageNodeType } from '@cord-sdk/types';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { externalizeID } from 'common/util/externalIDs.ts';

let andreiUser: UserEntity;
let secondUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let clientAuthToken: string;
let secondUserClientAuthToken: string;
const externalID = 'thready-wedy';

describe('Client REST API: /v1/client/message', () => {
  beforeAll(async () => {
    let application;
    ({ application, andreiUser, organization } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });

    secondUser = await createUserAndOrgMember({
      name: 'Second User',
      externalID: 'seconduser',
      appID: organization.platformApplicationID!,
      email: 'user2@example.com',
      orgID: organization.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    clientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: andreiUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
    secondUserClientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: secondUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('Fetch message', async () => {
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID },
    );
    const { messageID } = await addMessageViaGraphQL(viewer, {
      threadID: internalID,
      content: [
        { type: MessageNodeType.PARAGRAPH, children: [{ text: 'What up!' }] },
      ],
      metadata: { testing: 'test test' },
    });

    let { statusCode, body } = await apiCall()
      .get(`/v1/client/message/${externalizeID(messageID)}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.id).toBe(externalizeID(messageID));
    expect(body.threadID).toBe(externalID);
    expect(body.groupID).toBe(organization.externalID);
    expect(body.authorID).toBe(andreiUser.externalID);
    expect(body.plaintext).toBe('What up!');
    expect(body.metadata).toEqual({ testing: 'test test' });
    expect(body.seen).toBe(true); // The author sees their own messages as seen

    // Check what it looks like for the other user
    ({ statusCode, body } = await apiCall()
      .get(`/v1/client/message/${externalizeID(messageID)}`)
      .set('Authorization', `Bearer ${secondUserClientAuthToken}`));

    expect(statusCode).toBe(200);
    expect(body.id).toBe(externalizeID(messageID));
    expect(body.threadID).toBe(externalID);
    expect(body.groupID).toBe(organization.externalID);
    expect(body.authorID).toBe(andreiUser.externalID);
    expect(body.plaintext).toBe('What up!');
    expect(body.metadata).toEqual({ testing: 'test test' });
    expect(body.seen).toBe(false); // The other user hasn't seen this message
  });

  test('Invalid message ID', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/message/nope`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('message_not_found');
  });
});
