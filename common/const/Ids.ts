import { DOCS_ORIGIN } from 'common/const/Urls.ts';

export const SUPPORT_USER_UUID = 'c9a61e1d-7c8a-4c7e-838a-9d431cf4ed77';
export const RADICAL_ORG_ID = '6bba8678-b14e-4af7-b2f2-05ee807dfa82';
export const RADICAL_TEST_ORG_ID = '3689f86d-0c70-40de-a2f0-a4a9ea4994e3';
export const CORD_PLATFORM_ORG_ID = '746c0b57-7363-4766-9ee9-7ae8ec7531a8';
export const CORD_ADMIN_PLATFORM_ORG_ID =
  '84ae9086-8414-4ed3-ab73-096e6438f095';
export const CORD_SDK_TEST_ORG_ID = 'edda098d-6db7-4202-a5ac-ff3293b78c47';
export const GILLIAN_TEST_SLACK_ORG_ID = 'f7ab9ab8-f5b2-41a4-a419-1b8076626d3f';
export const KAT_TEST_SLACK_ORG_ID = '4506fadd-f8dc-4795-9b5d-d28feda39d84';
export const CORD_SLACK_TEAM_ID = 'T012Y0TBQLW'; // radicalhqworkspace
export const CORD_TEST_SLACK_TEAM_ID = 'T015UJY6YQK'; // radicaltestorg

export const SLACK_APP_CLIENT_ID = '1100027398710.1180115520790';
export const SLACK_APP_ID = 'A015A3DFAP8';
export const SLACK_DEV_APP_CLIENT_ID = '1198644236835.1943446227956';
export const SLACK_ADMIN_LOGIN_APP_CLIENT_ID = '1100027398710.2437628320357';
export const SLACK_ADMIN_LOGIN_APP_ID = 'A02CVJG9EAH';
export const SLACK_DEV_APP_ID = 'A01TRD46PU4';
export const SLACK_INTERNAL_TOOLS_APP_ID = 'A04JKM945CM';
export const CORD_UPDATES_TEST_CHANNEL_ID = 'C0547K3V868';

// As opposed to e.g. a customer's Slack app
export const CORD_SLACK_APP_IDS = [
  SLACK_APP_ID,
  SLACK_DEV_APP_ID,
  SLACK_ADMIN_LOGIN_APP_ID,
  SLACK_INTERNAL_TOOLS_APP_ID,
];

export const CORD_APPLICATION_ID = '5a076ee9-8b9e-4156-9ac4-871bdc4569ec';
export const CORD_SDK_TEST_APPLICATION_ID =
  'b6501bf5-46f7-4db7-9996-c42dd9f758b0';
export const CORD_SAMPLE_TOKEN_CUSTOMER_ID =
  '1c367aca-37c9-4733-8bef-e9f11a7d0f17';
export const CORD_DEMO_APPS_TOKEN_CUSTOMER_ID =
  '4383cf39-8b6a-4c33-9d8a-71567ed47a60';
export const CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID =
  'aeb2797f-f0a3-485c-a317-4986e2c8343b';
export const CORD_AUTOMATED_TESTS_APPLICATION_ID =
  'dfa86152-9e7e-4d2d-acd6-bfddef71f58e';
export const CLACK_APPLICATION_ID = '5fa22ba9-5446-4af8-bc93-7ce54a9aa0ba';
export const CORD_HOMEPAGE_APPLICATION_ID =
  '29e6499a-bbed-4eb2-b057-b36d60ad76c9';
export const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID!;

export const CORD_CUSTOMER_ID = '12ed6251-28d5-4686-9a75-20a15bd31499';

export const CSS_CUSTOMIZATION_ON_DOCS_PREFIX = 'css-customization-';
export const BETA_V2_DOCS_PREFIX = 'beta2-';
export const LIVE_CSS_ON_DOCS_THREAD_ID_PREFIX = 'live-css-docs-thread-';
export const LIVE_COMPONENT_ON_DOCS_THREAD_ID_PREFIX =
  'live-component-docs-thread-';
export const LIVE_COMPONENT_INBOX_THREAD_ID_PREFIX =
  'live_component-docs-inbox-thread-';
export const LIVE_COMPONENT_INBOX_LAUNCHER_THREAD_ID_PREFIX =
  'live_component-docs-inbox-launcher-thread-';
export const LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX =
  'live-component-docs-composer-thread-';
export const LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX =
  'live-component-docs-message-thread-';
export const LIVE_COMPONENT_ON_DOCS_MESSAGE_CONTENT_THREAD_ID_PREFIX =
  'live-component-docs-message-content-thread-';
export const LIVE_COMPONENT_ON_DOCS_PIN_THREAD_ID_PREFIX =
  'live-component-docs-pin-thread-';
export const LIVE_COMPONENT_ON_DOCS_REACTIONS_THREAD_ID_PREFIX =
  'live-component-docs-reactions-thread-';
export const LIVE_COMPONENT_ON_DOCS_EXTERNAL_NOTIFICATION_PREFIX =
  'live-component-docs-external-notification-';
export const LIVE_CUSTOMIZATION_ON_DOCS_REPLACEMENTS_THREAD_ID_PREFIX =
  'live-customization-docs-replacements-thread-';
export const DOCS_TOKEN_KEY = 'docs-token';

export const LIVE_COMPONENT_ON_DOCS_NO_AVATAR_USER_ID = 'noavatar';

export const DOCS_LIVE_PAGE_LOCATIONS = {
  cssCustomization: 'css-customization',
  liveCss: 'live-css-docs',
  liveThread: 'live-thread',
  liveThreadList: 'live-thread-list',
  livePin: 'live-pin',
  livePinChartExample: 'live-pin-chart-example',
  liveFloatingThreads: 'live-floating-threads',
  liveSelectionComments: 'live-selection-comments',
  liveSidebar: 'live-sidebar',
  liveInbox: 'live-inbox',
  liveInboxLauncher: 'live-inbox-launcher',
  liveSidebarLauncher: 'live-sidebar-launcher',
  livePagePresence: 'live-page-presence',
  livePresenceFacepile: 'live-presence-facepile',
  liveComposer: 'live-composer',
  liveMessage: 'live-message',
  liveMessageContent: 'live-message-content',
  liveNotificationList: 'live-notification-list',
  liveThreadedComments: 'live-threaded-comments',
  liveReactions: 'live-reactions',
  liveReplacementsTutorial: 'live-replacements-tutorial',
  liveBetaV2Thread: 'live-beta-v2-thread',
  liveBetaV2Threads: 'live-beta-v2-threads',
};

export const CORD_DOCS_CLIENT_TOKEN = '__cord_docs_token__';

export const DOCS_URLS = {
  tutorials: {
    getProductionReady: {
      addYourBranding: `${DOCS_ORIGIN}/get-started/live-css-editor`,
    },
    integrationGuide: `${DOCS_ORIGIN}/get-started/integration-guide`,
    demoApps: `${DOCS_ORIGIN}/get-started/demo-apps`,
  },
  components: {
    thread: `${DOCS_ORIGIN}/components/cord-thread`,
    threadList: `${DOCS_ORIGIN}/components/cord-thread-list`,
    threadedComments: `${DOCS_ORIGIN}/components/cord-threaded-comments`,
    sidebar: `${DOCS_ORIGIN}/components/cord-sidebar`,
    inbox: `${DOCS_ORIGIN}/components/cord-inbox`,
    inboxLauncher: `${DOCS_ORIGIN}/components/cord-inbox-launcher`,
    sidebarLauncher: `${DOCS_ORIGIN}/components/cord-sidebar-launcher`,
    composer: `${DOCS_ORIGIN}/components/cord-composer`,
    message: `${DOCS_ORIGIN}/components/cord-message`,
    messageContent: `${DOCS_ORIGIN}/components/cord-message-content`,
    reactions: `${DOCS_ORIGIN}/components/cord-reactions`,
  },
  howTo: {
    customThreadedComments: `${DOCS_ORIGIN}/customization/custom-threaded-comments`,
    cssCustomization: `${DOCS_ORIGIN}/customization/css`,
    replacements: `${DOCS_ORIGIN}/customization/custom-react-components/tutorial`,
  },
  getStarted: {
    authenticateYourUser: `${DOCS_ORIGIN}/get-started/integration-guide/generate-an-auth-token`,
  },
  betaV2Components: {
    threads: `${DOCS_ORIGIN}/components/cord-threads?version=2.0`,
    thread: `${DOCS_ORIGIN}/components/cord-thread?version=2.0`,
  },
};

export const CORD_DEV_CONSOLE_LOGGING_SLACK_CHANNEL_ID = 'C05FAVBSSN7';
export const CORD_SELF_SERVE_SLACK_CHANNEL_ID = 'C05GR4WSV5Z';

// Tokens created for the sample token and demo apps environment types both
// create groups with this id.  Both of them need to use the same groupID because
// it is hardcoded into the demo apps client code, and while the demo apps mostly
// use the demo apps environment apps, they sometimes use sample app tokens.
export const DEMO_APPS_APP_GROUP_ID = 'my-first-group';
