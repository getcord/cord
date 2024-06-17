import { v4 as uuid } from 'uuid';

import type { AddReactionPayload } from 'external/src/context/threads2/actions/AddReaction.ts';
import type {
  MessageReactionFragment,
  TaskFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';

export function createReactionPayload({
  unicodeReaction,
  user,
  messageID,
  threadID,
  task,
}: {
  unicodeReaction: string;
  user: UserFragment;
  messageID: UUID;
  threadID: UUID;
  task?: TaskFragment;
}): AddReactionPayload {
  const reactionFragment: MessageReactionFragment = {
    __typename: 'MessageReaction',
    id: uuid(),
    user,
    unicodeReaction,
    timestamp: new Date().toISOString(),
  };

  return {
    threadID,
    messageID,
    reaction: reactionFragment,
    task,
  };
}
