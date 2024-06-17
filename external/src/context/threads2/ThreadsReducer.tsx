import type { ActionReducer } from 'external/src/context/common.ts';
import { contextReducer } from 'external/src/context/common.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import { AddThreadReducer } from 'external/src/context/threads2/actions/AddThread.tsx';
import { MergeThreadReducer } from 'external/src/context/threads2/actions/MergeThread.tsx';
import { AddReactionReducer } from 'external/src/context/threads2/actions/AddReaction.ts';
import { MarkThreadsSeenReducer } from 'external/src/context/threads2/actions/MarkThreadsSeen.ts';
import { MergeMessageReducer } from 'external/src/context/threads2/actions/MergeMessage.ts';
import { RemoveMessageReducer } from 'external/src/context/threads2/actions/RemoveMessage.ts';
import { RemoveReactionReducer } from 'external/src/context/threads2/actions/RemoveReaction.ts';
import { SetMessagesReducer } from 'external/src/context/threads2/actions/SetMessages.ts';
import { SetOlderMessagesCountReducer } from 'external/src/context/threads2/actions/SetOlderMessagesCount.ts';
import { UpdateMessageReducer } from 'external/src/context/threads2/actions/UpdateMessage.ts';
import { AppendMessageContentReducer } from 'external/src/context/threads2/actions/AppendMessageContent.ts';
import { SetThreadsReducer } from 'external/src/context/threads2/actions/SetThreads.tsx';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { SetTypingUsersReducer } from 'external/src/context/threads2/actions/SetTypingUsers.ts';
import { SetSubscribedReducer } from 'external/src/context/threads2/actions/SetSubscribed.ts';
import { SetSharedToSlackReducer } from 'external/src/context/threads2/actions/SetSharedToSlack.ts';
import { AddFirstMessageOfAPILoadReducer } from 'external/src/context/threads2/actions/AddFirstMessageOfAPILoad.ts';
import { SetThreadIDsReducer } from 'external/src/context/threads2/actions/SetThreadIDs.ts';
import { SetDraftMessageInComposerReducer } from 'external/src/context/threads2/actions/SetDraftMessageInComposer.tsx';
import { SetPropertiesReducer } from 'external/src/context/threads2/actions/SetProperties.ts';
import { MergeParticipantReducer } from 'external/src/context/threads2/actions/MergeParticipant.ts';
import { AddExternalIDMappingReducer } from 'external/src/context/threads2/actions/AddExternalIDMapping.ts';
import { RemoveThreadReducer } from 'external/src/context/threads2/actions/RemoveThread.tsx';

const actions = new Map<ThreadsActions, ActionReducer<ThreadsState>>([
  [
    ThreadsActions.ADD_FIRST_MESSAGE_OF_API_LOAD,
    AddFirstMessageOfAPILoadReducer,
  ],
  [ThreadsActions.ADD_REACTION, AddReactionReducer],
  [ThreadsActions.ADD_THREAD, AddThreadReducer],
  [ThreadsActions.MARK_THREADS_SEEN, MarkThreadsSeenReducer],
  [ThreadsActions.MERGE_MESSAGE, MergeMessageReducer],
  [ThreadsActions.MERGE_PARTICIPANT, MergeParticipantReducer],
  [ThreadsActions.MERGE_THREAD, MergeThreadReducer],
  [ThreadsActions.REMOVE_MESSAGE, RemoveMessageReducer],
  [ThreadsActions.REMOVE_REACTION, RemoveReactionReducer],
  [ThreadsActions.SET_MESSAGES, SetMessagesReducer],
  [ThreadsActions.SET_OLDER_MESSAGES_COUNT, SetOlderMessagesCountReducer],
  [ThreadsActions.SET_PROPERTIES, SetPropertiesReducer],
  [ThreadsActions.SET_SHARED_TO_SLACK, SetSharedToSlackReducer],
  [ThreadsActions.SET_SUBSCRIBED, SetSubscribedReducer],
  [ThreadsActions.SET_THREAD_IDS, SetThreadIDsReducer],
  [ThreadsActions.SET_THREADS, SetThreadsReducer],
  [ThreadsActions.SET_TYPING_USERS, SetTypingUsersReducer],
  [ThreadsActions.UPDATE_MESSAGE, UpdateMessageReducer],
  [ThreadsActions.APPEND_MESSAGE_CONTENT, AppendMessageContentReducer],
  [
    ThreadsActions.SET_DRAFT_MESSAGE_IN_COMPOSER,
    SetDraftMessageInComposerReducer,
  ],
  [ThreadsActions.ADD_EXTERNAL_ID_MAPPING, AddExternalIDMappingReducer],
  [ThreadsActions.REMOVE_THREAD, RemoveThreadReducer],
]);

export default contextReducer(actions);
