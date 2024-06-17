import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ActionReducer } from 'external/src/context/common.ts';
import { contextReducer } from 'external/src/context/common.ts';
import { SetAttachmentsReducer } from 'external/src/context/composer/actions/SetAttachments.ts';
import { AddAttachmentReducer } from 'external/src/context/composer/actions/AddAttachment.ts';
import { RemoveAttachmentReducer } from 'external/src/context/composer/actions/RemoveAttachment.ts';
import { SetAttachmentUploadStatusReducer } from 'external/src/context/composer/actions/SetAttachmentUploadStatus.ts';
import { ResetComposerStateReducer } from 'external/src/context/composer/actions/ResetComposerState.ts';
import { SetEditingReducer } from 'external/src/context/composer/actions/SetEditing.ts';
import { SetTaskReducer } from 'external/src/context/composer/actions/SetTask.ts';
import { SetTaskTypeReducer } from 'external/src/context/composer/actions/SetTaskTypeAction.ts';
import { AddTodoReducer } from 'external/src/context/composer/actions/AddTodo.ts';
import { RemoveTodoReducer } from 'external/src/context/composer/actions/RemoveTodo.ts';
import { UpdateTodoReducer } from 'external/src/context/composer/actions/UpdateTodo.ts';
import { AddAssigneeReducer } from 'external/src/context/composer/actions/AddAssignee.ts';
import { RemoveAssigneeReducer } from 'external/src/context/composer/actions/RemoveAssignee.ts';
import { SetShakingTodoReducer } from 'external/src/context/composer/actions/SetShakingTodo.ts';

const actions = new Map<ComposerActions, ActionReducer<ComposerState>>([
  [ComposerActions.SET_ATTACHMENTS, SetAttachmentsReducer],
  [ComposerActions.ADD_ATTACHMENT, AddAttachmentReducer],
  [ComposerActions.REMOVE_ATTACHMENT, RemoveAttachmentReducer],
  [
    ComposerActions.SET_ATTACHMENT_UPLOAD_STATUS,
    SetAttachmentUploadStatusReducer,
  ],
  [ComposerActions.RESET_COMPOSER_STATE, ResetComposerStateReducer],
  [ComposerActions.SET_EDITING, SetEditingReducer],
  [ComposerActions.SET_TASK, SetTaskReducer],
  [ComposerActions.SET_TASK_TYPE, SetTaskTypeReducer],
  [ComposerActions.ADD_TODO, AddTodoReducer],
  [ComposerActions.REMOVE_TODO, RemoveTodoReducer],
  [ComposerActions.UPDATE_TODO, UpdateTodoReducer],
  [ComposerActions.ADD_ASSIGNEE, AddAssigneeReducer],
  [ComposerActions.REMOVE_ASSIGNEE, RemoveAssigneeReducer],
  [ComposerActions.SET_SHAKING_TODO, SetShakingTodoReducer],
]);

export default contextReducer(actions);
