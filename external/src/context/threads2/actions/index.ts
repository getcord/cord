import { MergeParticipantAction } from 'external/src/context/threads2/actions/MergeParticipant.ts';
import { SetPropertiesAction } from 'external/src/context/threads2/actions/SetProperties.ts';
import { AddFirstMessageOfAPILoadAction } from 'external/src/context/threads2/actions/AddFirstMessageOfAPILoad.ts';
import { AddReactionAction } from 'external/src/context/threads2/actions/AddReaction.ts';
import { AddThreadAction } from 'external/src/context/threads2/actions/AddThread.tsx';
import { MarkThreadsSeenAction } from 'external/src/context/threads2/actions/MarkThreadsSeen.ts';
import { MergeMessageAction } from 'external/src/context/threads2/actions/MergeMessage.ts';
import { MergeThreadAction } from 'external/src/context/threads2/actions/MergeThread.tsx';
import { SetThreadIDsAction } from 'external/src/context/threads2/actions/SetThreadIDs.ts';
import { RemoveMessageAction } from 'external/src/context/threads2/actions/RemoveMessage.ts';
import { RemoveReactionAction } from 'external/src/context/threads2/actions/RemoveReaction.ts';
import { SetDraftMessageInComposerAction } from 'external/src/context/threads2/actions/SetDraftMessageInComposer.tsx';
import { SetMessagesAction } from 'external/src/context/threads2/actions/SetMessages.ts';
import { SetOlderMessagesCountAction } from 'external/src/context/threads2/actions/SetOlderMessagesCount.ts';
import { SetSharedToSlackAction } from 'external/src/context/threads2/actions/SetSharedToSlack.ts';
import { SetSubscribedAction } from 'external/src/context/threads2/actions/SetSubscribed.ts';
import { SetThreadsAction } from 'external/src/context/threads2/actions/SetThreads.tsx';
import { SetTypingUsersAction } from 'external/src/context/threads2/actions/SetTypingUsers.ts';
import { UpdateMessageAction } from 'external/src/context/threads2/actions/UpdateMessage.ts';
import { AppendMessageContentAction } from 'external/src/context/threads2/actions/AppendMessageContent.ts';
import { AddExternalIDMappingAction } from 'external/src/context/threads2/actions/AddExternalIDMapping.ts';
import { RemoveThreadAction } from 'external/src/context/threads2/actions/RemoveThread.tsx';

export const threadsAction = {
  addFirstMessageOfAPILoad: AddFirstMessageOfAPILoadAction,
  addReaction: AddReactionAction,
  addThread: AddThreadAction,
  markThreadsSeen: MarkThreadsSeenAction,
  mergeMessage: MergeMessageAction,
  mergeParticipant: MergeParticipantAction,
  mergeThread: MergeThreadAction,
  removeThread: RemoveThreadAction,
  removeMessage: RemoveMessageAction,
  removeReaction: RemoveReactionAction,
  setMessages: SetMessagesAction,
  setOlderMessagesCount: SetOlderMessagesCountAction,
  setSharedToSlack: SetSharedToSlackAction,
  setSubscribed: SetSubscribedAction,
  setProperties: SetPropertiesAction,
  setThreadIDs: SetThreadIDsAction,
  setThreads: SetThreadsAction,
  setTypingUsers: SetTypingUsersAction,
  updateMessage: UpdateMessageAction,
  appendMessageContent: AppendMessageContentAction,
  setDraftMessageInComposer: SetDraftMessageInComposerAction,
  addExternalIDMapping: AddExternalIDMappingAction,
};
