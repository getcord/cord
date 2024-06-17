import { hostname } from 'os';
import Pyroscope from '@pyroscope/nodejs';

// See similar in server/src/logging/Logger.ts
declare const BUILDCONSTANTS: {
  loggingProcessName: string;
};

const endpoint = process.env.PYROSCOPE_ENDPOINT;

export function startPyroscope() {
  if (!endpoint) {
    return;
  }

  Pyroscope.init({
    appName: BUILDCONSTANTS.loggingProcessName,
    serverAddress: endpoint,
    tags: {
      host: hostname(),
      tier: process.env.CORD_TIER ?? 'unknown',
      workerName: process.env.CORD_WORKER_NAME ?? 'unknown',
      workerType: process.env.CORD_WORKER_TYPE ?? 'unknown',
    },
  });

  Pyroscope.start();
}

export async function stopPyroscope() {
  if (!endpoint) {
    return;
  }

  await Pyroscope.stop();
}
