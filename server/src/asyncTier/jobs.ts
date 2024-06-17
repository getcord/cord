import type { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import applicationUsageMetricsJob from 'server/src/asyncTier/jobs/applicationUsageMetrics.ts';
import { default as asyncWorkerHealthCheck } from 'server/src/asyncTier/jobs/asyncWorkerHealthCheck.ts';
import checkAWSCredentials from 'server/src/asyncTier/jobs/checkAWSCredentials.ts';
import databaseTidyUpJob from 'server/src/asyncTier/jobs/databaseTidyUp.ts';
import exampleJob from 'server/src/asyncTier/jobs/example.ts';
import generateAWSCredentialsReport from 'server/src/asyncTier/jobs/generateAWSCredentials.ts';
import resizeProfilePicture from 'server/src/asyncTier/jobs/resizeProfilePicture.ts';
import notifyWebhook from 'server/src/asyncTier/jobs/notifyWebhook.ts';
import rotateAllJiraRefreshTokens from 'server/src/asyncTier/jobs/jiraRefreshTokenRotate.ts';
import sendEmailNotification from 'server/src/asyncTier/jobs/sendEmailNotificationWithDelay.ts';
import sendSlackNotificationWithDelay from 'server/src/asyncTier/jobs/sendSlackNotificationWithDelay.ts';
import syncSlackChannelsList from 'server/src/asyncTier/jobs/syncSlackChannelsList.ts';
import syncSlackGreyUsers from 'server/src/asyncTier/jobs/syncSlackGreyUsers.ts';
import wipeTemporaryTokensData from 'server/src/asyncTier/jobs/wipeTemporaryTokensData.ts';
import generateLinkPreviews from 'server/src/asyncTier/jobs/generateLinkPreviews.ts';
import asyncWorkerHealthHeartbeatStaging from 'server/src/asyncTier/jobs/asyncWorkerHealthHeartbeatStaging.ts';
import asyncWorkerHealthHeartbeatProd from 'server/src/asyncTier/jobs/asyncWorkerHealthHeartbeatProd.ts';

// List of async job definitions. Add yours here!
export const asyncJobList = [
  applicationUsageMetricsJob,
  asyncWorkerHealthCheck,
  asyncWorkerHealthHeartbeatStaging,
  asyncWorkerHealthHeartbeatProd,
  checkAWSCredentials,
  databaseTidyUpJob,
  exampleJob,
  generateAWSCredentialsReport,
  generateLinkPreviews,
  resizeProfilePicture,
  rotateAllJiraRefreshTokens,
  sendEmailNotification,
  sendSlackNotificationWithDelay,
  syncSlackChannelsList,
  syncSlackGreyUsers,
  wipeTemporaryTokensData,
  notifyWebhook,
] as const satisfies readonly AsyncTierJobDefinition<string, any>[];

export type AsyncJobDataTypes = {
  [Obj in (typeof asyncJobList)[number] as Obj['name']]: Parameters<
    Obj['func']
  >[0];
};
