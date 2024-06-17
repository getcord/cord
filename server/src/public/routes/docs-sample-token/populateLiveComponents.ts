import * as path from 'path';
import * as url from 'url';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import type { Transaction } from 'sequelize';
import {
  DOCS_LIVE_PAGE_LOCATIONS,
  CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
  DOCS_URLS,
  LIVE_COMPONENT_INBOX_LAUNCHER_THREAD_ID_PREFIX,
  LIVE_COMPONENT_INBOX_THREAD_ID_PREFIX,
  LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX,
  LIVE_COMPONENT_ON_DOCS_EXTERNAL_NOTIFICATION_PREFIX,
  LIVE_COMPONENT_ON_DOCS_MESSAGE_CONTENT_THREAD_ID_PREFIX,
  LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX,
  LIVE_COMPONENT_ON_DOCS_REACTIONS_THREAD_ID_PREFIX,
  LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX,
  LIVE_CSS_ON_DOCS_THREAD_ID_PREFIX,
  CSS_CUSTOMIZATION_ON_DOCS_PREFIX,
  LIVE_COMPONENT_ON_DOCS_NO_AVATAR_USER_ID,
  LIVE_CUSTOMIZATION_ON_DOCS_REPLACEMENTS_THREAD_ID_PREFIX,
  BETA_V2_DOCS_PREFIX,
} from 'common/const/Ids.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import {
  assertViewerHasPlatformIdentity,
  Viewer,
} from 'server/src/auth/index.ts';
import type { MessageContent, PageContext, UUID } from 'common/types/index.ts';
import { MessageAttachmentType, MessageNodeType } from 'common/types/index.ts';
import { createDummyPlatformUser } from 'server/src/public/routes/platform/util.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { decodeSessionFromJWT } from 'server/src/auth/session.ts';

import { DOCS_SERVER_HOST } from 'common/const/Urls.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { PageVisitorMutator } from 'server/src/entity/page_visitor/PageVisitorMutator.ts';
import { TEAM_PROFILES } from 'common/const/TeamProfiles.ts';
import type { ThreadLoader } from 'server/src/entity/thread/ThreadLoader.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { MessageMentionEntity } from 'server/src/entity/message_mention/MessageMentionEntity.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { MessageReactionMutator } from 'server/src/entity/message_reaction/MessageReactionMutator.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import { FileMutator } from 'server/src/entity/file/FileMutator.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';

type DocsLivePageType = keyof typeof DOCS_LIVE_PAGE_LOCATIONS;
type DocsLivePageLocation = (typeof DOCS_LIVE_PAGE_LOCATIONS)[DocsLivePageType];

type AddMessageProps = {
  thread: ThreadEntity;
  viewer: Viewer;
  transaction: Transaction;
  message?: string;
  timestamp?: Date;
};

async function addMessage({
  thread,
  viewer,
  transaction,
  message = 'Hello!',
  timestamp,
}: AddMessageProps) {
  const messageID = uuid();

  assertViewerIsFromCordDocsApplication(viewer);

  const loaders = await getNewLoaders(viewer);
  const messageEntity = await new MessageMutator(viewer, loaders).createMessage(
    {
      id: messageID,
      thread,
      content: [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [
            {
              text: message,
            },
          ],
        },
      ],
      url: null,
      timestamp,
    },
    transaction,
  );

  const threadParticipantMutator = new ThreadParticipantMutator(
    viewer,
    loaders,
  );
  await threadParticipantMutator.markThreadSeen({
    threadID: thread.id,
    setSubscribed: true,
    transaction,
  });

  return messageEntity;
}

type AddMessageWithMentionProps = {
  thread: ThreadEntity;
  viewer: Viewer;
  transaction: Transaction;
  messageBeforeMention?: string;
  mentionUserID: UUID;
  mentionName: string;
  messageAfterMention?: string;
};

async function addMessageWithMention({
  thread,
  viewer,
  transaction,
  messageBeforeMention = 'Hello',
  mentionUserID,
  mentionName,
  messageAfterMention = '',
}: AddMessageWithMentionProps) {
  const messageID = uuid();

  assertViewerIsFromCordDocsApplication(viewer);

  const messageContent: MessageContent = [
    {
      type: MessageNodeType.PARAGRAPH,
      children: [
        {
          text: messageBeforeMention + ' ',
        },
        {
          type: MessageNodeType.MENTION,
          user: {
            id: mentionUserID,
          },
          children: [
            {
              text: '@' + mentionName,
            },
          ],
        },
        {
          text: ' ' + messageAfterMention,
        },
      ],
    },
  ];

  const loaders = await getNewLoaders(viewer);
  await new MessageMutator(viewer, loaders).createMessage(
    {
      id: messageID,
      thread,
      content: messageContent,
      url: null,
    },
    transaction,
  );

  const threadParticipantMutator = new ThreadParticipantMutator(
    viewer,
    loaders,
  );

  await MessageMentionEntity.create(
    {
      userID: mentionUserID,
      messageID,
    },
    { transaction },
  );

  await Promise.all([
    threadParticipantMutator.markThreadSeen({
      threadID: thread.id,
      setSubscribed: true,
      transaction,
    }),
    threadParticipantMutator.subscribeUsersToThread(
      thread.id,
      [mentionUserID],
      undefined,
      transaction,
    ),
  ]);

  // keep this separate from the above otherwise it wouldn't show the thread
  // in the unread section
  await threadParticipantMutator.markThreadNewlyActiveForOtherUsers(
    thread.id,
    messageID,
    transaction,
  );
}

type CreateDummyUserAndViewerProps = {
  platformApplicationID: UUID;
  org: OrgEntity;
  firstName: string;
  transaction?: Transaction;
  context: RequestContext;
  profilePictureURL?: string;
  userExternalID: string;
};

async function createDummyUserAndViewerIfNotExist({
  platformApplicationID,
  org,
  firstName,
  context,
  profilePictureURL,
  userExternalID,
}: CreateDummyUserAndViewerProps) {
  try {
    return await getSequelize().transaction(async (transaction) => {
      // We use this to check if we have already made a dummy user for this org
      // for the docs
      let dummyUser: UserEntity | null;

      dummyUser = await UserEntity.findOne({
        where: {
          platformApplicationID,
          externalID: userExternalID,
        },
        transaction,
      });

      if (!dummyUser) {
        dummyUser = await createDummyPlatformUser({
          applicationID: platformApplicationID,
          orgID: org.id,
          firstName,
          externalID: userExternalID,
          transaction,
          profilePicture: profilePictureURL,
        });
      }

      const dummyViewer = await Viewer.createLoggedInPlatformViewer({
        user: dummyUser,
        org,
      });

      return { viewer: dummyViewer, user: dummyUser };
    });
  } catch (error) {
    context.logger.logException(
      'Could not create or retrieve dummy users data on docs',
      error,
      { orgID: org.id, platformApplicationID },
    );
    throw error;
  }
}

type CreateThreadWithMessageProps = {
  pageMutator: PageMutator;
  threadMutator: ThreadMutator;
  threadLoader: ThreadLoader;
  context: RequestContext;
  dummyViewer: Viewer;
  location: DocsLivePageLocation;
  threadURL: string;
  threadExternalID: string;
  threadName: string;
  message?: string;
  extraMessages?: [Viewer, string][];
  reactions?: Array<string>;
  includeDummyAttachment?: boolean;
};

async function createEmptyThreadIfNotExist({
  pageMutator,
  threadMutator,
  threadLoader,
  context,
  location,
  threadURL,
  threadExternalID,
  threadName,
}: Omit<
  CreateThreadWithMessageProps,
  'message' | 'reactions' | 'dummyViewer'
>) {
  try {
    assertViewerIsFromCordDocsApplication(context.session.viewer);

    await getSequelize().transaction(async (transaction) => {
      const pageContext: PageContext = {
        providerID: null,
        data: { page: location },
      };

      const { page } = await pageMutator.getPageCreateIfNotExists(
        pageContext,
        transaction,
      );

      let threadEntity: ThreadEntity | null;

      threadEntity = await threadLoader.loadByExternalIDStrictOrgCheck(
        threadExternalID,
        transaction,
      );

      if (!threadEntity) {
        threadEntity = await threadMutator.createThreadOnPage(
          uuid(),
          threadURL,
          page,
          threadName,
          transaction,
          CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
          threadExternalID,
        );
      }
    });
  } catch (error) {
    context.logger.logException(
      'Could not create empty thread on docs',
      error,
      { location, threadURL },
    );
    throw error;
  }
}

async function createThreadWithMessageIfNotExist({
  pageMutator,
  threadMutator,
  threadLoader,
  context,
  dummyViewer,
  location,
  threadURL,
  threadExternalID,
  threadName,
  message,
  extraMessages = [],
  reactions,
  includeDummyAttachment = false,
}: CreateThreadWithMessageProps) {
  try {
    assertViewerIsFromCordDocsApplication(context.session.viewer);

    await getSequelize().transaction(async (transaction) => {
      const pageContext: PageContext = {
        providerID: null,
        data: { page: location },
      };

      const { page } = await pageMutator.getPageCreateIfNotExists(
        pageContext,
        transaction,
      );

      let threadEntity: ThreadEntity | null;

      threadEntity = await threadLoader.loadByExternalIDStrictOrgCheck(
        threadExternalID,
        transaction,
      );

      if (!threadEntity) {
        threadEntity = await threadMutator.createThreadOnPage(
          uuid(),
          threadURL,
          page,
          threadName,
          transaction,
          CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
          threadExternalID,
        );

        const messageEntity = await addMessage({
          thread: threadEntity,
          viewer: dummyViewer,
          transaction,
          message,
        });

        let lastMessage = messageEntity;
        for (const [viewer, additionalMessage] of extraMessages) {
          lastMessage = await addMessage({
            thread: threadEntity,
            viewer,
            transaction,
            message: additionalMessage,
            timestamp: new Date(lastMessage.timestamp.getTime() + 1000),
          });
        }

        if (reactions) {
          await Promise.all(
            reactions.map(async (reaction) => {
              await new MessageReactionMutator(dummyViewer, null).createOne(
                messageEntity.id,
                reaction,
                undefined,
                transaction,
              );
            }),
          );
        }

        if (includeDummyAttachment) {
          const fileID = uuid();
          await uploadDummyAttachment(context, fileID);
          await MessageAttachmentEntity.create(
            {
              messageID: messageEntity.id,
              type: MessageAttachmentType.FILE,
              data: { fileID },
            },
            { transaction },
          );
        }

        return;
      }

      const messagesCount = await MessageEntity.count({
        where: {
          threadID: threadEntity.id,
        },
      });

      if (messagesCount < 1) {
        let lastMessage = await addMessage({
          thread: threadEntity,
          viewer: dummyViewer,
          transaction,
          message,
        });
        for (const [viewer, additionalMessage] of extraMessages) {
          lastMessage = await addMessage({
            thread: threadEntity,
            viewer,
            transaction,
            message: additionalMessage,
            timestamp: new Date(lastMessage.timestamp.getTime() + 1000),
          });
        }
      }
    });
  } catch (error) {
    context.logger.logException(
      'Could not create thread and dummy data on docs',
      error,
      { location, threadURL },
    );
    throw error;
  }
}

async function uploadDummyAttachment(context: RequestContext, fileID: UUID) {
  const FILE_NAME = 'dummy_file.txt';
  const MIME_TYPE = 'text/plain';

  const mutator = new FileMutator(context.session.viewer, context.loaders);
  const buffer = fs.readFileSync(
    path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), FILE_NAME),
  );

  const file = await mutator.createFileForUpload(
    fileID,
    FILE_NAME,
    MIME_TYPE,
    buffer.length,
    'uploaded',
  );

  try {
    await fetch(await file.getSignedUploadURL(context.loaders.s3BucketLoader), {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': MIME_TYPE,
      },
    });
  } catch (error: any) {
    context.logger.logException(
      'Could not upload docs dummy file in S3',
      error,
    );
  }
}

function assertViewerIsFromCordDocsApplication(viewer: Viewer) {
  const platformViewer = assertViewerHasPlatformIdentity(viewer);

  if (
    platformViewer.platformApplicationID !==
    CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID
  ) {
    throw new Error('Viewer not part of the Cord Docs application');
  }
  return platformViewer;
}

type AddThreadToPageWithDummyDataType = {
  page: PageEntity;
  viewer: Viewer;
  transaction: Transaction;
  threadURL: string;
  threadName: string;
  otherViewer: Viewer;
  messages?: string[];
};

async function addThreadToPageWithDummyDataIfNotExist({
  page,
  viewer,
  transaction,
  threadURL,
  threadName,
  otherViewer,
  messages,
}: AddThreadToPageWithDummyDataType) {
  const { platformApplicationID, userID } =
    assertViewerIsFromCordDocsApplication(viewer);

  const loaders = await getNewLoaders(viewer);
  const threadMutator = new ThreadMutator(viewer, loaders);

  // so we can look for this thread in the future
  const threadExternalID = `${threadURL}-${userID}`;

  let threadEntity: ThreadEntity | null;

  threadEntity = await loaders.threadLoader.loadByExternalIDStrictOrgCheck(
    threadExternalID,
    transaction,
  );

  if (!threadEntity) {
    threadEntity = await threadMutator.createThreadOnPage(
      uuid(),
      threadURL,
      page,
      threadName,
      transaction,
      platformApplicationID,
      threadExternalID,
    );
    const firstMessage = await addMessage({
      thread: threadEntity,
      viewer,
      transaction,
      message: messages?.[0],
    });
    await addMessage({
      thread: threadEntity,
      viewer: otherViewer,
      transaction,
      message: messages?.[1] ?? 'Hey there!',
      timestamp: new Date(firstMessage.timestamp.getTime() + 1000),
    });

    return;
  }

  const messagesCount = await MessageEntity.count({
    where: {
      threadID: threadEntity.id,
    },
  });

  if (messagesCount < 1) {
    const firstMessage = await addMessage({
      thread: threadEntity,
      viewer,
      transaction,
    });
    await addMessage({
      thread: threadEntity,
      viewer: otherViewer,
      transaction,
      message: 'Hey there!',
      timestamp: new Date(firstMessage.timestamp.getTime() + 1000),
    });
  }
}

type CreateAndPopulateThreadsProps = {
  pageMutator: PageMutator;
  context: RequestContext;
  viewer: Viewer;
  location: string;
  dummyViewers: Viewer[];
  threadURL: string;
  threadName: string;
  threadMessages?: string[][];
};

async function createAndPopulateThreadsIfNotExist({
  pageMutator,
  context,
  viewer,
  location,
  dummyViewers,
  threadURL,
  threadName,
  threadMessages,
}: CreateAndPopulateThreadsProps) {
  try {
    await getSequelize().transaction(async (transaction) => {
      const pageContext: PageContext = {
        providerID: null,
        data: { page: location },
      };

      const { page } = await pageMutator.getPageCreateIfNotExists(
        pageContext,
        transaction,
      );

      const viewers = [viewer, ...dummyViewers];

      await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        viewers.map((viewer, index) =>
          addThreadToPageWithDummyDataIfNotExist({
            page,
            viewer,
            transaction,
            threadURL,
            threadName,
            otherViewer:
              index === viewers.length - 1 ? viewers[0] : viewers[index + 1], // using the other viewers in each thread
            messages: threadMessages?.[index],
          }),
        ),
      );
    });
  } catch (error) {
    context.logger.logException(
      'Could not create live thread list and dummy data on docs',
      error,
    );
    throw error;
  }
}

async function createThreadWithMentionIfNotExist({
  pageMutator,
  threadMutator,
  threadLoader,
  context,
  location,
  threadName,
  threadURL,
  viewer,
  mentionedViewer,
  threadExternalID,
  messageBeforeMention,
  messageAfterMention,
}: Omit<CreateThreadWithMessageProps, 'dummyViewer' | 'message'> & {
  viewer: Viewer;
  mentionedViewer: Viewer;
  messageBeforeMention?: string;
  messageAfterMention?: string;
}) {
  try {
    const { orgID, userID: mentionedUserID } =
      assertViewerIsFromCordDocsApplication(mentionedViewer);

    await getSequelize().transaction(async (transaction) => {
      const pageContext: PageContext = {
        providerID: null,
        data: { page: location },
      };

      const { page } = await pageMutator.getPageCreateIfNotExists(
        pageContext,
        transaction,
      );

      let threadEntity: ThreadEntity | null;

      threadEntity = await threadLoader.loadByExternalIDStrictOrgCheck(
        threadExternalID,
        transaction,
      );

      if (!threadEntity) {
        threadEntity = await threadMutator.createThreadOnPage(
          uuid(),
          threadURL,
          page,
          threadName,
          transaction,
          CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
          threadExternalID,
        );
      }

      const mentionedUser = await context.loaders.userLoader.loadUserInOrg(
        mentionedUserID,
        orgID,
      );

      if (!mentionedUser) {
        throw new Error('Mentioned user not found');
      }

      const messagesCount = await MessageEntity.count({
        where: {
          threadID: threadEntity.id,
        },
      });

      if (messagesCount < 1) {
        await addMessageWithMention({
          thread: threadEntity,
          viewer,
          transaction,
          mentionUserID: mentionedUserID,
          mentionName: userDisplayName(mentionedUser),
          messageBeforeMention,
          messageAfterMention,
        });
      }
    });
  } catch (error) {
    context.logger.logException(
      'Could not create thread with viewer mention on docs',
      error,
      { threadURL },
    );
    throw error;
  }
}

type ViewerToVisitPage = {
  pageMutator: PageMutator;
  viewer: Viewer;
  context: RequestContext;
  location: DocsLivePageLocation;
  transaction?: Transaction;
};

async function viewerToVisitPageIfNotExist({
  pageMutator,
  viewer,
  context,
  location,
}: ViewerToVisitPage) {
  try {
    assertViewerIsFromCordDocsApplication(viewer);
    await getSequelize().transaction(async (transaction) => {
      const pageContext: PageContext = {
        providerID: null,
        data: { page: location },
      };

      const { pageContextHash } = await pageMutator.getPageCreateIfNotExists(
        pageContext,
        transaction,
      );
      await markPageVisitedByViewerIfNotExist({
        viewer,
        pageContextHash,
        transaction,
      });
    });
  } catch (error) {
    context.logger.logException(
      'Could not create data for viewer to visit page on docs',
      error,
      { viewer: { ...viewer }, location },
    );
    throw error;
  }
}

type PageVisitedByViewer = {
  viewer: Viewer;
  pageContextHash: string;
  transaction?: Transaction;
};

async function markPageVisitedByViewerIfNotExist({
  viewer,
  pageContextHash,
  transaction,
}: PageVisitedByViewer) {
  const { orgID, userID } = assertViewerIsFromCordDocsApplication(viewer);
  const pageVisitor = await PageVisitorEntity.findOne({
    where: {
      userID,
      orgID,
      pageContextHash,
    },
  });
  if (pageVisitor) {
    return;
  }
  const pageVisitorMutator = new PageVisitorMutator(viewer);
  await pageVisitorMutator.markPresentInPage(pageContextHash, transaction);
}

async function addExternalNotificationIfNotExist({
  pageMutator,
  threadMutator,
  threadLoader,
  context,
  recipient,
  sender,
}: {
  pageMutator: PageMutator;
  threadMutator: ThreadMutator;
  threadLoader: ThreadLoader;
  context: RequestContext;
  recipient: Viewer;
  sender: Viewer;
}) {
  const {
    platformApplicationID,
    userID: recipientID,
    externalUserID: recipientExternalID,
  } = assertViewerIsFromCordDocsApplication(recipient);
  const { userID: senderID } = assertViewerIsFromCordDocsApplication(sender);
  const threadExternalID = `notification-example-thread-${senderID}`;

  await createThreadWithMessageIfNotExist({
    pageMutator,
    threadMutator,
    threadLoader,
    context,
    dummyViewer: sender,
    location: DOCS_LIVE_PAGE_LOCATIONS.liveNotificationList,
    threadURL: DOCS_URLS.tutorials.integrationGuide,
    threadExternalID,
    threadName: 'Integration guide',
    message: "I love Cord's integration guide!",
  });

  await Promise.all([
    getSequelize().transaction(async (transaction) => {
      const notif = await NotificationEntity.findOne({
        where: {
          recipientID,
          senderID,
          type: 'external',
        },
        transaction,
      });

      if (notif) {
        return;
      }

      await new NotificationMutator(
        Viewer.createAnonymousViewer(),
      ).createExternal(
        {
          recipientID,
          senderID,
          platformApplicationID,
          externalTemplate:
            '{{actor}} sent an example notification via the REST API',
          externalURL: `https://${DOCS_SERVER_HOST}/rest-apis/notifications`,
          externalID: `${LIVE_COMPONENT_ON_DOCS_EXTERNAL_NOTIFICATION_PREFIX}${recipientExternalID}`,
          extraClassnames: 'external-notification',
        },
        transaction,
      );
    }),
    getSequelize().transaction(async (transaction) => {
      const notif = await NotificationEntity.findOne({
        where: {
          recipientID,
          senderID,
          type: 'reply',
        },
        transaction,
      });

      if (notif) {
        return;
      }

      const thread = await ThreadEntity.findOne({
        where: { externalID: threadExternalID },
        transaction,
      });

      if (!thread) {
        throw new Error('Just created thread for notif use, where is it');
      }

      const message = await MessageEntity.findOne({
        where: { threadID: thread.id },
        transaction,
      });

      if (!message) {
        throw new Error('Just creatd message for notif user, where is it');
      }

      await new NotificationMutator(sender).create({
        recipientID,
        type: 'reply',
        messageID: message.id,
        replyActions: ['create-thread'],
        threadID: message.threadID,
      });
    }),
  ]);
}

type CreateDummyDataForDocsIfNotExist = {
  sessionToken: string;
};

export async function createDummyDataForDocsIfNotExist({
  sessionToken,
}: CreateDummyDataForDocsIfNotExist) {
  const session = await decodeSessionFromJWT(sessionToken);

  const { platformApplicationID, externalOrgID, orgID } =
    assertViewerIsFromCordDocsApplication(session.viewer);

  const [context, org] = await Promise.all([
    contextWithSession(session, getSequelize(), null, null),
    OrgEntity.findByPk(orgID),
  ]);

  if (!org) {
    throw new Error('org for docs user should exist by now');
  }

  const viewer = session.viewer;

  const threadMutator = new ThreadMutator(viewer, context.loaders);
  const threadLoader = context.loaders.threadLoader;
  const pageMutator = new PageMutator(viewer);

  const dummyUserNames = TEAM_PROFILES.slice(0, 2);

  const [{ viewer: dummyViewerOne }, { viewer: dummyViewerTwo }] =
    await Promise.all(
      dummyUserNames.map(({ firstName, profilePictureURL }, index) =>
        createDummyUserAndViewerIfNotExist({
          platformApplicationID,
          org,
          firstName,
          context,
          profilePictureURL,
          userExternalID: `${externalOrgID}:${index}`,
        }),
      ),
    );

  await Promise.all([
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveCss,
      threadURL: DOCS_URLS.tutorials.getProductionReady.addYourBranding,
      threadExternalID: `${LIVE_CSS_ON_DOCS_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on live css page',
      message:
        'Add your style 🎨 to this interactive thread component that only you can see. You can reply to this message - give it a try! ',
    }),
    createEmptyThreadIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveThread,
      threadURL: DOCS_URLS.components.thread,
      threadExternalID: `${LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on thread component page',
    }),
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.cssCustomization,
      threadURL: DOCS_URLS.howTo.cssCustomization,
      threadExternalID: `${CSS_CUSTOMIZATION_ON_DOCS_PREFIX}${externalOrgID}`,
      threadName: 'InterCord Thread',
      message: `This is a completely customised Cord Thread, to look like a messaging app!`,
      extraMessages: [
        [
          dummyViewerOne,
          'Feel free to play around with the code and this thread 😁',
        ],
      ],
    }),
    viewerToVisitPageIfNotExist({
      pageMutator,
      viewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.cssCustomization,
      context,
    }),
    createAndPopulateThreadsIfNotExist({
      pageMutator,
      context,
      viewer,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveThreadList,
      dummyViewers: [dummyViewerOne, dummyViewerTwo],
      threadURL: DOCS_URLS.components.threadList,
      threadName: 'Thread created on thread list component page',
      threadMessages: [
        ['Be sure to use the thread click handler'],
        ['Best used when connected with the thread component'],
        ['Use this component to render a list of threads'],
      ],
    }),
    createAndPopulateThreadsIfNotExist({
      pageMutator,
      context,
      viewer,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveThreadedComments,
      dummyViewers: [dummyViewerOne],
      threadURL: DOCS_URLS.components.threadedComments,
      threadName: 'Thread created on threaded comments component page',
      threadMessages: [['Try looking at my replies!']],
    }),
    createAndPopulateThreadsIfNotExist({
      pageMutator,
      context,
      viewer,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveSidebar,
      dummyViewers: [dummyViewerOne, dummyViewerTwo],
      threadURL: DOCS_URLS.components.sidebar,
      threadName: 'Thread created on sidebar component page',
      threadMessages: [
        ['Try creating a new thread', 'Or try resolving the thread.'],
        [
          'Click on me to reply to this thread message',
          'There is already a reply! Why not add more',
        ],
        [
          'This is the conversations tab where you will see all threads written on this page, you can navigate to the inbox from here as well.',
          '⭐',
        ],
      ],
    }),
    createThreadWithMentionIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      viewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveInbox,
      threadURL: DOCS_URLS.components.inbox,
      threadName: 'Thread on the inbox component page',
      mentionedViewer: viewer,
      threadExternalID: `${LIVE_COMPONENT_INBOX_THREAD_ID_PREFIX}${externalOrgID}`,
      messageBeforeMention: 'Hello',
      messageAfterMention: 'hover over me for more options.',
    }),
    createThreadWithMentionIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      viewer: dummyViewerTwo,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveInboxLauncher,
      threadURL: DOCS_URLS.components.inboxLauncher,
      threadName: 'Thread on the inbox launcher component page',
      mentionedViewer: viewer,
      threadExternalID: `${LIVE_COMPONENT_INBOX_LAUNCHER_THREAD_ID_PREFIX}${externalOrgID}`,
      messageBeforeMention: 'Hey',
      messageAfterMention: 'click on me to reply.',
    }),
    createAndPopulateThreadsIfNotExist({
      pageMutator,
      context,
      viewer,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveSidebarLauncher,
      dummyViewers: [dummyViewerOne, dummyViewerTwo],
      threadURL: DOCS_URLS.components.sidebarLauncher,
      threadName: 'Thread created on sidebar launcher component page',
    }),
    createAndPopulateThreadsIfNotExist({
      pageMutator,
      context,
      viewer,
      location: DOCS_URLS.howTo.customThreadedComments,
      dummyViewers: [dummyViewerOne],
      threadURL: DOCS_URLS.howTo.customThreadedComments,
      threadName: 'Threaded Comments demo',
    }),
    viewerToVisitPageIfNotExist({
      pageMutator,
      viewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.livePagePresence,
      context,
    }),
    addExternalNotificationIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      recipient: session.viewer,
      sender: dummyViewerOne,
    }),
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveComposer,
      threadURL: DOCS_URLS.components.composer,
      threadExternalID: `${LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on Composer component page',
      message:
        'The id of this thread is passed into the Composer component. Try responding by using the Composer below!',
    }),
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: viewer,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveMessage,
      threadURL: DOCS_URLS.components.message,
      threadExternalID: `${LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on Message component page',
      message: `Hey, I'm a message component. Try editing me or deleting me!`,
      reactions: ['👍️', '⭐', '💯'],
    }),
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveReactions,
      threadURL: DOCS_URLS.components.reactions,
      threadExternalID: `${LIVE_COMPONENT_ON_DOCS_REACTIONS_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on Reactions component page',
      message: `The Reactions component is hooked up to this message. Try adding and removing reactions with it!`,
      reactions: ['👍️', '⭐', '💯'],
    }),
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveMessageContent,
      threadURL: DOCS_URLS.components.messageContent,
      threadExternalID: `${LIVE_COMPONENT_ON_DOCS_MESSAGE_CONTENT_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on Message Content component page',
      message: `I am the message content of a particular message. Try inspecting me!`,
      includeDummyAttachment: true,
    }),
    // Create a user with no profile picture to show AvatarFallback
    createDummyUserAndViewerIfNotExist({
      platformApplicationID,
      org,
      firstName: 'John Doe',
      context,
      userExternalID: `${externalOrgID}:${LIVE_COMPONENT_ON_DOCS_NO_AVATAR_USER_ID}`,
    }),
    // Create conversation for Github demo
    await createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveReplacementsTutorial,
      threadURL: DOCS_URLS.howTo.replacements,
      threadExternalID: `${LIVE_CUSTOMIZATION_ON_DOCS_REPLACEMENTS_THREAD_ID_PREFIX}${externalOrgID}`,
      threadName: 'Thread on Replacements tutorial page',
      message:
        'Hey there! Have you tried out the new Replacements API in Cord yet?',
      reactions: ['👍️', '⭐', '💯'],
      extraMessages: [
        [dummyViewerTwo, "Not yet! What's it all about?"],
        [
          dummyViewerOne,
          'You can swap out default components with your own custom ones for a personalized look and added features.',
        ],
        [
          dummyViewerTwo,
          "I'll have to give it a try. Thanks for the heads up!",
        ],
      ],
    }),
    // For the new beta thread examples
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Thread,
      threadURL: DOCS_URLS.betaV2Components.thread,
      threadExternalID: `${BETA_V2_DOCS_PREFIX}thread-example-${externalOrgID}`,
      threadName: 'Beta Thread',
      message: `This is a completely customised Cord Thread!`,
      extraMessages: [
        [
          dummyViewerOne,
          'You can make it look like a messenger app, just click the examples tab to see it 😁',
        ],
      ],
    }),
    // For the new beta threads examples
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Threads,
      threadURL: DOCS_URLS.betaV2Components.threads,
      threadExternalID: `${BETA_V2_DOCS_PREFIX}threads-example-${externalOrgID}-1`,
      threadName: 'Beta Threads',
      message: `This is a completely customisable Cord Threads component, you can reply directly to this message, or start a new conversation 😁`,
      extraMessages: [
        [dummyViewerOne, 'You can have multiple conversations in one place'],
      ],
    }),
    createThreadWithMessageIfNotExist({
      pageMutator,
      threadMutator,
      threadLoader,
      context,
      dummyViewer: dummyViewerOne,
      location: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Threads,
      threadURL: DOCS_URLS.betaV2Components.threads,
      threadExternalID: `${BETA_V2_DOCS_PREFIX}threads-example-${externalOrgID}-2`,
      threadName: 'Beta Threads',
      message: `Try resolving this thread to and check out the other examples!`,
      extraMessages: [
        [
          dummyViewerTwo,
          'Customise the look and feel of the component using our TabbedThreads component',
        ],
      ],
    }),
  ]);
}
