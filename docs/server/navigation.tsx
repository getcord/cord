/** @jsxImportSource @emotion/react */

import EventsWebhook from 'docs/server/routes/reference/eventsWebhook/EventsWebhook.tsx';
import DashboardGuide from 'docs/server/routes/howTo/dashboardGuide/DashboardGuide.tsx';
import Search from 'docs/server/routes/search/Search.tsx';
import GetStarted from 'docs/server/routes/getStarted/GetStarted.tsx';
import DemoApps from 'docs/server/routes/getStarted/demoApps/DemoApps.tsx';
import IntegrationGuide from 'docs/server/routes/getStarted/integrationGuide/IntegrationGuide.tsx';

import Components from 'docs/server/routes/components/Components.tsx';
import CordFloatingThreads from 'docs/server/routes/components/floatingThreads/FloatingThreads.tsx';
import CordThread from 'docs/server/routes/components/thread/Thread.tsx';
import CordThreadList from 'docs/server/routes/components/threadList/ThreadList.tsx';
import CordInboxLauncher from 'docs/server/routes/components/inboxLauncher/InboxLauncher.tsx';
import CordInbox from 'docs/server/routes/components/inbox/Inbox.tsx';
import CordNotificationListLauncher from 'docs/server/routes/components/notificationListLauncher/NotificationListLauncher.tsx';
import CordNotificationList from 'docs/server/routes/components/notificationList/NotificationList.tsx';
import CordPagePresence from 'docs/server/routes/components/pagePresence/PagePresence.tsx';
import CordPresenceFacepile from 'docs/server/routes/components/presenceFacepile/PresenceFacepile.tsx';
import PresenceObserver from 'docs/server/routes/components/presenceObserver/PresenceObserver.tsx';
import Sidebar from 'docs/server/routes/components/sidebar/Sidebar.tsx';
import SidebarLauncher from 'docs/server/routes/components/sidebarLauncher/SidebarLauncher.tsx';
import HowTo from 'docs/server/routes/howTo/HowTo.tsx';
import CustomRedirectLink from 'docs/server/routes/customization/customRedirectLink/CustomRedirectLink.tsx';
import ImproveAnnotationAccuracy from 'docs/server/routes/howTo/improveAnnotationAccuracy/ImproveAnnotationAccuracy.tsx';
import AddCustomPageTitle from 'docs/server/routes/customization/addCustomPageTitle/AddCustomPageTitle.tsx';
import SupportIframesInAnnotationScreenshots from 'docs/server/routes/howTo/supportIframesInAnnotationScreenshots/SupportIframesInAnnotationScreenshots.tsx';
import SegmentEventLogging from 'docs/server/routes/customization/segmentEventLogging/SegmentEventLogging.tsx';
import CustomS3Bucket from 'docs/server/routes/customization/customS3Bucket/CustomS3Bucket.tsx';
import Authentication from 'docs/server/routes/reference/authentication/Authentication.tsx';
import BrowserSupport from 'docs/server/routes/reference/browserSupport/BrowserSupport.tsx';
import CSSCustomization from 'docs/server/routes/customization/cssCustomization/CSSCustomization.tsx';
import Reference from 'docs/server/routes/reference/Reference.tsx';
// eslint-disable-next-line @cspell/spellchecker -- supposed to auto-ignore imports, looks like a bug.
import RESTAPI from 'docs/server/routes/restAPIs/RESTAPIs.tsx';
import RESTAuthentication from 'docs/server/routes/restAPIs/authentication/Authentication.tsx';
import Users from 'docs/server/routes/restAPIs/users/Users.tsx';
import Organizations from 'docs/server/routes/restAPIs/organizations/Organizations.tsx';
import Batch from 'docs/server/routes/restAPIs/batch/Batch.tsx';
import Notifications from 'docs/server/routes/restAPIs/notifications/Notifications.tsx';
import Applications from 'docs/server/routes/restAPIs/applications/Applications.tsx';
import Errors from 'docs/server/routes/restAPIs/errors/Errors.tsx';
import ServerLibraries from 'docs/server/routes/reference/serverLibraries/ServerLibraries.tsx';
import Changelog from 'docs/server/routes/reference/changelog/Changelog.tsx';
import LiveCSSEditor from 'docs/server/routes/getStarted/liveCSSEditor/LiveCSSEditor.tsx';
import NotificationAPI from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationAPI.tsx';
import ApisAndHooks from 'docs/server/routes/apisAndHooks/JsApisAndHooks.tsx';
import AnnotationsAPI from 'docs/server/routes/apisAndHooks/annotationsAPI/AnnotationsAPI.tsx';
import PresenceAPI from 'docs/server/routes/apisAndHooks/presenceAPI/PresenceAPI.tsx';
import ScreenshotConfigAPI from 'docs/server/routes/apisAndHooks/screenshotConfigAPI/ScreenshotConfigAPI.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import Identifiers from 'docs/server/routes/reference/identifiers/Identifiers.tsx';
import Location from 'docs/server/routes/reference/location/Location.tsx';
import Initialization from 'docs/server/routes/apisAndHooks/initialization/Initialization.tsx';

import InstallCord from 'docs/server/routes/getStarted/integrationGuide/01-InstallCord.tsx';
import InitializeCord from 'docs/server/routes/getStarted/integrationGuide/02-InitializeCord.tsx';
import AddPresence from 'docs/server/routes/getStarted/integrationGuide/03-AddPresence.tsx';
import CustomizeTheAppearance from 'docs/server/routes/getStarted/integrationGuide/04-CustomizeTheAppearance.tsx';
import AddThread from 'docs/server/routes/getStarted/integrationGuide/05-AddThread.tsx';
import CustomizeTheThread from 'docs/server/routes/getStarted/integrationGuide/06-CustomizeTheThread.tsx';
import GetCordAccount from 'docs/server/routes/getStarted/integrationGuide/07-GetYourCordAccount.tsx';
import CreateFirstUser from 'docs/server/routes/getStarted/integrationGuide/08-CreateFirstUser.tsx';
import SetupBackend from 'docs/server/routes/getStarted/integrationGuide/09-SetUpBackend.tsx';
import CreateAnAuthToken from 'docs/server/routes/getStarted/integrationGuide/10-CreateAnAuthToken.tsx';
import AddMultipleUsers from 'docs/server/routes/getStarted/integrationGuide/11-AddMultipleUsers.tsx';
import CordComposer from 'docs/server/routes/components/composer/Composer.tsx';
import CordFacepile from 'docs/server/routes/components/Facepile/Facepile.tsx';
import Avatar from 'docs/server/routes/components/Avatar/Avatar.tsx';
import Message from 'docs/server/routes/components/Message/Message.tsx';
import ThreadedComments from 'docs/server/routes/components/ThreadedComments/ThreadedComments.tsx';
import Threads from 'docs/server/routes/restAPIs/threads/Threads.tsx';
import CordPin from 'docs/server/routes/components/pin/Pin.tsx';
import Messages from 'docs/server/routes/restAPIs/messages/Messages.tsx';
import Presence from 'docs/server/routes/restAPIs/presence/Presence.tsx';
import ThreadMessageAdded from 'docs/server/routes/reference/eventsWebhook/events/ThreadMessageAdded.tsx';
import CordReactions from 'docs/server/routes/components/reactions/Reactions.tsx';
import { ThreadedCommentsExamples } from 'docs/server/routes/customization/ThreadedCommentsExamples/ThreadedCommentsExamples.tsx';
import CordNotification from 'docs/server/routes/components/notification/Notification.tsx';
import CordTimestamp from 'docs/server/routes/components/timestamp/Timestamp.tsx';
import NotificationCreated from 'docs/server/routes/reference/eventsWebhook/events/NotificationCreated.tsx';
import ContentSecurityPolicy from 'docs/server/routes/reference/contentSecurityPolicy/ContentSecurityPolicy.tsx';
import URLVerification from 'docs/server/routes/reference/eventsWebhook/events/URLVerification.tsx';
import MessageContent from 'docs/server/routes/components/MessageContent/MessageContent.tsx';
import Preferences from 'docs/server/routes/restAPIs/preferences/Preferences.tsx';
import CreateCordMessages from 'docs/server/routes/howTo/createCordMessages/CreateCordMessages.tsx';
import CordLiveCursors from 'docs/server/routes/components/liveCursors/LiveCursors.tsx';
import FileAPI from 'docs/server/routes/apisAndHooks/fileAPI/FileAPI.tsx';
import Files from 'docs/server/routes/restAPIs/files/Files.tsx';
import CustomizeCordsText from 'docs/server/routes/customization/translations/CustomizeCordsText.tsx';
import InstallCordCLI from 'docs/server/routes/reference/cli/CordCli.tsx';
import Permissions from 'docs/server/routes/reference/permissions/Permissions.tsx';
import EmailNotifications from 'docs/server/routes/reference/emailNotifications/EmailNotifications.tsx';
import RemovingGroupFromToken from 'docs/server/routes/reference/authentication/RemovingGroupFromToken.tsx';
import CustomizeEmails from 'docs/server/routes/customization/emails/CustomizeEmails.tsx';
import Customization from 'docs/server/routes/customization/Customization.tsx';
import CustomReactComponents from 'docs/server/routes/customization/custom-react-components/CustomReactComponents.tsx';
import CustomReactComponentsTutorial from 'docs/server/routes/customization/custom-react-components/tutorial/CustomReactComponentsTutorial.tsx';
import type { CordVersion } from 'docs/server/App.tsx';
import { showBeta } from 'docs/lib/showBeta.ts';
import ChatbotSDK from 'docs/server/routes/chatbotSDK/ChatbotSDK.tsx';
import { Threads4 } from 'docs/server/routes/components/threads/Threads.tsx';
import MenuCustomization from 'docs/server/routes/customization/custom-react-components/menu-customization/MenuCustomization.tsx';

export type NavLink = {
  name: string;
  linkTo: string;
  description?: React.ReactNode;
  component?: React.ReactNode;
  subnav?: NavLink[];
  hidden?: boolean;
  version?: CordVersion[];
  showVersionToggle?: boolean;
};

const navigation: NavLink[] = [
  {
    name: 'Get started',
    linkTo: '/',
    component: <GetStarted />,
    subnav: [
      {
        name: 'Demo apps',
        linkTo: '/get-started/demo-apps',
        component: <DemoApps />,
      },
      {
        name: 'Integration guide',
        linkTo: '/get-started/integration-guide',
        component: <IntegrationGuide />,
        subnav: [
          {
            name: 'Install Cord',
            linkTo: '/get-started/integration-guide/install-cord',
            component: <InstallCord />,
          },
          {
            name: 'Initialize Cord',
            linkTo: '/get-started/integration-guide/initialize-cord',
            component: <InitializeCord />,
          },
          {
            name: 'Add Presence',
            linkTo: '/get-started/integration-guide/add-presence',
            component: <AddPresence />,
          },
          {
            name: 'Customize the Appearance',
            linkTo: '/get-started/integration-guide/customize-the-appearance',
            component: <CustomizeTheAppearance />,
          },
          {
            name: 'Add Thread',
            linkTo: '/get-started/integration-guide/add-thread',
            component: <AddThread />,
          },
          {
            name: 'Customize the Thread',
            linkTo: '/get-started/integration-guide/customize-the-thread',
            component: <CustomizeTheThread />,
          },
          {
            name: 'Get Your Cord Account',
            linkTo: '/get-started/integration-guide/cord-account',
            component: <GetCordAccount />,
          },
          {
            name: 'Create Your First User',
            linkTo: '/get-started/integration-guide/create-user',
            component: <CreateFirstUser />,
          },
          {
            name: 'Set Up Your Backend',
            linkTo: '/get-started/integration-guide/setup-backend',
            component: <SetupBackend />,
          },
          {
            name: 'Generate an Auth Token',
            linkTo: '/get-started/integration-guide/generate-an-auth-token',
            component: <CreateAnAuthToken />,
          },
          {
            name: 'Add Multiple Users',
            linkTo: '/get-started/integration-guide/add-multiple-users',
            component: <AddMultipleUsers />,
          },
        ],
      },
      {
        name: 'Live CSS editor',
        linkTo: '/get-started/live-css-editor',
        component: <LiveCSSEditor />,
      },
    ],
  },
  {
    name: 'Components',
    linkTo: '/components',
    component: <Components />,
    showVersionToggle: true,
    subnav: [
      {
        name: 'Thread',
        linkTo: '/components/cord-thread',
        component: <CordThread />,
      },
      {
        name: 'Threads',
        linkTo: '/components/cord-threads',
        component: <Threads4 />,
        version: ['2.0'],
        hidden: true,
      },
      {
        name: 'Thread List',
        linkTo: '/components/cord-thread-list',
        component: <CordThreadList />,
        version: ['1.0'],
      },
      {
        name: 'Composer',
        linkTo: '/components/cord-composer',
        component: <CordComposer />,
      },
      {
        name: 'Pin',
        linkTo: '/components/cord-pin',
        component: <CordPin />,
        version: ['1.0'],
      },
      {
        name: 'Message',
        linkTo: '/components/cord-message',
        component: <Message />,
      },
      {
        name: 'Message Content',
        linkTo: '/components/cord-message-content',
        component: <MessageContent />,
        version: ['1.0'],
      },
      {
        name: 'Threaded Comments',
        linkTo: '/components/cord-threaded-comments',
        component: <ThreadedComments />,
        version: ['1.0'],
      },
      {
        name: 'Notification List',
        linkTo: '/components/cord-notification-list',
        component: <CordNotificationList />,
        version: ['1.0'],
      },
      {
        name: 'Notification',
        linkTo: '/components/cord-notification',
        component: <CordNotification />,
        version: ['1.0'],
      },
      {
        name: 'Notification List Launcher',
        linkTo: '/components/cord-notification-list-launcher',
        component: <CordNotificationListLauncher />,
        version: ['1.0'],
      },
      {
        name: 'Page Presence',
        linkTo: '/components/cord-page-presence',
        component: <CordPagePresence />,
        version: ['1.0'],
      },
      {
        name: 'Presence Facepile',
        linkTo: '/components/cord-presence-facepile',
        component: <CordPresenceFacepile />,
        version: ['1.0'],
      },
      {
        name: 'Facepile',
        linkTo: '/components/cord-facepile',
        component: <CordFacepile />,
      },
      {
        name: 'Presence Observer',
        linkTo: '/components/cord-presence-observer',
        component: <PresenceObserver />,
      },
      {
        name: 'Live Cursors',
        linkTo: '/components/cord-live-cursors',
        component: <CordLiveCursors />,
        version: ['1.0'],
      },
      {
        name: 'Avatar',
        linkTo: '/components/cord-avatar',
        component: <Avatar />,
      },
      {
        name: 'Reactions',
        linkTo: '/components/cord-reactions',
        component: <CordReactions />,
        version: ['1.0'],
      },
      {
        name: 'Timestamp',
        linkTo: '/components/cord-timestamp',
        component: <CordTimestamp />,
        version: ['1.0'],
      },
      {
        name: 'Sidebar (Deprecated)',
        linkTo: '/components/cord-sidebar',
        component: <Sidebar />,
        version: ['1.0'],
      },
      {
        name: 'Sidebar Launcher (Deprecated)',
        linkTo: '/components/cord-sidebar-launcher',
        component: <SidebarLauncher />,
        version: ['1.0'],
      },
      {
        name: 'Floating Threads (Deprecated)',
        linkTo: '/components/cord-floating-threads',
        component: <CordFloatingThreads />,
        version: ['1.0'],
      },
      {
        name: 'Inbox (Deprecated)',
        linkTo: '/components/cord-inbox',
        component: <CordInbox />,
        version: ['1.0'],
      },
      {
        name: 'Inbox Launcher (Deprecated)',
        linkTo: '/components/cord-inbox-launcher',
        component: <CordInboxLauncher />,
        version: ['1.0'],
      },
    ],
  },
  {
    name: 'JavaScript APIs & Hooks',
    linkTo: '/js-apis-and-hooks',

    component: <ApisAndHooks />,
    subnav: [
      {
        name: Initialization.title,
        linkTo: Initialization.uri,
        component: <Initialization.Element />,
      },
      {
        name: AnnotationsAPI.title,
        linkTo: AnnotationsAPI.uri,
        component: <AnnotationsAPI.Element />,
      },
      {
        name: ThreadAPI.title,
        linkTo: ThreadAPI.uri,
        component: <ThreadAPI.Element />,
        subnav: ThreadAPI.navItems,
      },
      {
        name: UserAPI.title,
        linkTo: UserAPI.uri,
        component: <UserAPI.Element />,
        subnav: UserAPI.navItems,
      },
      {
        name: PresenceAPI.title,
        linkTo: PresenceAPI.uri,
        component: <PresenceAPI.Element />,
        subnav: PresenceAPI.navItems,
      },
      {
        name: NotificationAPI.title,
        linkTo: NotificationAPI.uri,
        component: <NotificationAPI.Element />,
        subnav: NotificationAPI.navItems,
      },
      {
        name: FileAPI.title,
        linkTo: FileAPI.uri,
        component: <FileAPI.Element />,
        subnav: FileAPI.navItems,
      },
      {
        name: ScreenshotConfigAPI.title,
        linkTo: ScreenshotConfigAPI.uri,
        component: <ScreenshotConfigAPI.Element />,
      },
    ],
  },
  {
    name: 'REST APIs',
    linkTo: '/rest-apis',
    component: <RESTAPI />,
    subnav: [
      {
        name: 'Authentication',
        linkTo: '/rest-apis/authentication',
        component: <RESTAuthentication />,
      },
      {
        name: 'Threads',
        linkTo: '/rest-apis/threads',
        component: <Threads />,
      },
      {
        name: 'Messages',
        linkTo: '/rest-apis/messages',
        component: <Messages />,
      },
      {
        name: 'Users',
        linkTo: '/rest-apis/users',
        component: <Users />,
      },
      {
        name: 'Groups',
        linkTo: '/rest-apis/groups',
        component: <Organizations />,
      },
      {
        name: 'Batch',
        linkTo: '/rest-apis/batch',
        component: <Batch />,
      },
      {
        name: 'Notifications',
        linkTo: '/rest-apis/notifications',
        component: <Notifications />,
      },
      {
        name: 'Files',
        linkTo: '/rest-apis/files',
        component: <Files />,
      },
      {
        name: 'Preferences',
        linkTo: '/rest-apis/preferences',
        component: <Preferences />,
      },
      {
        name: 'Projects',
        linkTo: '/rest-apis/projects',
        component: <Applications />,
      },
      {
        name: 'Presence',
        linkTo: '/rest-apis/presence',
        component: <Presence />,
      },
      {
        name: 'Errors',
        linkTo: '/rest-apis/errors',
        component: <Errors />,
      },
    ],
  },
  {
    name: ChatbotSDK.title,
    linkTo: ChatbotSDK.uri,
    component: <ChatbotSDK.Element />,
    subnav: ChatbotSDK.navItems,
  },
  {
    name: 'Customization',
    linkTo: '/customization',
    component: <Customization />,
    subnav: [
      {
        name: 'Cord components with CSS',
        linkTo: '/customization/css',
        component: <CSSCustomization />,
      },
      {
        name: 'UI text',
        linkTo: '/customization/translations',
        component: <CustomizeCordsText />,
      },
      {
        name: 'Conversation titles',
        linkTo: '/customization/add-custom-page-title',
        component: <AddCustomPageTitle />,
      },
      {
        name: 'Styling ThreadedComments Component',
        linkTo: '/customization/threaded-comments-examples',
        component: <ThreadedCommentsExamples />,
      },
      {
        name: 'Emails',
        linkTo: '/customization/emails',
        component: <CustomizeEmails />,
      },
      {
        name: 'Set a custom redirect link',
        linkTo: '/customization/redirect-link',
        component: <CustomRedirectLink />,
      },
      {
        name: 'Set up a custom S3 bucket',
        linkTo: '/customization/s3-bucket',
        component: <CustomS3Bucket />,
      },
      {
        name: 'Log events to Segment',
        linkTo: '/customization/segment-event-logging',
        component: <SegmentEventLogging />,
      },
      {
        name: 'Custom React Components',
        linkTo: '/customization/custom-react-components',
        component: <CustomReactComponents />,
        hidden: !showBeta(),
      },
      {
        name: 'Custom React Components Tutorial',
        linkTo: '/customization/custom-react-components/tutorial',
        component: <CustomReactComponentsTutorial />,
        hidden: true,
      },
      {
        name: 'Options Menu Customization',
        linkTo: '/customization/custom-react-components/options-menu',
        component: <MenuCustomization />,
        hidden: true,
      },
    ],
  },
  {
    name: 'How to',
    linkTo: '/how-to',
    component: <HowTo />,
    subnav: [
      {
        name: 'Create Cord messages',
        linkTo: '/how-to/create-cord-messages',
        component: <CreateCordMessages />,
      },
      {
        name: 'Improve annotation accuracy',
        linkTo: '/how-to/improve-annotation-accuracy',
        component: <ImproveAnnotationAccuracy />,
      },
      {
        name: 'Support iframes in annotation screenshots',
        linkTo: '/how-to/support-iframes-in-annotation-screenshots',
        component: <SupportIframesInAnnotationScreenshots />,
      },
      {
        name: 'Build charts and tables with comments',
        linkTo: '/how-to/dashboard-guide',
        component: <DashboardGuide />,
      },
    ],
  },
  {
    name: 'Developer Community',
    linkTo: 'https://community.cord.com/',
  },
  {
    name: 'Reference',
    linkTo: '/reference',

    component: <Reference />,
    subnav: [
      {
        name: 'Authentication',
        linkTo: '/reference/authentication',
        component: <Authentication />,
        subnav: [
          {
            name: 'Removing Group From Token',
            linkTo: '/reference/authentication/removing-group-from-token',
            component: <RemovingGroupFromToken />,
            hidden: true,
          },
        ],
      },
      {
        name: 'Server Libraries',
        linkTo: '/reference/server-libraries',
        component: <ServerLibraries />,
      },
      {
        name: 'Permissions',
        linkTo: '/reference/permissions',
        component: <Permissions />,
      },
      {
        name: 'Events Webhook',
        linkTo: '/reference/events-webhook',
        component: <EventsWebhook />,
        subnav: [
          {
            name: ThreadMessageAdded.title,
            linkTo: ThreadMessageAdded.uri,
            component: <ThreadMessageAdded.Element />,
          },
          {
            name: NotificationCreated.title,
            linkTo: NotificationCreated.uri,
            component: <NotificationCreated.Element />,
          },
          {
            name: URLVerification.title,
            linkTo: URLVerification.uri,
            component: <URLVerification.Element />,
          },
        ],
      },
      {
        name: 'Identifiers',
        linkTo: '/reference/identifiers',
        component: <Identifiers />,
      },
      {
        name: 'Location',
        linkTo: '/reference/location',
        component: <Location />,
      },
      {
        name: 'Browser support',
        linkTo: '/reference/browser-support',
        component: <BrowserSupport />,
      },
      {
        name: 'CSP settings',
        linkTo: '/reference/csp-settings',
        component: <ContentSecurityPolicy />,
      },
      {
        name: 'Email notifications',
        linkTo: '/reference/email-notifications',
        component: <EmailNotifications />,
      },
      {
        name: 'Cord CLI tool',
        linkTo: '/reference/cord-cli',
        component: <InstallCordCLI />,
      },
      {
        name: 'Changelog',
        linkTo: '/reference/changelog',
        component: <Changelog />,
      },
    ],
  },
  {
    name: 'Search',
    linkTo: '/search',
    component: <Search />,
    hidden: true,
  },
];

export default navigation;
