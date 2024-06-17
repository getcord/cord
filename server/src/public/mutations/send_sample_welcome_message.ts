import { v4 as uuid } from 'uuid';
import {
  assertViewerHasPlatformIdentity,
  Viewer,
} from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { createPlatformUser } from 'server/src/public/routes/platform/util.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { MessageNodeType } from 'common/types/index.ts';
import type { Location } from 'common/types/index.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import { PageLoader } from 'server/src/entity/page/PageLoader.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { PageVisitorMutator } from 'server/src/entity/page_visitor/PageVisitorMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { CORD_AUTOMATED_TESTS_APPLICATION_ID } from 'common/const/Ids.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { publishNewThreadEvents } from 'server/src/entity/thread/new_thread_tasks/publishNewThreadEvents.ts';

export const sendSampleWelcomeMessageResolver: Resolvers['Mutation']['sendSampleWelcomeMessage'] =
  async (_, args, context) => {
    const { userID, orgID, platformApplicationID } =
      assertViewerHasPlatformIdentity(context.session.viewer);

    const [application, isFirstOrgMessage] = await Promise.all([
      context.loaders.applicationLoader.load(platformApplicationID),
      MessageEntity.findOne({ where: { orgID } }).then((msg) => msg === null),
    ]);

    if (
      !application ||
      (application.environment !== 'sampletoken' &&
        application.id !== CORD_AUTOMATED_TESTS_APPLICATION_ID)
    ) {
      throw new Error('sendSampleWelcomeMessage: invalid application');
    }

    if (!isFirstOrgMessage) {
      return { success: true, failureDetails: null };
    }

    const firstName = 'Albert from Cord (Example User)';
    const dummyUser = await createPlatformUser(
      context,
      application.id,
      uuid(), // ExternalID
      null,
      firstName, // Display name
      undefined, // Screen name
      `${APP_ORIGIN}/static/Albert-from-Cord.jpeg`,
      'active',
      {}, // metadata
    );

    await OrgMembersEntity.upsert({
      userID: dummyUser.id,
      orgID: orgID,
    });

    const senderViewer = Viewer.createLoggedInViewer(dummyUser.id, orgID);
    const senderLoaders = await getNewLoaders(senderViewer);

    const { page } = await createPageContext(
      senderViewer,
      args.messageLocation,
    );

    const thread = await getSequelize().transaction(
      async (transaction) =>
        await new ThreadMutator(senderViewer, senderLoaders).createThreadOnPage(
          uuid(),
          args.url,
          page,
          'Welcome to Cord!',
          transaction,
          application.id,
          null,
        ),
    );

    const threadParticipants = [senderViewer.userID!, userID];
    const threadParticipantMutator = new ThreadParticipantMutator(
      senderViewer,
      senderLoaders,
    );
    await threadParticipantMutator.subscribeUsersToThread(
      thread.id,
      threadParticipants,
    );

    await new MessageMutator(senderViewer, senderLoaders).createMessage({
      id: uuid(),
      thread,
      url: args.url,
      content: [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [
            { text: 'Hey, ' },
            {
              type: MessageNodeType.MENTION,
              user: { id: userID },
              children: [{ text: `@Sample User` }],
            },
            { text: '!' },
          ],
        },
        {
          type: MessageNodeType.PARAGRAPH,
          children: [
            {
              text: 'Nice work! Your Cord demo is ready.',
            },
          ],
        },
      ],
    });

    await publishNewThreadEvents(page.contextData, thread);

    return { success: true, failureDetails: null };
  };

async function createPageContext(viewer: Viewer, location: Location) {
  const pageContext = {
    providerID: null,
    data: location,
  };

  const pageContextHash = await new PageMutator(viewer).createPageIfNotExists(
    pageContext,
  );
  const page = (await new PageLoader(viewer).getPageFromContextHash(
    pageContextHash,
  )) as PageEntity;

  await new PageVisitorMutator(viewer).markPresentInPage(pageContextHash);

  return { page, pageContextHash };
}
