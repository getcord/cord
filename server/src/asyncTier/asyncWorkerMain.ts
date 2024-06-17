import { initBoss } from 'server/src/asyncTier/pgboss.ts';

import { initSequelize } from 'server/src/entity/sequelize.ts';
import { initializeLinkSigningCredentials } from 'server/src/files/upload.ts';
import { initFeatureFlags } from 'server/src/featureflags/index.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { initRedis } from 'server/src/redis/index.ts';
import { subscribeToPubSubEvent, initPubSub } from 'server/src/pubsub/index.ts';
import env from 'server/src/config/Env.ts';
import { asyncJobList } from 'server/src/asyncTier/jobs.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

async function main() {
  const boss = await initBoss();

  // make sure sequelize is happy
  await initSequelize('async');

  initRedis();

  // Wait for PubSub to initialize
  await initPubSub();

  await initializeLinkSigningCredentials();

  await initFeatureFlags().catch(
    anonymousLogger().exceptionLogger('initFeatureFlags failed'),
  );

  // print basic logging information
  anonymousLogger().logLoggerInfo();

  const existingSchedulesByName = new Map(
    (await boss.getSchedules()).map((schedule) => [schedule.name, schedule]),
  );

  // Register all jobs and their schedules with pgboss. (Any schedules declared
  // in the job definitions are installed in pgboss and removed from
  // `existingSchedulesByName` in the process.)
  for (const job of asyncJobList) {
    await job.register(boss, env.CORD_TIER, existingSchedulesByName);
  }

  // Any remaining entries in existingSchedulesByName are schedules that none of
  // the async jobs have declared now. They must be from older versions of the
  // async worker. Hence, we remove all of those now.
  for (const abandonedSchedule of existingSchedulesByName.keys()) {
    await boss.unschedule(abandonedSchedule);
  }

  await subscribeToPubSubEvent(
    'pub-sub-health-check',
    null,
    handlePubSubHealthCheckEvent,
  );

  anonymousLogger().info('Registered all async jobs - ready to do work');
}

function handleFailedHealthCheck() {
  const { CORD_OPS_SLACK_CHANNEL_ID } = env;

  if (CORD_OPS_SLACK_CHANNEL_ID) {
    backgroundPromise(
      sendMessageToCord(
        '❌ PgBoss pubSub health check failed',
        CORD_OPS_SLACK_CHANNEL_ID,
      ),
    );
  }
}

const HEALTH_CHECK_TIMEOUT = 5 * 60000; // 5 minutes
let lastTimeout: NodeJS.Timeout | undefined = undefined;

function handlePubSubHealthCheckEvent() {
  if (lastTimeout) {
    clearTimeout(lastTimeout);
  }
  lastTimeout = setTimeout(handleFailedHealthCheck, HEALTH_CHECK_TIMEOUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
