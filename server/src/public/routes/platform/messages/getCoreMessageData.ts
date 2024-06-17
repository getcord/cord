import type { CoreMessageData } from '@cord-sdk/types';
import { externalizeID } from 'common/util/externalIDs.ts';
import { convertStructuredMessageToText } from '@cord-sdk/react/common/lib/messageNode.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { getMessageAttachments } from 'server/src/public/routes/platform/messages/getMessageAttachments.ts';
import {
  buildMessageVariablesReactions,
  externalizeContent,
} from 'server/src/public/routes/platform/messages/util.ts';

export async function getCoreMessageData(
  loaders: RequestContextLoaders,
  message: MessageEntity,
  thread: ThreadEntity,
): Promise<CoreMessageData> {
  const [author, org, content, attachments, reactions, threadParticipants] =
    await Promise.all([
      loaders.userLoader.loadUser(message.sourceID),
      loaders.orgLoader.loadOrg(message.orgID),
      externalizeContent(message.content, thread.platformApplicationID),
      getMessageAttachments(loaders, message),
      buildMessageVariablesReactions(loaders, message.id),
      loaders.threadParticipantLoader.loadForThreadIDNoOrgCheck(
        message.threadID,
      ),
    ]);

  const seenByUserIDs = threadParticipants
    .filter((participant) => {
      if (participant.lastSeenTimestamp === null) {
        return false;
      }
      const timestamp = message.lastUpdatedTimestamp ?? message.timestamp;
      return timestamp <= participant.lastSeenTimestamp;
    })
    .map((participant) => participant.userID);

  const seenByUsers = await loaders.userLoader.loadUsers(seenByUserIDs);

  return {
    id: message.externalID,

    // If we didn't find the org, something is broken, so at least give
    // ourselves a breadcrumb
    organizationID: org?.externalID ?? externalizeID(message.orgID),

    groupID: org?.externalID ?? externalizeID(message.orgID),

    threadID: thread.externalID,

    // If we didn't find the user, something is broken, so at least give
    // ourselves a breadcrumb to debug with
    // We're making the strategic choice here to give the end users a more
    // coherent name that what we've used internally. We may regret this
    // if we find ourselves confused because the same thing has multiple
    // names.
    authorID: author?.externalID ?? externalizeID(message.sourceID),

    url: message.url,
    content,
    plaintext: convertStructuredMessageToText(message.content),

    // Strategically renamed to be more intuitive to devs
    createdTimestamp: message.timestamp,
    // Strategically renamed to be more intuitive to devs
    updatedTimestamp: message.lastUpdatedTimestamp,

    deletedTimestamp: message.deletedTimestamp,

    type: message.type,

    iconURL: message.iconURL,

    translationKey: message.translationKey,

    metadata: message.metadata,

    seenBy: seenByUsers.map((user) => user.externalID),

    extraClassnames: message.extraClassnames,

    skipLinkPreviews: message.skipLinkPreviews,

    attachments,
    reactions,
  };
}
