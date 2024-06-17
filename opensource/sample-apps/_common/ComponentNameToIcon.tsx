import { AvatarIcon } from './componentIcons/AvatarIcon';
import { PagePresenceIcon } from './componentIcons/PagePresenceIcon';
import { ThreadIcon } from './componentIcons/ThreadIcon';
import { ThreadedCommentsIcon } from './componentIcons/ThreadedCommentsIcon';
import { PresenceFacepileIcon } from './componentIcons/PresenceFacepileIcon';
import { PresenceObserverIcon } from './componentIcons/PresenceObserverIcon';
import { PinIcon } from './componentIcons/PinIcon';
import { NotificationListLauncherIcon } from './componentIcons/NotificationListLauncherIcon';
import { MessageIcon } from './componentIcons/MessageIcon';

export type ComponentNames =
  | 'cord-avatar'
  | 'cord-message'
  | 'cord-notification-list-launcher'
  | 'cord-page-presence'
  | 'cord-pin'
  | 'cord-presence-facepile'
  | 'cord-presence-observer'
  | 'cord-thread'
  | 'cord-threaded-comments';

export function ComponentNameToIcon(
  componentName: ComponentNames,
  darkMode: boolean,
) {
  switch (componentName) {
    case 'cord-avatar': {
      return <AvatarIcon darkMode={darkMode} />;
    }
    case 'cord-message': {
      return <MessageIcon darkMode={darkMode} />;
    }
    case 'cord-notification-list-launcher': {
      return <NotificationListLauncherIcon darkMode={darkMode} />;
    }
    case 'cord-page-presence': {
      return <PagePresenceIcon darkMode={darkMode} />;
    }
    case 'cord-pin': {
      return <PinIcon darkMode={darkMode} />;
    }
    case 'cord-presence-facepile': {
      return <PresenceFacepileIcon darkMode={darkMode} />;
    }
    case 'cord-presence-observer': {
      return <PresenceObserverIcon darkMode={darkMode} />;
    }
    case 'cord-thread': {
      return <ThreadIcon darkMode={darkMode} />;
    }
    case 'cord-threaded-comments': {
      return <ThreadedCommentsIcon darkMode={darkMode} />;
    }
    default: {
      const _: never = componentName;
      return <AvatarIcon darkMode={darkMode} />;
    }
  }
}
