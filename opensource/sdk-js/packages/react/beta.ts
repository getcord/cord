// This file is kept purely for backwards compatibility reasons.
// Everything here should either be available directly or can be found under betaV2.
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

export type { NotificationListLauncherReactComponentProps } from './components/NotificationListLauncher.js';
export { NotificationListLauncher } from './components/NotificationListLauncher.js';

export { useThreadSummary as useCordThreadSummary } from './hooks/thread.js';

export type { PinReactComponentProps } from './components/Pin.js';
export { Pin } from './components/Pin.js';
// Please DO NOT add anything new here!
