import { APP_ORIGIN } from 'common/const/Urls.ts';

export type MessageActionsType = 'thread_resolved' | 'thread_unresolved';

export const MessageActions: { [Key in MessageActionsType]: string } = {
  thread_resolved: 'resolved this thread',
  thread_unresolved: 'reopened this thread',
};

export const MessageActionIconURLs: { [Key in MessageActionsType]: string } = {
  thread_resolved: APP_ORIGIN + '/static/check-circle.svg',
  thread_unresolved: APP_ORIGIN + '/static/arrow-circle-up-right.svg',
};

export const MessageActionTranslationKeys: {
  [Key in MessageActionsType]: string;
} = {
  thread_resolved: 'cord.thread_resolved',
  thread_unresolved: 'cord.thread_unresolved',
};
