import type PgBoss from 'pg-boss';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

import type {
  EmptyJsonObject,
  JsonObject,
  JsonValue,
} from 'common/types/index.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { Viewer } from 'server/src/auth/index.ts';

type JobOptions = {
  concurrency: number;
};

// No particular reason for this value other than it felt right, and empirically
// when we hotfixed the initial concurrency change during an incident with the
// async tier it fixed things, so it's at least not a terrible value.
const DEFAULT_CONCURRENCY = 25;

export class AsyncTierJobDefinition<
  N extends string,
  D extends JsonObject | undefined = EmptyJsonObject,
> {
  public readonly schedules: AsyncJobSchedule<D>[] = [];

  constructor(
    public readonly name: N,
    public readonly func: (
      data: D,
      logger: Logger,
    ) => Promise<JsonValue | void>,
    public readonly opts: JobOptions = { concurrency: DEFAULT_CONCURRENCY },
  ) {}

  schedule(schedule: AsyncJobSchedule<D>) {
    this.schedules.push(schedule);
    return this;
  }

  /**
   * Register this job and their schedules with pgboss
   *
   * @param boss The pgboss insance to use
   * @param tier Name of the tier we're running in ('prod', 'staging', 'dev')
   * @param existingSchedulesByName an object mapping schedule names to
   * `PgBoss.Schedule` object. These are the schedules present in the database.
   */
  async register(
    boss: PgBoss,
    tier: string,
    existingSchedulesByName: Map<string, PgBoss.Schedule>,
  ) {
    const handler = async (data: D, logger: Logger) =>
      await this.func(data, logger);

    const wrappedHandler = (
      job: PgBoss.JobWithDoneCallback<D, JsonValue | void>,
    ) => {
      const logger = new Logger(Viewer.createAnonymousViewer(), {
        job: {
          id: job.id,
          name: job.name,
          data: job.data,
        },
      });
      logger.debug(`Starting job '${job.name}':${job.id}`);

      handler(job.data, logger).then(
        (result) => {
          job.done(null, result);
          logger.debug(`Completed job '${job.name}':${job.id}`);
        },
        (err) => {
          try {
            logger.logException(
              `Exception thrown by job '${job.name}':${job.id} : ${err}`,
              err,
            );
          } catch {
            // If our attempt to log fails, there's not much we can do.  But we
            // catch any exception here so that the following `job.done` is
            // guaranteed to run.
          }

          job.done(err);
        },
      );
    };

    const bossOpts =
      this.opts.concurrency > 1
        ? {
            teamSize: this.opts.concurrency,
            teamConcurrency: this.opts.concurrency,
            teamRefill: true,
          }
        : {};
    await boss.work(this.name, bossOpts, wrappedHandler);

    for (const schedule of this.schedules) {
      if (schedule.tier === 'all' || schedule.tier === tier) {
        const scheduledJobName = `schedule:${this.name}:${schedule.name}`;

        const existingSchedule = existingSchedulesByName.get(scheduledJobName);
        if (existingSchedule) {
          existingSchedulesByName.delete(scheduledJobName);
        }

        const existingScheduleUpToDate =
          existingSchedule &&
          existingSchedule.cron === schedule.cron &&
          isEqual(existingSchedule.data, schedule.data);

        if (!existingScheduleUpToDate) {
          if (existingSchedule) {
            await boss.unschedule(scheduledJobName);
          }

          await boss.schedule(scheduledJobName, schedule.cron, schedule.data, {
            tz: 'UTC',
          });
        }

        await boss.work(scheduledJobName, wrappedHandler);
      }
    }
  }
}

export type AsyncJobSchedule<D extends JsonObject | undefined> = {
  readonly tier: 'prod' | 'staging' | 'loadtest' | 'all';
  readonly name: string;
  readonly cron: string;
  readonly data: D;
};
