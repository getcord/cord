// The CSS reset must be imported first, as we rely on CSS order rather
// than specificity; because both reset and styles are 0,1,0 to make
// developers' life easier.
import './reset.css.js';

import type {} from '@cord-sdk/jsx';

export type { CordContextValue } from './contexts/CordContext.js';
export { CordProvider, CordContext } from './contexts/CordContext.js';
export type { LiveCursorsReactComponentProps } from './components/LiveCursors.js';
export {
  LiveCursors,
  defaultEventToLocation as liveCursorsDefaultEventToLocation,
  defaultLocationToDocument as liveCursorsDefaultLocationToDocument,
} from './components/LiveCursors.js';
export type { LiveCursorsCursorProps } from './components/LiveCursorsDefaultCursor.js';
export {
  LiveCursorsDefaultCursor,
  LiveCursorsDefaultClick,
} from './components/LiveCursorsDefaultCursor.js';
export type { PagePresenceReactComponentProps } from './components/PagePresence.js';
export { PagePresence } from './components/PagePresence.js';
export type { PresenceFacepileReactComponentProps } from './components/PresenceFacepile.js';
export { PresenceFacepile } from './components/PresenceFacepile.js';
export type { PresenceObserverReactComponentProps } from './components/PresenceObserver.js';
export { PresenceObserver } from './components/PresenceObserver.js';
export type { SidebarReactComponentProps } from './components/Sidebar.js';
export { Sidebar } from './components/Sidebar.js';
export type { SidebarLauncherReactComponentProps } from './components/SidebarLauncher.js';
export { SidebarLauncher } from './components/SidebarLauncher.js';
export type { ThreadReactComponentProps } from './components/Thread.js';
export { Thread } from './components/Thread.js';
export type { ThreadListReactComponentProps } from './components/ThreadList.js';
export { ThreadList } from './components/ThreadList.js';
export { useCordContext, useCordLocation } from './hooks/useCordLocation.js';
export type { PresenceReducerOptions } from './types.js';
export {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
  useCordAnnotationClickHandler,
  useCordAnnotationRenderer,
} from './hooks/useCordAnnotationTargetRef.js';
export { useCordTranslation, CordTrans } from './hooks/useCordTranslation.js';
export type { InboxLauncherReactComponentProps } from './components/InboxLauncher.js';
export { InboxLauncher } from './components/InboxLauncher.js';
export type { InboxReactComponentProps } from './components/Inbox.js';
export { Inbox } from './components/Inbox.js';
export type {
  FloatingThreadsReactComponentProps,
  FloatingThreadsReactComponentProps as AnchoredThreadsReactComponentProps,
} from './components/FloatingThreads.js';
export {
  FloatingThreads,
  FloatingThreads as AnchoredThreads,
} from './components/FloatingThreads.js';
export type { NotificationListReactComponentProps } from './components/NotificationList.js';
export { NotificationList } from './components/NotificationList.js';
export type { NotificationReactComponentProps } from './components/Notification.js';
export { Notification } from './components/Notification.js';
export type { NotificationListLauncherReactComponentProps } from './components/NotificationListLauncher.js';
export { NotificationListLauncher } from './components/NotificationListLauncher.js';
export type { AvatarReactComponentProps } from './components/Avatar.js';
export { Avatar } from './components/Avatar.js';
export type { ComposerReactComponentProps } from './components/Composer.js';
export { Composer } from './components/Composer.js';
export type { FacepileReactComponentProps } from './components/Facepile.js';
export { Facepile } from './components/Facepile.js';
export type { MessageReactComponentProps } from './components/Message.js';
export { Message } from './components/Message.js';
export type { PinReactComponentProps } from './components/Pin.js';
export { Pin } from './components/Pin.js';
export type { ThreadedCommentsReactComponentProps } from './components/ThreadedComments.js';
export { ThreadedComments } from './components/ThreadedComments.js';
export type { TimestampReactComponentProps } from './components/Timestamp.js';
export { Timestamp } from './components/Timestamp.js';
export type { ReactionsReactComponentProps } from './components/Reactions.js';
export { Reactions } from './components/Reactions.js';
export type { MessageContentReactComponentProps } from './components/MessageContent.js';
export { MessageContent } from './components/MessageContent.js';

export * as notification from './hooks/notification.js';
export * as presence from './hooks/presence.js';
export * as thread from './hooks/thread.js';
export * as user from './hooks/user.js';

export * as experimental from './experimental.js';
export * as betaV2 from './betaV2.js';

// --- Exports kept for backwards-compat only:

export * as beta from './beta.js';
export { useNotificationCounts as useCordNotificationSummary } from './hooks/notification.js';
export { usePresence as useCordPresentUsers } from './hooks/presence.js';
export {
  useLocationSummary as useCordThreadActivitySummary,
  useThreadSummary as useCordThreadSummary,
} from './hooks/thread.js';

export { UNDO_DELETE_MESSAGE_TIMEOUT_SECONDS } from './common/const/Timing.js';
