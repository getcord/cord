import type { EmptyJsonObject } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';

export default new AsyncTierJobDefinition(
  'asyncWorkerHealthCheck',
  asyncWorkerHealthCheck,
).schedule({
  tier: 'all',
  name: 'everyOtherMinute',
  cron: '*/2 * * * *', // At every 2nd minute https://crontab.guru/#*/2_*_*_*_*
  data: {},
});

async function asyncWorkerHealthCheck(_: EmptyJsonObject, logger: Logger) {
  try {
    // Just try to read from any table, notify us if that fails
    await getSequelize().query('SELECT 1;');
  } catch (e) {
    logger.logException('PgBoss health check failed to read table', e);
  }

  try {
    await publishPubSubEvent('pub-sub-health-check', null);
  } catch (e) {
    logger.logException('PgBoss health check failed to publish to pubsub', e);
  }
}
