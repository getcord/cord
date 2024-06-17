import type { Request, Response } from 'express';
import type { Sequelize, Transaction } from 'sequelize';
import { v4 as uuid } from 'uuid';

import { isValidExternalID } from 'common/util/externalIDs.ts';
import {
  getThreadLocation,
  loadThread,
} from 'server/src/public/routes/platform/threads/GetThreadHandler.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishEventToWebhook } from 'server/src/webhook/webhook.ts';
import type { PubSubEvent } from 'server/src/pubsub/index.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import {
  removeAllTypingUsers,
  setUserTyping,
} from 'server/src/presence/typing.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { SlackMirroredThreadEntity } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadEntity.ts';
import { SlackMirroredSupportThreadEntity } from 'server/src/entity/slack_mirrored_support_thread/SlackMirroredSupportThreadEntity.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import {
  MessageActionIconURLs,
  MessageActionTranslationKeys,
} from 'common/const/MessageActions.ts';
import { getActionMessageContent } from 'server/src/message/util/getActionMessageContent.ts';
import type { ServerThreadSeenUser, ServerUpdateThread } from '@cord-sdk/types';
import { addGroupIDIfOrgIDExists } from 'server/src/public/routes/platform/addGroupIDWhereOrgIDExists.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { locationEqual, metadataEqual } from 'common/types/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { createThreadActionNotifications } from 'server/src/entity/thread/update_thread_tasks/createThreadActionNotifications.ts';

async function injectResolvedMessage(
  thread: ThreadEntity,
  resolvedTimestamp: Date | null | undefined,
  originalResolvedTimestamp: Date | null,
  externalUserID: string | undefined,
  platformApplicationID: string | undefined,
  transaction: Transaction,
): Promise<{ message: MessageEntity; viewer: Viewer } | null> {
  if (resolvedTimestamp === undefined) {
    // We aren't changing the resolved status.
    return null;
  }

  if (
    (resolvedTimestamp && originalResolvedTimestamp) ||
    (!resolvedTimestamp && !originalResolvedTimestamp)
  ) {
    // We are only updating the resolvedTimestamp, not actually changing the
    // resolved status.
    return null;
  }

  if (externalUserID === undefined) {
    // There isn't a user we've been instructed to post the update as.
    return null;
  }

  const user = await UserEntity.findOne({
    where: {
      externalID: externalUserID,
      platformApplicationID,
    },
  });
  if (!user) {
    throw new ApiCallerError('user_not_found', {
      message: `Unknown user ${externalUserID}`,
    });
  }

  const org = await OrgEntity.findByPk(thread.orgID);
  if (!org) {
    // (Should never happen!)
    throw new Error(`Somehow cannot find org for thread ${thread.id}`);
  }

  const viewer = await Viewer.createLoggedInPlatformViewer({
    user,
    org,
  });

  const loaders = await getNewLoaders(viewer);

  const actionType = resolvedTimestamp
    ? 'thread_resolved'
    : 'thread_unresolved';

  const message = await new MessageMutator(viewer, loaders).createMessage(
    {
      id: uuid(),
      thread,
      content: getActionMessageContent(actionType, user),
      url: null,
      iconURL: MessageActionIconURLs[actionType],
      translationKey: MessageActionTranslationKeys[actionType],
      type: 'action_message',
    },
    transaction,
  );

  const threadParticipantMutator = new ThreadParticipantMutator(
    viewer,
    loaders,
  );
  await threadParticipantMutator.markThreadNewlyActiveForOtherUsers(
    thread.id,
    message.id,
    transaction,
  );

  return { message, viewer };
}

async function getOrgID(
  platformApplicationID: string,
  externalOrgID: string | undefined,
) {
  if (!externalOrgID) {
    return undefined;
  }
  const org = await OrgEntity.findOne({
    where: { platformApplicationID, externalID: externalOrgID },
  });

  if (!org) {
    throw new ApiCallerError('organization_not_found');
  }

  return org.id;
}

async function updateThreadHandler(req: Request, res: Response) {
  const reqBodyWithGroupIDIfOrgIDExist = addGroupIDIfOrgIDExists(
    req.body,
    req.appID,
  );

  const vars = validate.UpdateThreadVariables(reqBodyWithGroupIDIfOrgIDExist);

  await updateThread({
    ...vars,
    platformApplicationID: req.appID,
    threadID: req.params.threadID,
  });

  return res.status(200).json({
    success: true,
    message: `✅ You successfully updated thread ${req.params.threadID}`,
  });
}

export async function updateThread({
  platformApplicationID,
  threadID,
  id: newExternalID,
  groupID: externalOrgID,
  name,
  resolvedTimestamp: resolvedTimestampInput,
  resolved: resolvedInput,
  location: locationInput,
  userID: externalUserID,
  url,
  metadata,
  extraClassnames,
  typing: typingUserIDs,
  organizationID: _organizationID = externalOrgID,
  seenByUsers: seenByUsersInput,
  addSubscribers,
  removeSubscribers,
  ...rest
}: ServerUpdateThread & {
  threadID: string;
  platformApplicationID: string | undefined;
}) {
  // Make sure we actually covered everything in ServerUpdateThread.
  const _: Record<string, never> = rest;

  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const thread = await loadThread(platformApplicationID, threadID);
  if (!thread) {
    throw new ApiCallerError('thread_not_found');
  }

  if (newExternalID) {
    if (!isValidExternalID(newExternalID)) {
      throw new ApiCallerError('invalid_field', {
        message: `${newExternalID} is not a valid identifier: https://docs.cord.com/reference/identifiers`,
      });
    }

    const dupeThread = await loadThread(platformApplicationID, newExternalID);
    if (dupeThread) {
      throw new ApiCallerError('thread_already_exists', {
        message: `Cannot change ID to ${newExternalID} since a thread with that ID already exists`,
      });
    }
  }

  if (addSubscribers && removeSubscribers) {
    for (const subscriberToAdd of addSubscribers) {
      for (const subscriberToRemove of removeSubscribers) {
        if (subscriberToAdd === subscriberToRemove) {
          throw new ApiCallerError('invalid_field', {
            message: 'Adding and removing the same subscriber is invalid',
          });
        }
      }
    }
  }

  const orgID = await getOrgID(platformApplicationID, externalOrgID);

  // This variable follows the sequelize format:
  // "undefined" -> "do not change what is currently in the db",
  // "null" -> "set to null",
  // some date -> "set to this date"
  let resolvedTimestamp: Date | null | undefined = undefined;
  if (resolvedTimestampInput !== undefined) {
    resolvedTimestamp = resolvedTimestampInput;
  } else if (resolvedInput !== undefined) {
    resolvedTimestamp = resolvedInput ? new Date() : null;
  }

  const originalResolvedTimestamp = thread.resolvedTimestamp;
  const originalPageContextHash = thread.pageContextHash;
  const originalLocation = await getThreadLocation(thread);
  const originalMetadata = thread.metadata;
  const originalOrgID = thread.orgID;
  const originalOrgViewer = Viewer.createOrgViewer(
    thread.orgID,
    platformApplicationID,
  );
  const originalOrgViewerLoaders = await getNewLoaders(originalOrgViewer);
  const originalSubscribers = new Set(
    await originalOrgViewerLoaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
      thread.id,
    ),
  );

  // The orgID is in the page, so we need to change the pageContextHash not only
  // if the location changes but also if the orgID changes.
  let pageContextHash: string | undefined = undefined;
  if (orgID || locationInput) {
    const orgViewer = Viewer.createOrgViewer(orgID ?? thread.orgID);
    const location = locationInput ?? originalLocation;
    pageContextHash = await new PageMutator(orgViewer).createPageIfNotExists({
      providerID: null,
      data: location,
    });
  }

  const sequelize = getSequelize();
  const [updatedThread, _otherChangeOrgUpdates, injectedMessage] =
    await sequelize.transaction(async (transaction) => {
      return await Promise.all([
        thread.update(
          {
            externalID: newExternalID,
            orgID,
            name,
            resolvedTimestamp,
            pageContextHash,
            url,
            metadata,
            extraClassnames: extraClassnames ?? undefined,
          },
          { transaction },
        ),
        // Update some denormalized places -- within the same transaction since we
        // may need to temporarily break foreign key constraints.
        orgID
          ? Promise.all([
              MessageEntity.update(
                { orgID },
                { where: { threadID: thread.id }, transaction },
              ),
              ThreadParticipantEntity.update(
                { orgID },
                { where: { threadID: thread.id }, transaction },
              ),
              EmailOutboundNotificationEntity.update(
                { threadOrgID: orgID },
                { where: { threadID: thread.id }, transaction },
              ),
              SlackMirroredThreadEntity.update(
                { threadOrgID: orgID },
                { where: { threadID: thread.id }, transaction },
              ),
              SlackMirroredSupportThreadEntity.update(
                { threadOrgID: orgID },
                { where: { threadID: thread.id }, transaction },
              ),
            ])
          : null,
        injectResolvedMessage(
          thread,
          resolvedTimestamp,
          originalResolvedTimestamp,
          externalUserID,
          platformApplicationID,
          transaction,
        ),
      ]);
    });

  if (addSubscribers || removeSubscribers) {
    await updateSubscribers(
      sequelize,
      addSubscribers,
      removeSubscribers,
      thread,
    );
  }

  if (typingUserIDs) {
    await updateTypingUsers(sequelize, typingUserIDs, thread);
  }

  if (seenByUsersInput) {
    await updateSeenByUsers(sequelize, seenByUsersInput, thread);
  }

  const newSubscribers = new Set(
    await originalOrgViewerLoaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
      thread.id,
    ),
  );

  const removed = [...originalSubscribers].filter(
    (s) => !newSubscribers.has(s),
  );
  const added = [...newSubscribers].filter((s) => !originalSubscribers.has(s));

  const filterablePropertiesPayload: PubSubEvent<'thread-filterable-properties-updated'>['payload'] =
    {
      threadID: thread.id,
      changes: {
        ...(locationInput &&
          !locationEqual(originalLocation, locationInput) && {
            location: { old: originalLocation, new: locationInput },
          }),
        ...(!!originalResolvedTimestamp !== !!thread.resolvedTimestamp && {
          resolved: {
            old: !!originalResolvedTimestamp,
            new: !!thread.resolvedTimestamp,
          },
        }),
        ...(metadata &&
          !metadataEqual(originalMetadata, thread.metadata) && {
            metadata: { old: originalMetadata, new: thread.metadata },
          }),
        ...(originalOrgID !== thread.orgID && {
          orgID: { old: originalOrgID, new: thread.orgID },
        }),
        ...((added.length > 0 || removed.length > 0) && {
          subscribers: { added, removed },
        }),
      },
    };

  const filterablePropertiesUpdated =
    Object.keys(filterablePropertiesPayload.changes).length > 0;

  const pubSubEvents = [
    publishPubSubEvent('annotations-on-page-updated', {
      pageContextHash: thread.pageContextHash,
      orgID: thread.orgID,
    }),
    pageContextHash
      ? publishPubSubEvent('annotations-on-page-updated', {
          pageContextHash: originalPageContextHash,
          orgID: thread.orgID,
        })
      : null,
    publishPubSubEvent('thread-properties-updated', {
      threadID: thread.id,
    }),
    filterablePropertiesUpdated &&
      publishPubSubEvent(
        'thread-filterable-properties-updated',
        { orgID: thread.orgID },
        filterablePropertiesPayload,
      ),
  ];
  if (originalOrgID !== thread.orgID) {
    pubSubEvents.push(
      publishPubSubEvent(
        'thread-filterable-properties-updated',
        { orgID: originalOrgID },
        filterablePropertiesPayload,
      ),
    );
  }
  backgroundPromise(Promise.all(pubSubEvents));

  if (injectedMessage) {
    const app = await ApplicationEntity.findByPk(platformApplicationID);
    if (!app) {
      // (Should never happen!)
      throw new Error(`Somehow cannot find app ${platformApplicationID}`);
    }

    const { message, viewer } = injectedMessage;
    const context = await contextWithSession(
      { viewer },
      getSequelize(),
      null,
      null,
    );
    backgroundPromise(
      Promise.all([
        publishPubSubEvent(
          'thread-message-added',
          { threadID: message.threadID },
          { messageID: message.id },
        ),
        publishEventToWebhook(app, {
          type: 'thread-message-added',
          threadID: thread.id,
          messageID: message.id,
        }),
        //TODO: fix this to not requre the viewer - thread action messages should
        // not be tied to a message (in this case the resolved action message) and
        // should just be passed through if it exists but created eitherway
        createThreadActionNotifications({
          context,
          threadID: thread.id,
          messageID: message.id,
          threadActionType: updatedThread.resolvedTimestamp
            ? 'resolve'
            : 'unresolve',
        }),
      ]),
    );
  }
}

async function updateSubscribers(
  sequelize: Sequelize,
  addSubscribers: string[] | undefined,
  removeSubscribers: string[] | undefined,
  thread: ThreadEntity,
) {
  await sequelize.transaction(async (transaction) => {
    const orgViewer = Viewer.createOrgViewer(thread.orgID);
    const loaders = await getNewLoaders(orgViewer);
    const mutator = new ThreadParticipantMutator(orgViewer, loaders);
    if (addSubscribers && addSubscribers.length > 0) {
      const orgMembers = await getOrgMembersFromExternalUserIDs(
        addSubscribers,
        thread,
        transaction,
      );
      await mutator.subscribeUsersToThread(
        thread.id,
        orgMembers.map((ome) => ome.userID),
        undefined,
        transaction,
      );
    }
    if (removeSubscribers && removeSubscribers.length > 0) {
      const orgMembers = await getOrgMembersFromExternalUserIDs(
        removeSubscribers,
        thread,
        transaction,
      );
      await mutator.unsubscribeUsersFromThread(
        thread.id,
        orgMembers.map((ome) => ome.userID),
        transaction,
      );
    }
  });
}

async function updateTypingUsers(
  sequelize: Sequelize,
  typingUserIDs: string[],
  thread: ThreadEntity,
) {
  const orgViewer = Viewer.createOrgViewer(thread.orgID);
  const logger = new Logger(orgViewer);

  // We clear any typing indicators still active
  if (typingUserIDs.length === 0) {
    // Clear all typing users in a thread by removing the redis kay
    await removeAllTypingUsers(thread.id);
  } else {
    await sequelize.transaction(async (transaction) => {
      const orgMembers = await getOrgMembersFromExternalUserIDs(
        typingUserIDs,
        thread,
        transaction,
      );

      await Promise.all(
        orgMembers.map(({ userID }) =>
          setUserTyping(logger, thread.id, userID, true),
        ),
      );
    });
  }
}

async function updateSeenByUsers(
  sequelize: Sequelize,
  seenByUsersIDs: ServerThreadSeenUser[],
  thread: ThreadEntity,
) {
  if (seenByUsersIDs.length === 0) {
    return;
  }

  await sequelize.transaction(async (transaction) => {
    const orgMembers = await getOrgMembersFromExternalUserIDs(
      seenByUsersIDs.map((i) => i.userID),
      thread,
      transaction,
    );

    const users = await UserEntity.findAll({
      where: { id: [...orgMembers.map((u) => u.userID)] },
      transaction,
    });

    const org = await OrgEntity.findByPk(thread.orgID, { transaction });
    if (!org) {
      // (Should never happen!)
      throw new Error(`Somehow cannot find org for thread ${thread.id}`);
    }

    const firstMessage = await MessageEntity.findOne({
      where: { threadID: thread.id },
      order: [['timestamp', 'ASC']],
      transaction,
    });
    if (!firstMessage) {
      throw new Error('Could not find first message in thread');
    }

    await Promise.all(
      users.map(async (user) => {
        const viewer = await Viewer.createLoggedInPlatformViewer({
          user,
          org,
        });

        const loaders = await getNewLoaders(viewer);
        const threadParticipantMutator = new ThreadParticipantMutator(
          viewer,
          loaders,
        );

        const userData = seenByUsersIDs.find(
          (i) => i.userID === user.externalID,
        );

        if (userData?.seen) {
          await threadParticipantMutator.markThreadSeen({
            threadID: thread.id,
          });
        } else {
          await threadParticipantMutator.markThreadUnseenFromMessage({
            threadID: thread.id,
            messageID: firstMessage.id,
            transaction,
          });
        }
      }),
    );
  });
}

async function getOrgMembersFromExternalUserIDs(
  userIDs: string[],
  thread: ThreadEntity,
  transaction: Transaction,
) {
  const users = await UserEntity.findAll({
    where: {
      externalID: userIDs,
      platformApplicationID: thread.platformApplicationID,
    },
    transaction,
  });

  if (users.length === 0) {
    throw new ApiCallerError('user_not_found');
  }

  const internalUserIDs = new Set<string>(users.map((user) => user.id));

  // Check that users exist in the org that the thread belongs to
  return await OrgMembersEntity.findAll({
    where: { userID: [...internalUserIDs], orgID: thread.orgID },
    transaction,
  });
}

export default forwardHandlerExceptionsToNext(updateThreadHandler);
