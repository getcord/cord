import type { WhereOptions } from 'sequelize';
import { unique } from 'radash';

import {
  externalizeID,
  extractInternalID,
  isExternalizedID,
} from 'common/util/externalIDs.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import type { MessageContent, UUID } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { Reaction } from '@cord-sdk/types/message.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';

export async function loadThreadMessage(
  threadID: string,
  externalMessageID: string,
) {
  if (!externalMessageID) {
    throw new ApiCallerError('message_not_found');
  }

  const where: WhereOptions<MessageEntity> = { threadID };
  if (isExternalizedID(externalMessageID)) {
    const internalMessageID = extractInternalID(externalMessageID);
    if (!internalMessageID) {
      throw new ApiCallerError('invalid_request', {
        message: 'message ID is not valid',
      });
    }
    where.id = internalMessageID;
  } else {
    where.externalID = externalMessageID;
  }

  return await MessageEntity.findOne({ where });
}

export async function externalizeContent(
  content: MessageContent,
  platformApplicationID: UUID,
): Promise<MessageContent> {
  return await Promise.all(
    content.map(async (node) => {
      if (node.type === MessageNodeType.MENTION) {
        const user = await UserEntity.findByPk(node.user.id);
        // If this user isn't available (it's from another application, it's
        // been deleted, etc), we don't want to explode, so just put in an
        // externalized ID for it.
        const id =
          user?.platformApplicationID === platformApplicationID &&
          user?.externalID
            ? user.externalID
            : externalizeID(node.user.id);
        return {
          ...node,
          user: { id },
        };
      } else if ('children' in node) {
        return {
          ...node,
          children: await externalizeContent(
            node.children,
            platformApplicationID,
          ),
        };
      }
      return node;
    }),
  );
}

/**
 * Return a version of the message content that just encodes every user ID as an
 * externalized ID, even if they have an external ID.  This is useful for
 * internal handling where we have an internal content and don't want to bother
 * making a bunch of database calls to pass it to a function that requires
 * external IDs.
 *
 * DO NOT USE THIS for content that will eventually be handed to a customer,
 * only for cases where we know we're just going to immediately convert it back
 * to internal IDs.
 */
export function forceExternalizeContent(
  content: MessageContent,
): MessageContent {
  return content.map((node) => {
    if (node.type === MessageNodeType.MENTION) {
      return {
        ...node,
        user: { id: externalizeID(node.user.id) },
      };
    } else if ('children' in node) {
      return {
        ...node,
        children: forceExternalizeContent(node.children),
      };
    }
    return node;
  });
}

export async function internalizeContent(
  content: MessageContent,
  platformApplicationID: UUID,
  orgID: UUID,
): Promise<MessageContent> {
  return await Promise.all(
    content.map(async (node) => {
      if (node.type === MessageNodeType.MENTION) {
        let user = await UserEntity.findOne({
          where: { platformApplicationID, externalID: node.user.id },
        });

        if (!user && isExternalizedID(node.user.id)) {
          // In some circumstances, we may send through a node that has an
          // externalized ID (cord:abcd1234-internal-uuid-bcde) instead of the
          // proper external ID, if we needed to fill it out and the user's
          // external ID wasn't available in the browser, so handle that case
          user = await UserEntity.findOne({
            where: { id: extractInternalID(node.user.id)! },
          });
        }

        // Check if the user is from a Slack-linked org
        if (!user) {
          const slackLinking = await LinkedOrgsEntity.findOne({
            where: {
              sourceOrgID: orgID,
            },
          });

          // TODO: rewrite as a custom sql query instead of going through all these steps
          if (slackLinking) {
            // Find any Cord Slack users which have that Slack externalID (Slack user
            // ids are only guaranteed to be unique to a workplace, so there
            // may be multiple results here although it seems unlikely)
            // And find the org members of the linked Slack org, so we can check
            // which of the users if we found (if multiple) is the relevant one
            const [slackUsers, slackOrgMembers] = await Promise.all([
              UserEntity.findAll({
                where: { externalID: node.user.id, externalProvider: 'slack' },
              }),
              OrgMembersEntity.findAll({
                where: { orgID: slackLinking.linkedOrgID },
              }),
            ]);

            const slackOrgMemberUserIDs = slackOrgMembers.map(
              (om) => om.userID,
            );
            for (const slackUser of slackUsers) {
              if (slackOrgMemberUserIDs.includes(slackUser.id)) {
                user = slackUser;
              }
            }
          }
        }

        // Still none? Time to error
        if (!user) {
          throw new ApiCallerError('user_not_found', {
            message: 'Could not find mentioned user with ID ' + node.user.id,
          });
        }
        return {
          ...node,
          user: { id: user.id },
        };
      } else if ('children' in node) {
        return {
          ...node,
          children: await internalizeContent(
            node.children,
            platformApplicationID,
            orgID,
          ),
        };
      }
      return node;
    }),
  );
}

export async function buildMessageVariablesReactions(
  loaders: RequestContextLoaders,
  internalMessageID: UUID,
): Promise<Reaction[]> {
  const messageReactions =
    await loaders.messageReactionLoader.loadReactionsForMessageNoOrgCheck(
      internalMessageID,
    );

  const usersWithReactions = unique(
    messageReactions.map((reaction) => reaction.userID),
  );

  const reactionUsers = await loaders.userLoader.loadUsers(usersWithReactions);

  const internalIDtoExternalID = new Map();

  for (const reactionUser of reactionUsers) {
    if (!internalIDtoExternalID.has(reactionUser.id)) {
      internalIDtoExternalID.set(reactionUser.id, reactionUser.externalID);
    }
  }

  return messageReactions.map((messageReaction) => {
    return {
      reaction: messageReaction.unicodeReaction,
      userID: internalIDtoExternalID.get(messageReaction.userID),
      timestamp: new Date(messageReaction.timestamp),
    };
  });
}

export async function getValidExternalToInternalReactionUsers(
  context: RequestContext,
  externalReactionUserIDs: string[],
  org: OrgEntity,
) {
  const platformApplicationID = assertViewerHasPlatformApplicationID(
    context.session.viewer,
  );

  const internalReactionUsers = await Promise.all(
    externalReactionUserIDs.map(async (externalReactionUserID) => {
      const user = await context.loaders.userLoader.loadUserByExternalID(
        platformApplicationID,
        externalReactionUserID,
      );

      if (user) {
        return user;
      } else {
        throw new ApiCallerError('user_not_found', {
          message: `User with ID ${externalReactionUserID} does not exist.`,
        });
      }
    }),
  );

  const externalIDtoInternalID = new Map<string, UserEntity>();

  for (const reactionUser of internalReactionUsers) {
    if (!externalIDtoInternalID.has(reactionUser.externalID)) {
      externalIDtoInternalID.set(reactionUser.externalID, reactionUser);
    }
  }

  await Promise.all(
    internalReactionUsers.map(async (internalReactionUser) => {
      const orgMembership =
        await context.loaders.orgMembersLoader.loadUserOrgMembership(
          internalReactionUser.id,
          org.id,
        );

      if (!orgMembership) {
        throw new ApiCallerError('user_not_in_organization', {
          message: `User with ID '${internalReactionUser.externalID}' does not belong in organization ${org.externalID}.`,
        });
      }
    }),
  );

  return externalIDtoInternalID;
}
