import { QueryTypes } from 'sequelize';
import type { EmptyJsonObject } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

// Arbitrarily chosen as the max queue size limit before we sound the alarm.  Chosen
// based on a vague sense of what would be 'too much' and so would indicate that the
// async worker has stopped processing jobs for some reason.
export const UNACCEPTABLY_LONG_QUEUE_LENGTH = 200;

export default new AsyncTierJobDefinition(
  'asyncWorkerHealthHeartbeatProd',
  asyncWorkerHealthHeartbeatProd,
).schedule({
  tier: 'prod',
  name: 'everyFiveMinutes',
  cron: '*/5 * * * *', // At every 5th minute https://crontab.guru/#*/5_*_*_*_*
  data: {},
});

/**
 * Job that checks the number of outstanding jobs the prod async worker needs
 * to process, and sends a heartbeat to Better Uptime if everything's ok.  If the
 * queue looks too long, indicating a problem, it does not ping Better Uptime
 * which will result in a missed heartbeat and an incident escalation.
 */
async function asyncWorkerHealthHeartbeatProd(
  _: EmptyJsonObject,
  logger: Logger,
) {
  logger.info('Running asyncWorkerHealthHeartbeatProd');

  const [{ count: jobCount }]: Array<{
    count: number;
  }> = await getSequelize().query(
    `SELECT count(*) FROM pgboss_prod.job WHERE state = 'created';`,
    {
      type: QueryTypes.SELECT,
    },
  );

  logger.info(`${jobCount} jobs currently in the prod queue`);

  if (jobCount < UNACCEPTABLY_LONG_QUEUE_LENGTH) {
    try {
      // https://uptime.betterstack.com/team/53072/heartbeats/149302
      void fetch(
        'https://uptime.betterstack.com/api/v1/heartbeat/4QK52h4vc1RADyCX5CDeW9ZT',
      );
    } catch (e) {
      logger.logException('Error sending prod async heartbeat', e);
    }
  } else {
    logger.logException('Async queue size too big - not sending heartbeat', {
      jobCount,
      tier: 'prod',
    });
  }
}
