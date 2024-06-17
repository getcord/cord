import { QueryTypes } from 'sequelize';
import type { EmptyJsonObject } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { UNACCEPTABLY_LONG_QUEUE_LENGTH } from 'server/src/asyncTier/jobs/asyncWorkerHealthHeartbeatProd.ts';

export default new AsyncTierJobDefinition(
  'asyncWorkerHealthHeartbeatStaging',
  asyncWorkerHealthHeartbeatStaging,
).schedule({
  tier: 'staging',
  name: 'everyFiveMinutes',
  cron: '*/5 * * * *', // At every 5th minute https://crontab.guru/#*/5_*_*_*_*
  data: {},
});

/**
 * Job that checks the number of outstanding jobs the staging async worker needs
 * to process, and sends a heartbeat to Better Uptime if everything's ok.  If the
 * queue looks too long, indicating a problem, it does not ping Better Uptime
 * which will result in a missed heartbeat and an incident escalation.
 */
async function asyncWorkerHealthHeartbeatStaging(
  _: EmptyJsonObject,
  logger: Logger,
) {
  logger.info('Running asyncWorkerHealthHeartbeatStaging');

  const [{ count: jobCount }]: Array<{
    count: number;
  }> = await getSequelize().query(
    `SELECT count(*) FROM pgboss_staging.job WHERE state = 'created';`,
    {
      type: QueryTypes.SELECT,
    },
  );

  logger.info(`${jobCount} jobs currently in the staging queue`);

  if (jobCount < UNACCEPTABLY_LONG_QUEUE_LENGTH) {
    try {
      // https://uptime.betterstack.com/team/53072/heartbeats/149296
      void fetch(
        'https://uptime.betterstack.com/api/v1/heartbeat/GxRoHJQNRfoC26kNmjZAvrEm',
      );
    } catch (e) {
      logger.logException('Error sending staging async heartbeat', e);
    }
  } else {
    logger.logException('Async queue size too big - not sending heartbeat', {
      jobCount,
      tier: 'staging',
    });
  }
}
