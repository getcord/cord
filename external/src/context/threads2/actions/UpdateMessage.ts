import { action, actionReducer } from 'external/src/context/common.ts';
import type {
  AnnotationAttachmentInput,
  MessageFragment,
  TaskFragment,
} from 'external/src/graphql/operations.ts';
import type {
  FileAttachmentInput,
  MessageContent,
  UUID,
} from 'common/types/index.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';

export type UpdateMessageFields = {
  id: UUID;
  content: MessageContent | null;
  deletedTimestamp: string | null;
  lastUpdatedTimestamp: string | null;
  fileAttachments: FileAttachmentInput[];
  annotationAttachments: AnnotationAttachmentInput[];
  task: TaskFragment | null;
  referencedUserData: MessageFragment['referencedUserData'];
  sourceID: string;
};

type UpdateMessagePayload = { threadID: UUID } & Partial<UpdateMessageFields>;

export const UpdateMessageAction = action<UpdateMessagePayload>(
  ThreadsActions.UPDATE_MESSAGE,
);

export const UpdateMessageReducer = actionReducer(
  (state: ThreadsState, payload: UpdateMessagePayload) => {
    const { threadID, ...updateMessageFields } = payload;
    //Spread the state into the thread variable, otherwise the map below directly mutates the state passed in from the prop
    const thread = { ...state.threadsData[threadID] };

    if (!thread) {
      return state;
    }

    const newMessages = thread.messages.map((message, index) => {
      if (message.id !== updateMessageFields.id) {
        return message;
      }

      if (
        Boolean(updateMessageFields.deletedTimestamp) &&
        !message.deletedTimestamp
      ) {
        // Deleting
        thread.messagesCountExcludingDeleted -= 1;
        if (message.type === 'user_message') {
          thread.userMessagesCount--;
        } else {
          thread.actionMessagesCount--;
        }

        // only edit if it's not the first message
        if (index > 0 && thread.replyCount > 0) {
          thread.replyCount -= 1;
        }
      }
      if (
        !updateMessageFields.deletedTimestamp &&
        Boolean(message.deletedTimestamp)
      ) {
        // Undo-ing a delete
        thread.messagesCountExcludingDeleted += 1;
        if (message.type === 'user_message') {
          thread.userMessagesCount++;
        } else {
          thread.actionMessagesCount++;
        }

        // only edit if it's not the first message
        if (index > 0) {
          thread.replyCount += 1;
        }
      }
      return {
        ...message,
        ...updateMessageFields,
      };
    });

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: {
          ...thread,
          messages: newMessages,
        },
      },
    };
  },
);
