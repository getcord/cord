import FileAPI from 'docs/server/routes/apisAndHooks/fileAPI/FileAPI.tsx';
import AnnotationsAPI from 'docs/server/routes/apisAndHooks/annotationsAPI/AnnotationsAPI.tsx';
import NotificationAPI from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationAPI.tsx';
import PresenceAPI from 'docs/server/routes/apisAndHooks/presenceAPI/PresenceAPI.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import type { LinkCardData } from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import ScreenshotConfigAPI from 'docs/server/routes/apisAndHooks/screenshotConfigAPI/ScreenshotConfigAPI.tsx';
import Initialization from 'docs/server/routes/apisAndHooks/initialization/Initialization.tsx';

export const jsApisAndHooksCardList: LinkCardData[] = [
  {
    name: Initialization.title,
    linkTo: Initialization.uri,
    description: 'How to initialize Cord in the browser',
  },
  {
    name: AnnotationsAPI.title,
    linkTo: AnnotationsAPI.uri,
    description: `A powerful and flexible API for adding annotations to your application`,
  },
  {
    name: ThreadAPI.title,
    linkTo: ThreadAPI.uri,
    description: `Get activity information for a specific thread id or location, to use for badge counts, typing indicators and much more`,
  },
  {
    name: UserAPI.title,
    linkTo: UserAPI.uri,
    description: `Fetch information about the viewer or other users you've synced`,
  },
  {
    name: PresenceAPI.title,
    linkTo: PresenceAPI.uri,
    description: PresenceAPI.subtitle,
  },
  {
    name: NotificationAPI.title,
    linkTo: NotificationAPI.uri,
    description: `Get a notification activity summary to build custom UI indicators such as unread badge counts.`,
  },
  {
    name: FileAPI.title,
    linkTo: FileAPI.uri,
    description: FileAPI.subtitle,
  },
  {
    name: ScreenshotConfigAPI.title,
    linkTo: ScreenshotConfigAPI.uri,
    description: "Control what to include in Cord's screenshots",
  },
];
