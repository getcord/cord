import type { UUID, MessageContent } from 'common/types/index.ts';
import type {
  MessageFragment,
  TaskFragment,
} from 'external/src/graphql/operations.ts';

export type SlackChannelType = {
  slackID: UUID;
  name: string;
};

export type UndeletedMessage = MessageFragment & {
  deletedTimestamp: null;
  content: MessageContent;
};

export type MessageWithTask = MessageFragment & { task: TaskFragment };
