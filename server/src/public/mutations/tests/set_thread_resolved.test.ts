import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
  resolveThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

let andreiUser: UserEntity;
let flooeyViewer: Viewer;
let andreiViewer: Viewer;
let organization: OrgEntity;

const location = { location: 'https://cord.com' };

describe('set_thread_resolved', () => {
  beforeAll(async () => {
    ({ andreiUser, organization } = await setupPlatformTest());
    andreiViewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });

    const flooeyUser = await createUserAndOrgMember({
      name: 'Flooey User',
      externalID: 'flooeyuser',
      appID: organization.platformApplicationID!,
      email: 'flooey@example.com',
      orgID: organization.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    flooeyViewer = await Viewer.createLoggedInPlatformViewer({
      user: flooeyUser,
      org: organization,
    });
  });

  test('mark thread as resolved', async () => {
    const externalID = 'my-cool-thread';
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      andreiViewer,
      {
        externalID,
        location,
      },
    );

    await addMessageViaGraphQL(andreiViewer, {
      threadID: internalID,
      location,
    });
    await addMessageViaGraphQL(andreiViewer, {
      threadID: internalID,
      location,
    });
    const { thread } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      andreiViewer,
      {
        externalID,
        location,
      },
    );

    expect(thread.replyingUserIDs).toHaveLength(1);
    expect(thread.actionMessageReplyingUserIDs).toHaveLength(0);
    expect(thread.messagesCountExcludingDeleted).toBe(2);

    await resolveThreadViaGraphQL(flooeyViewer, {
      threadID: internalID,
    });

    const { thread: resolvedThread } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(flooeyViewer, {
        externalID,
      });

    expect(resolvedThread.messagesCountExcludingDeleted).toBe(3);
    expect(resolvedThread.replyingUserIDs).toHaveLength(1);
    // only flooey made an action, ie resolved the thread
    expect(resolvedThread.actionMessageReplyingUserIDs).toHaveLength(1);
    expect(resolvedThread.actionMessageReplyingUserIDs[0]).toBe(
      flooeyViewer.userID,
    );
  });
});
