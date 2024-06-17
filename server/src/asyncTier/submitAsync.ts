import type PgBoss from 'pg-boss';
import type { AsyncJobDataTypes } from 'server/src/asyncTier/jobs.ts';
import { getBoss } from 'server/src/asyncTier/pgboss.ts';

export default function submitAsync<N extends keyof AsyncJobDataTypes>(
  name: N,
  data: AsyncJobDataTypes[N],
  options?: PgBoss.SendOptions,
) {
  return getBoss().send(name, data, options ?? {});
}
