import type { MessageActionsType } from 'common/const/MessageActions.ts';
import { MessageActions } from 'common/const/MessageActions.ts';
import type { MessageContent } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import {
  createMentionNode,
  createMessageTextNode,
} from '@cord-sdk/react/common/lib/messageNode.ts';

export function getActionMessageContent(
  type: MessageActionsType,
  user: UserEntity,
): MessageContent {
  return [
    {
      type: MessageNodeType.PARAGRAPH,
      children: [
        createMentionNode(user.id, userDisplayName(user)),
        createMessageTextNode(' ' + MessageActions[type]),
      ],
    },
  ];
}
