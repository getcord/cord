import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

export default new AsyncTierJobDefinition('example', exampleJob);

type ExampleJobData = {
  message: string;
};

async function exampleJob(data: ExampleJobData, logger: Logger) {
  const { message } = data;

  logger.info(`ExampleJob: ${message}`);
}
