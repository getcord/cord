import type { Request } from 'express';
import { Router } from 'express';
import cors from 'cors';
import multer from 'multer';
import basicAuth from 'express-basic-auth';
import responseTime from 'response-time';
import { v4 as uuid } from 'uuid';

import CreateThreadHandler from 'server/src/public/routes/platform/threads/CreateThreadHandler.ts';
import GetApplicationHandler from 'server/src/public/routes/platform/applications/GetApplicationHandler.ts';
import DeletePlatformOrganizationsHandler from 'server/src/public/routes/platform/orgs/DeletePlatformOrganizationsHandler.ts';
import DeleteApplicationHandler from 'server/src/public/routes/platform/applications/DeleteApplicationHandler.ts';
import UpdateApplicationHandler from 'server/src/public/routes/platform/applications/UpdateApplicationHandler.ts';
import ListApplicationsHandler from 'server/src/public/routes/platform/applications/ListApplicationsHandler.ts';
import {
  VerifyAppServerAuthToken,
  VerifyCustomerServerAuthToken,
} from 'server/src/public/routes/middleware/VerifyAPIAccessToken.ts';
import IndexHandler from 'server/src/public/routes/handlers/IndexHandler.ts';
import SlackAuthRedirectHandler from 'server/src/public/routes/handlers/SlackAuthRedirectHandler.ts';
import JiraAuthRedirectHandler from 'server/src/public/routes/handlers/JiraAuthRedirectHandler.ts';
import SlackEventApiHandler from 'server/src/public/routes/handlers/SlackEventApiHandler.ts';
import SlackInteractiveEventApiHandler from 'server/src/public/routes/handlers/SlackInteractiveEventApiHandler.ts';
import AsanaAuthRedirectHandler from 'server/src/public/routes/handlers/AsanaAuthRedirectHandler.ts';
import LinearAuthRedirectHandler from 'server/src/public/routes/handlers/LinearAuthRedirectHandler.ts';
import AsanaEventApiHandler from 'server/src/public/routes/handlers/AsanaEventApiHandler.ts';
import {
  TrelloAuthLoginHandler,
  TrelloAuthRedirectHandler,
} from 'server/src/public/routes/handlers/TrelloAuthHandlers.ts';
import LinearEventApiHandler from 'server/src/public/routes/handlers/LinearEventApiHandler.ts';
import PlatformErrorHandler from 'server/src/public/routes/middleware/PlatformErrorHandler.ts';
import APIAuthorizeHandler from 'server/src/public/routes/platform/APIAuthorizeHandler.ts';
import ListPlatformOrganizationsHandler from 'server/src/public/routes/platform/orgs/ListPlatformOrganizationsHandler.ts';
import GetPlatformOrganizationHandler from 'server/src/public/routes/platform/orgs/GetPlatformOrganizationHandler.ts';
import CreatePlatformOrganizationsHandler from 'server/src/public/routes/platform/orgs/CreatePlatformOrganizationsHandler.ts';
import UpdatePlatformOrganizationsHandler from 'server/src/public/routes/platform/orgs/UpdatePlatformOrganizationsHandler.ts';
import UpdatePlatformOrganizationMembersHandler from 'server/src/public/routes/platform/org_members/UpdatePlatformOrganizationMembersHandler.ts';
import ListPlatformUsersHandler from 'server/src/public/routes/platform/users/ListPlatformUsersHandler.ts';
import GetPlatformUserHandler from 'server/src/public/routes/platform/users/GetPlatformUserHandler.ts';
import CreatePlatformUserHandler from 'server/src/public/routes/platform/users/CreatePlatformUserHandler.ts';
import UpdatePlatformUserHandler from 'server/src/public/routes/platform/users/UpdatePlatformUserHandler.ts';
import PlatformBatchHandler from 'server/src/public/routes/platform/PlatformBatchHandler.ts';
import GetThreadMessageHandler from 'server/src/public/routes/platform/messages/GetThreadMessageHandler.ts';
import ListThreadMessagesHandler from 'server/src/public/routes/platform/messages/ListThreadMessagesHandler.ts';
import CreateThreadMessageHandler from 'server/src/public/routes/platform/messages/CreateThreadMessageHandler.ts';

import {
  takeHeapSnapshot,
  writeOutCPUProfile,
} from 'server/src/admin/profiler.ts';
import { RequestContextMiddleware } from 'server/src/middleware/request_context.ts';
import {
  RenderUnsubscribeThreadPage,
  UnsubscribeThreadHandler,
} from 'server/src/public/routes/email/unsubscribe_thread/index.ts';
import { FileProxyHandler } from 'server/src/public/routes/file/index.ts';
import NotificationLoggingHandler from 'server/src/public/routes/notifications_logging/NotificationLoggingHandler.ts';
import {
  SLACK_EVENT_PATH,
  SLACK_INTERACTIVE_EVENT_PATH,
} from 'server/src/const.ts';
import SendGridWebhookHandler from 'server/src/public/routes/handlers/SendGridWebhookHandler.ts';
import env from 'server/src/config/Env.ts';
import NotificationRedirectURIHandler from 'server/src/public/routes/notification-uri-test/NotificationRedirectURIHandler.ts';
import GetDemoAppsSignedTokenHandler from 'server/src/public/routes/demo-apps/GetDemoAppsSignedTokenHandler.ts';
import {
  ADMIN_ORIGIN,
  DOCS_ORIGIN,
  MARKETING_ORIGIN,
  TOP_ORIGIN,
} from 'common/const/Urls.ts';
import SlackLinkingConfirmationHandler from 'server/src/public/routes/handlers/SlackLinkingConfirmationHandler.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import TestbedTokensHandler from 'server/src/public/routes/handlers/TestbedTokensHandler.ts';
import GetSampleSignedTokenHandler from 'server/src/public/routes/sample-token/GetSampleSignedTokenHandler.ts';
import MondayAuthRedirectHandler from 'server/src/public/routes/handlers/MondayAuthRedirectHandler.ts';
import MondayEventApiHandler from 'server/src/public/routes/handlers/MondayEventApiHandler.ts';
import GetDocsSampleSignedTokenHandler from 'server/src/public/routes/docs-sample-token/GetDocsSampleSignedTokenHandler.ts';
import DeletePlatformUserDataHandler from 'server/src/public/routes/platform/users/DeletePlatformUserDataHandler.ts';
import CreateNotificationHandler from 'server/src/public/routes/platform/notifications/CreateNotificationHandler.ts';
import GetThreadHandler from 'server/src/public/routes/platform/threads/GetThreadHandler.ts';
import CreateApplicationHandler from 'server/src/public/routes/platform/applications/CreateApplicationHandler.ts';
import UpdateThreadHandler from 'server/src/public/routes/platform/threads/UpdateThreadHandler.ts';
import DeleteThreadHandler from 'server/src/public/routes/platform/threads/DeleteThreadHandler.ts';
import DeleteThreadMessageHandler from 'server/src/public/routes/platform/messages/DeleteThreadMessageHandler.ts';
import ListThreadsHandler from 'server/src/public/routes/platform/threads/ListThreadsHandler.ts';
import ListNotificationsHandler from 'server/src/public/routes/platform/notifications/ListNotificationsHandler.ts';
import DeleteNotificationHandler from 'server/src/public/routes/platform/notifications/DeleteNotificationHandler.ts';
import UpdateThreadMessageHandler from 'server/src/public/routes/platform/messages/UpdateThreadMessageHandler.ts';
import AppendMessageHandler from 'server/src/public/routes/platform/messages/AppendMessageHandler.ts';
import UpdateUserPresenceHandler from 'server/src/public/routes/platform/presence/UpdateUserPresenceHandler.ts';
import { Counter, TimeHistogram } from 'server/src/logging/prometheus.ts';
import Auth0LogsHandler from 'server/src/public/routes/handlers/Auth0LogsHandler.ts';
import ListMessagesHandler from 'server/src/public/routes/platform/messages/ListMessagesHandler.ts';
import ListUserPreferencesHandler from 'server/src/public/routes/platform/preferences/ListUserPreferencesHandler.ts';
import UpdateUserPreferencesHandler from 'server/src/public/routes/platform/preferences/UpdateUserPreferencesHandler.tsx';
import ApplicationTokenHandler from 'server/src/public/routes/platform/verify/ApplicationTokenHandler.ts';
import CreateWebhookHandler from 'server/src/public/routes/platform/webhooks/CreateWebhookHandler.ts';
import DeleteWebhookHandler from 'server/src/public/routes/platform/webhooks/DeleteWebhookHandler.ts';
import DemoUserHandler from 'server/src/public/routes/warm-demo-users/DemoUserHandler.ts';
import CreateFileHandler from 'server/src/public/routes/platform/files/CreateFileHandler.ts';
import { MAX_UPLOAD_SIZE } from 'common/uploads/index.ts';
import CliVersionHandler from 'server/src/public/routes/handlers/CliVersionHandler.ts';
import { asyncLocalStorage } from 'server/src/logging/performance.ts';
import {
  deprecated,
  deprecatedFunction,
} from 'server/src/logging/deprecate.ts';
import ExperimentalPlatformPermissionHandlers from 'server/src/public/routes/permissions/ExperimentalPlatformPermissionHandlers.ts';
import StripeWebhookHandler from 'server/src/public/routes/handlers/StripeWebhookHandler.ts';
import ListPlatformOrganizationMembersHandler from 'server/src/public/routes/platform/org_members/ListPlatformOrganizationMembersHandler.ts';
import ThoughtspotApplicationMigrationHandler from 'server/src/public/routes/platform/customer/thoughtspot/ThoughtspotApplicationMigrationHandler.ts';
import CommunityGetUserHandler from 'server/src/public/routes/platform/customer/community/CommunityGetUserHandler.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import ClientGetViewerHandler from 'server/src/public/routes/platform/client/ClientGetViewerHandler.ts';
import ClientGetUserHandler from 'server/src/public/routes/platform/client/ClientGetUserHandler.ts';
import ClientGetUsersHandler from 'server/src/public/routes/platform/client/ClientGetUsersHandler.ts';
import ClientGetThreadHandler from 'server/src/public/routes/platform/client/ClientGetThreadHandler.ts';
import ClientGetMessageHandler from 'server/src/public/routes/platform/client/ClientGetMessageHandler.ts';
import ClientGetThreadCountsHandler from 'server/src/public/routes/platform/client/ClientGetThreadCountsHandler.ts';
import ClientGetThreadsHandler from 'server/src/public/routes/platform/client/ClientGetThreadsHandler.ts';
import ClientGetNotificationsHandler from 'server/src/public/routes/platform/client/ClientGetNotificationsHandler.ts';
import ClientGetNotificationCountsHandler from 'server/src/public/routes/platform/client/ClientGetNotificationCountsHandler.ts';
import ClientGetGroupMembersHandler from 'server/src/public/routes/platform/client/ClientGetGroupMembersHandler.ts';
import ClientGetPresenceHandler from 'server/src/public/routes/platform/client/ClientGetPresenceHandler.ts';
import GetDbDumpHandler from 'server/src/public/routes/platform/customer/GetDbDumpHandler.ts';

export const ASANA_EVENTS_PATH = '/asana/events';
export const LINEAR_EVENTS_PATH = '/linear/events';
export const MONDAY_EVENTS_PATH_BASE = '/monday/events';
export const MONDAY_EVENTS_PATH = MONDAY_EVENTS_PATH_BASE + '/:subscriptionId';
export const UNSUBSCRIBE_PATH = '/email/unsubscribe_thread';
export const TYPEFORM_NOTIFICATION_LOGGING_PATH = '/typeform';
export const DEFAULT_NOTIFICATION_LOGGING_PATH = '/redirect';

// TODO remove and set envs up properly once new site is launched
const TEMPORARY_V5_CORD_DOT_COM_ORIGINS = [
  'https://cord-v5-cord.vercel.app',
  'https://v5.cord.com/',
];

const restApiCalls = Counter({
  name: 'RestApiCalls',
  help: 'Tracks how often each REST API method is called',
  labelNames: ['route', 'appID', 'statusCode', 'cordSource'],
});

const restApiCallExecTime = TimeHistogram({
  name: 'RestApiCallExecTime',
  help: 'Tracks how long each REST API path call takes in s',
  labelNames: ['route', 'appID'],
});

const MainRouter = Router();

MainRouter.get('/', IndexHandler);
MainRouter.get('/auth/slack/redirect', SlackAuthRedirectHandler);
// Special flow for Radical Test Org app
MainRouter.get('/auth/slack/redirect/dev', SlackAuthRedirectHandler);
MainRouter.get(
  '/auth/slack/linking-confirmation',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  SlackLinkingConfirmationHandler,
);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get('/auth/jira/redirect/', JiraAuthRedirectHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get('/auth/asana/redirect/', AsanaAuthRedirectHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get('/auth/linear/redirect', LinearAuthRedirectHandler);
MainRouter.get('/auth/trello/login', TrelloAuthLoginHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get('/auth/trello/redirect', TrelloAuthRedirectHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get('/auth/monday/redirect', MondayAuthRedirectHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get(UNSUBSCRIBE_PATH, RenderUnsubscribeThreadPage);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.post(UNSUBSCRIBE_PATH, UnsubscribeThreadHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.get('/file', FileProxyHandler);
MainRouter.post(SLACK_EVENT_PATH, SlackEventApiHandler);
MainRouter.post(SLACK_INTERACTIVE_EVENT_PATH, SlackInteractiveEventApiHandler);
MainRouter.post(ASANA_EVENTS_PATH, AsanaEventApiHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.post(LINEAR_EVENTS_PATH, LinearEventApiHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
MainRouter.post(MONDAY_EVENTS_PATH, MondayEventApiHandler);

const ignoreUploadedFiles = multer({
  // Filter out all files to not store them for now but
  // still pass on the message.
  fileFilter: (_req, _file, cb) => {
    cb(null, false);
  },
}); // for parsing multipart/form-data
const uploadedFiles = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
});
// Sendgrid's Inbound Parse webhook endpoint
MainRouter.post(
  '/sendgrid',

  // Only SendGrid should be able to post to this endpoint
  basicAuth({
    users: {
      [env.SENDGRID_INBOUND_WEBHOOK_USER]:
        env.SENDGRID_INBOUND_WEBHOOK_PASSWORD,
    },
  }),

  // parse multipart/form-data
  // Allow all files through to not throw an error
  // and drop replies with attachments.
  // (TODO) Properly implement support for attachments by
  // uploading files to s3 and attaching to message.
  ignoreUploadedFiles.any(),
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  SendGridWebhookHandler,
);

MainRouter.get(
  TYPEFORM_NOTIFICATION_LOGGING_PATH + '/:redirectID',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  NotificationLoggingHandler,
);
MainRouter.get(
  DEFAULT_NOTIFICATION_LOGGING_PATH + '/:redirectID',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  NotificationLoggingHandler,
);

MainRouter.use(cors());

// Developer API

MainRouter.use(
  '/v1/*',
  (req, _res, next) =>
    asyncLocalStorage
      ? asyncLocalStorage.run(
          {
            operationName: `REST: ${req.method} ${req.baseUrl}`,
            operationID: uuid(),
            logger: anonymousLogger(),
            // Filled in by VerifyAppServerAuthToken.
            platformApplicationID: undefined,
          },
          next,
        )
      : next(),
  responseTime((req, res, time) => {
    const request = req as Request;
    const { appID, body, query, headers } = request;

    if (appID) {
      const route = `${request.method} ${request.route?.path}`;

      const cordSource =
        headers['x-cord-source'] && typeof headers['x-cord-source'] === 'string'
          ? headers['x-cord-source']
          : '';

      if (cordSource === 'cli') {
        const md = `*${route}* called from app: <${ADMIN_ORIGIN}/applications/${appID}|${appID}>`;
        void sendMessageToCord(md, undefined, 'cli-events');
      }

      restApiCalls.inc({
        route,
        appID,
        statusCode: res.statusCode,
        cordSource,
      });

      // update prometheus metric (prometheus values are in seconds not ms)
      restApiCallExecTime.observe({ route, appID }, time / 1000);
    }

    const operationID = asyncLocalStorage?.getStore()?.operationID;

    anonymousLogger().debug('Platform', {
      appID,
      headers,
      endpoint: `${req.method} ${req.url}`,
      statusCode: res.statusCode,
      duration: time,
      payload: body,
      query,
      ...(operationID && { operationID }),
    });
  }),
);

MainRouter.post('/v1/authorize', APIAuthorizeHandler);

MainRouter.get('/v1/verify', VerifyAppServerAuthToken, ApplicationTokenHandler);

// Organizations routes (deprecated - renamed groups, see below)
// These paths should continue to work, however success/error messages
// will now refer to 'group' rather than 'organization'
MainRouter.use('/v1/organizations', (req, _res, next) => {
  deprecated('api: /v1/organizations', req.appID);
  next();
});

MainRouter.get(
  '/v1/organizations',
  VerifyAppServerAuthToken,
  ListPlatformOrganizationsHandler,
);
MainRouter.get(
  '/v1/organizations/:orgID',
  VerifyAppServerAuthToken,
  GetPlatformOrganizationHandler,
);
MainRouter.post(
  '/v1/organizations',
  VerifyAppServerAuthToken,
  CreatePlatformOrganizationsHandler,
);
MainRouter.put(
  '/v1/organizations/:orgID',
  VerifyAppServerAuthToken,
  UpdatePlatformOrganizationsHandler,
);
MainRouter.delete(
  '/v1/organizations/:orgID',
  VerifyAppServerAuthToken,
  DeletePlatformOrganizationsHandler,
);

MainRouter.post(
  '/v1/organizations/:orgID/members',
  VerifyAppServerAuthToken,
  UpdatePlatformOrganizationMembersHandler,
);

// Groups routes
MainRouter.get(
  '/v1/groups',
  VerifyAppServerAuthToken,
  ListPlatformOrganizationsHandler,
);
MainRouter.get(
  '/v1/groups/:orgID',
  VerifyAppServerAuthToken,
  GetPlatformOrganizationHandler,
);
MainRouter.put(
  '/v1/groups/:orgID',
  VerifyAppServerAuthToken,
  UpdatePlatformOrganizationsHandler,
);
MainRouter.delete(
  '/v1/groups/:orgID',
  VerifyAppServerAuthToken,
  DeletePlatformOrganizationsHandler,
);

MainRouter.get(
  '/v1/groups/:orgID/members',
  VerifyAppServerAuthToken,
  ListPlatformOrganizationMembersHandler,
);

MainRouter.post(
  '/v1/groups/:orgID/members',
  VerifyAppServerAuthToken,
  UpdatePlatformOrganizationMembersHandler,
);

// Users routes
MainRouter.get('/v1/users', VerifyAppServerAuthToken, ListPlatformUsersHandler);
MainRouter.get(
  '/v1/users/:userID',
  VerifyAppServerAuthToken,
  GetPlatformUserHandler,
);
MainRouter.post(
  '/v1/users',
  VerifyAppServerAuthToken,
  CreatePlatformUserHandler,
);
MainRouter.put(
  '/v1/users/:userID',
  VerifyAppServerAuthToken,
  UpdatePlatformUserHandler,
);

// User Presence
MainRouter.put(
  '/v1/users/:userID/presence',
  VerifyAppServerAuthToken,
  UpdateUserPresenceHandler,
);

MainRouter.get(
  '/v1/users/:userID/preferences',
  VerifyAppServerAuthToken,
  ListUserPreferencesHandler,
);
MainRouter.put(
  '/v1/users/:userID/preferences',
  VerifyAppServerAuthToken,
  UpdateUserPreferencesHandler,
);

MainRouter.delete(
  '/v1/users/:userID',
  VerifyAppServerAuthToken,
  DeletePlatformUserDataHandler,
);

// Threads & Messages
MainRouter.get('/v1/threads', VerifyAppServerAuthToken, ListThreadsHandler);
MainRouter.post('/v1/threads', VerifyAppServerAuthToken, CreateThreadHandler);
MainRouter.get(
  '/v1/threads/:threadID/messages/:messageID',
  VerifyAppServerAuthToken,
  GetThreadMessageHandler,
);
MainRouter.post(
  '/v1/threads/:threadID/messages',
  VerifyAppServerAuthToken,
  CreateThreadMessageHandler,
);
MainRouter.put(
  '/v1/threads/:threadID/messages/:messageID',
  VerifyAppServerAuthToken,
  UpdateThreadMessageHandler,
);
MainRouter.post(
  '/v1/threads/:threadID/messages/:messageID/append',
  VerifyAppServerAuthToken,
  AppendMessageHandler,
);
MainRouter.get(
  '/v1/threads/:threadID/messages',
  VerifyAppServerAuthToken,
  ListThreadMessagesHandler,
);
MainRouter.delete(
  '/v1/threads/:threadID/messages/:messageID',
  VerifyAppServerAuthToken,
  DeleteThreadMessageHandler,
);
MainRouter.get('/v1/messages', VerifyAppServerAuthToken, ListMessagesHandler);

// Notifications
MainRouter.post(
  '/v1/notifications',
  VerifyAppServerAuthToken,
  CreateNotificationHandler,
);
MainRouter.delete(
  '/v1/notifications/:notificationID',
  VerifyAppServerAuthToken,
  DeleteNotificationHandler,
);
MainRouter.get(
  '/v1/users/:userID/notifications',
  VerifyAppServerAuthToken,
  ListNotificationsHandler,
);

MainRouter.get(
  '/v1/threads/:threadID',
  VerifyAppServerAuthToken,
  GetThreadHandler,
);
MainRouter.put(
  '/v1/threads/:threadID',
  VerifyAppServerAuthToken,
  UpdateThreadHandler,
);
MainRouter.delete(
  '/v1/threads/:threadID',
  VerifyAppServerAuthToken,
  DeleteThreadHandler,
);

// File routes
MainRouter.post(
  '/v1/files',
  VerifyAppServerAuthToken,
  uploadedFiles.single('file'),
  CreateFileHandler,
);

// Appications (aka. Projects) routes
MainRouter.get(
  ['/v1/applications', '/v1/projects'],
  VerifyCustomerServerAuthToken,
  ListApplicationsHandler,
);
MainRouter.get(
  ['/v1/applications/:appID', '/v1/projects/:appID'],
  VerifyCustomerServerAuthToken,
  GetApplicationHandler,
);
MainRouter.post(
  ['/v1/applications', '/v1/projects'],
  VerifyCustomerServerAuthToken,
  CreateApplicationHandler,
);
MainRouter.put(
  ['/v1/applications/:appID', '/v1/projects/:appID'],
  VerifyCustomerServerAuthToken,
  UpdateApplicationHandler,
);
MainRouter.delete(
  ['/v1/applications/:appID', '/v1/projects/:appID'],
  VerifyCustomerServerAuthToken,
  DeleteApplicationHandler,
);

// Webhook subscription routes within applications
MainRouter.post(
  ['/v1/applications/:appID/webhooks', '/v1/projects/:appID/webhooks'],
  VerifyAppServerAuthToken,
  CreateWebhookHandler,
);
MainRouter.delete(
  [
    '/v1/applications/:appID/webhooks/:webhookID',
    '/v1/projects/:appID/webhooks/:webhookID',
  ],
  VerifyAppServerAuthToken,
  DeleteWebhookHandler,
);

MainRouter.get(
  '/v1/customer/dbdump',
  VerifyCustomerServerAuthToken,
  GetDbDumpHandler,
);

// Client-token routes to replicate JS APIs for SSR
MainRouter.get(
  '/v1/client/viewer',
  RequestContextMiddleware,
  ClientGetViewerHandler,
);
MainRouter.get(
  '/v1/client/user/:userID',
  RequestContextMiddleware,
  ClientGetUserHandler,
);
MainRouter.get(
  '/v1/client/users',
  RequestContextMiddleware,
  ClientGetUsersHandler,
);
MainRouter.get(
  '/v1/client/threads',
  RequestContextMiddleware,
  ClientGetThreadsHandler,
);
MainRouter.get(
  '/v1/client/thread/:threadID',
  RequestContextMiddleware,
  ClientGetThreadHandler,
);
MainRouter.get(
  '/v1/client/threadCounts',
  RequestContextMiddleware,
  ClientGetThreadCountsHandler,
);
MainRouter.get(
  '/v1/client/message/:messageID',
  RequestContextMiddleware,
  ClientGetMessageHandler,
);
MainRouter.get(
  '/v1/client/notifications',
  RequestContextMiddleware,
  ClientGetNotificationsHandler,
);
MainRouter.get(
  '/v1/client/notificationCounts',
  RequestContextMiddleware,
  ClientGetNotificationCountsHandler,
);
MainRouter.get(
  '/v1/client/groupMembers/:groupID',
  RequestContextMiddleware,
  ClientGetGroupMembersHandler,
);
MainRouter.get(
  '/v1/client/presence',
  RequestContextMiddleware,
  ClientGetPresenceHandler,
);

// Experimental routes
MainRouter.post(
  '/v1/experimental/permissions',
  VerifyAppServerAuthToken,
  ExperimentalPlatformPermissionHandlers.create,
);
MainRouter.delete(
  '/v1/experimental/permissions/:ruleID',
  VerifyAppServerAuthToken,
  ExperimentalPlatformPermissionHandlers.delete,
);

MainRouter.post('/v1/batch', VerifyAppServerAuthToken, PlatformBatchHandler);

// Customer specific endpoints
MainRouter.post(
  '/v1/thoughtspot/application_migration',
  VerifyCustomerServerAuthToken,
  ThoughtspotApplicationMigrationHandler,
);

MainRouter.get(
  '/v1/community/users/:userID',
  VerifyAppServerAuthToken,
  CommunityGetUserHandler,
);

// Error handler
MainRouter.use('/v1', PlatformErrorHandler);

// Performance profiling
MainRouter.get('/cpu-profile', RequestContextMiddleware, writeOutCPUProfile);
MainRouter.get('/heap-snapshot', RequestContextMiddleware, takeHeapSnapshot);

// Route suggested in the console for testing the notification URI payload
MainRouter.get('/debug/redirect-uri', NotificationRedirectURIHandler);

MainRouter.post(
  '/playground-token',
  cors({
    origin: [DOCS_ORIGIN, ...TEMPORARY_V5_CORD_DOT_COM_ORIGINS, TOP_ORIGIN],
    optionsSuccessStatus: 200,
  }),
  deprecatedFunction(GetDemoAppsSignedTokenHandler, 'api: /playground-token'),
);

MainRouter.post(
  '/demo-apps-token',
  cors({
    origin: [DOCS_ORIGIN, ...TEMPORARY_V5_CORD_DOT_COM_ORIGINS, TOP_ORIGIN],
    optionsSuccessStatus: 200,
  }),
  GetDemoAppsSignedTokenHandler,
);

MainRouter.post('/sample-token', GetSampleSignedTokenHandler);

MainRouter.post(
  '/docs-sample-token',
  cors({
    origin: [DOCS_ORIGIN, /https:\/\/pr\d+-docs\.dev\.cord\.com$/],
    optionsSuccessStatus: 200,
  }),
  GetDocsSampleSignedTokenHandler,
);

// Not currently in use: 'warm' demo user for quicker startup in demo apps.  We
// didn't end up adding this for the new cord.com but may look to add it in at
// some point
MainRouter.get(
  '/demo-token',
  cors({
    origin: [
      DOCS_ORIGIN,
      MARKETING_ORIGIN,
      ...TEMPORARY_V5_CORD_DOT_COM_ORIGINS,
    ],
    optionsSuccessStatus: 200,
  }),
  DemoUserHandler,
);

// Auth0 logs
MainRouter.post('/logs/auth0', Auth0LogsHandler);

if (env.INCLUDE_SDK_TESTBED) {
  MainRouter.get('/sdk/test/tokens', TestbedTokensHandler);
}

// CLI
MainRouter.get('/v1/cli-version', CliVersionHandler);

// Stripe webhooks
MainRouter.post('/stripe/webhook', StripeWebhookHandler);

export default MainRouter;
