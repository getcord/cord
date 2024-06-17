//import type { ExampleJobData } from 'server/src/asyncTier/jobs.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { MAX_FILE_UPLOADING_TIME_SECONDS } from 'common/const/Timing.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';

export default new AsyncTierJobDefinition(
  'databaseTidyUp',
  databaseTidyUpJob,
).schedule({
  tier: 'staging',
  name: 'every15Minutes',
  cron: '0,15,30,45 * * * *',
  data: {},
});

async function databaseTidyUpJob() {
  // `files` table: set `uploadStatus` to CANCELLED for files older than
  // MAX_FILE_UPLOADING_TIME_SECONDS and status UPLOADING.
  await getSequelize().query(
    `UPDATE "${FileEntity.tableName}"
     SET "uploadStatus" = $1
     WHERE "uploadStatus" = $2
     AND "timestamp" < NOW() - $3::INTERVAL;`,
    {
      bind: [
        'cancelled',
        'uploading',
        `${MAX_FILE_UPLOADING_TIME_SECONDS} seconds`,
      ],
    },
  );
}
