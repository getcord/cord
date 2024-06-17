import { cordifyClassname } from '../common/cordifyClassname.js';

export const thread = cordifyClassname('thread');

export const container = cordifyClassname('thread-container');
export const inlineThread = cordifyClassname('inline-thread');

// MessageBlock
export const messageBlock = cordifyClassname('message-block');

// UnreadMessageIndicator
export const unreadMessageIndicator = cordifyClassname(
  'unread-message-indicator',
);
export const subscribed = cordifyClassname('subscribed');

// TypingUsers
export const typing = cordifyClassname('typing-indicator-container');
export const typingIndicator = cordifyClassname('typing-indicators');

// ThreadHeader
export const threadHeader = cordifyClassname('thread-header-container');

// ResolvedThreadHeader
export const resolvedThreadHeader = cordifyClassname(
  'resolved-thread-header-container',
);
export const resolvedThreadHeaderText = cordifyClassname(
  'resolved-thread-header-text',
);

// CollapsedThread
export const collapsedThread = cordifyClassname('collapsed-thread');

export const threadFooterContainer = cordifyClassname(
  'thread-footer-container',
);

// LoadOlderMessages
export const loadOlderMessages = cordifyClassname(
  'load-older-messages-container',
);

// WrapperThread
export const clickableThread = cordifyClassname('clickable-thread');

// SeenBy
export const threadSeenBy = cordifyClassname('thread-seen-by-container');
