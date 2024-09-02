import * as cluster from 'cluster';
import { cpus } from 'os';
import { initBoss } from 'server/src/asyncTier/pgboss.ts';
import { serverMain } from 'server/src/public/server.ts';
import { adminMain } from 'server/src/admin/server.ts';
import { consoleMain } from 'server/src/console/server.ts';
import { metricsMain } from 'server/src/logging/prometheus.ts';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import env from 'server/src/config/Env.ts';
import { initRedis } from 'server/src/redis/index.ts';
import { parseListenPort, preparePort } from 'server/src/util/port.ts';
import * as serverStatus from 'server/src/serverStatus.ts';
import { initPubSub } from 'server/src/pubsub/index.ts';
import {
  closeFeatureFlags,
  initFeatureFlags,
} from 'server/src/featureflags/index.ts';
import { initializeLinkSigningCredentials } from 'server/src/files/upload.ts';
import {
  anonymousLogger,
  flushAndCloseWinstonCloudWatch,
} from 'server/src/logging/Logger.ts';
import { waitForEmptyBackground } from 'server/src/util/backgroundPromise.ts';
import { asyncLocalStorage } from 'server/src/logging/performance.ts';
import { startPyroscope, stopPyroscope } from 'server/src/logging/pyroscope.ts';

export type WorkerType = 'api' | 'admin' | 'console';
function isWorkerType(x: any): x is WorkerType {
  return x === 'api' || x === 'admin' || x === 'console';
}

// Message type for workers to signal their readiness to the master process
const workerReadyMessage = 'cord-server:workerReady';
const workerDrainMessage = 'cord-server:workerDrain';

async function main() {
  // The server process can be run as a single process, or as a NodeJS cluster.
  // This can be configured via the NUM_WORKERS config setting: any number
  // greater than 0 or the value 'auto' activates cluster mode. ('auto' gets
  // replaced with the number of CPUs on the system.)
  const numWorkers =
    env.NUM_WORKERS === 'auto'
      ? cpus().length
      : env.NUM_WORKERS
      ? parseInt(env.NUM_WORKERS)
      : 0;
  const clusterMode = numWorkers > 0;

  // Some constants are derived from the above `numWorkers` value and from the
  // `cluster` module's `isMaster` constant.
  //
  //                            |when run as   |cluster mode, |cluster mode, |
  //                            |single process|master proc.  |worker process|
  // -------------------------------------------------------------------------
  // numWorkers                 |0             |>= 1          |>= 1          |
  // clusterMode                |false         |true          |true          |
  // isSingleProcess            |true          |false         |false         |
  // isSingleProcessOrMaster    |true          |true          |false         |
  // isMaster                   |false         |true          |false         |
  // isWorker                   |false         |false         |true          |
  // workerType                 |null          |null          |'api'|'admin' |

  const isSingleProcess = !clusterMode;
  const isSingleProcessOrMaster = isSingleProcess || cluster.isMaster;
  const isMaster = clusterMode && cluster.isMaster;
  const isWorker = !cluster.isMaster;
  const workerType: WorkerType | null =
    clusterMode &&
    !cluster.isMaster &&
    isWorkerType(process.env.CORD_WORKER_TYPE)
      ? process.env.CORD_WORKER_TYPE
      : null;

  // Some consistency checks
  if (isSingleProcess && isWorker) {
    throw new Error(
      'Server process is a cluster worker, despite server is not configured ' +
        'to run in cluster mode',
    );
  }
  if (isWorker && workerType === null) {
    throw new Error(
      `Server process is a cluster worker, but CORD_WORKER_TYPE is not a ` +
        `recognised worker type (CORD_WORKER_TYPE=${process.env.CORD_WORKER_TYPE})`,
    );
  }

  // Log information about the mode this server is operating in
  if (clusterMode) {
    if (cluster.isMaster) {
      anonymousLogger().info(
        `Running in cluster mode with ${numWorkers} workers.`,
      );
    } else {
      anonymousLogger().info(
        `Cluster mode worker starting up (pid: ${process.pid})`,
      );
    }
  } else {
    anonymousLogger().info(
      `Running in single-process mode (cluster mode is off).`,
    );
  }
  if (isSingleProcessOrMaster) {
    // print basic logging information
    anonymousLogger().logLoggerInfo();
  }

  // The following initialisation code is run by all processes, including both
  // master and workers when in cluster mode.

  // Wait for the connection to the Async Tier Job Queue to initialize
  await initBoss();

  // make sure sequelize is happy
  await initSequelize(workerType ?? 'master');

  initRedis();

  // Wait for PubSub to initialize
  await initPubSub();

  await initFeatureFlags().catch(
    anonymousLogger().exceptionLogger('initFeatureFlags failed'),
  );

  await initializeLinkSigningCredentials();

  const promises: Promise<any>[] = [];

  // -------------------------------------------------------------------------
  // METRICS

  if (isSingleProcessOrMaster) {
    // Either we are not in cluster mode, or this process is the master. In
    // worker processes we skip this section.

    const port = parseListenPort(env.METRICS_SERVER_PORT);
    if (port) {
      await preparePort(port);
      promises.push(metricsMain(port, clusterMode));
    } else {
      anonymousLogger().warn(
        'Metrics server not started. Add METRICS_SERVER_PORT to .env!',
      );
    }
  }

  // -------------------------------------------------------------------------
  // API

  if (isSingleProcessOrMaster || workerType === 'api') {
    // Either we are not in cluster mode, or this process is the master or an
    // 'api' worker. (If this is a worker process of a different type, we skip
    // this section.)

    const port = parseListenPort(env.API_SERVER_PORT);
    if (port) {
      if (isSingleProcessOrMaster) {
        await preparePort(port);
      }
      if (isMaster) {
        // We are in cluster mode, and this process is the master

        for (let i = 0; i < numWorkers; i++) {
          promises.push(setupWorker('api', `API worker #${i + 1}`));
        }
      } else {
        // Either we are not in cluster mode, or this is an 'api' worker process

        promises.push(serverMain(port));
      }
    } else {
      anonymousLogger().warn(
        'API server not started. Add API_SERVER_PORT to .env!',
      );
    }
  }

  // -------------------------------------------------------------------------
  // ADMIN

  if (!env.IGNORE_ADMIN_SERVER_WORKER && (isSingleProcessOrMaster || workerType === 'admin')) {
    // Either we are not in cluster mode, or this process is the master or an
    // 'admin' worker. (If this is a worker process of a different type, we skip
    // this section.)

    const port = parseListenPort(env.ADMIN_SERVER_PORT);
    if (port) {
      if (isSingleProcessOrMaster) {
        await preparePort(port);
      }
      if (isMaster) {
        // We are in cluster mode, and this process is the master

        promises.push(setupWorker('admin', 'Admin worker'));
      } else {
        // Either we are not in cluster mode, or this is an 'admin' worker
        // process

        promises.push(adminMain(port));
      }
    } else {
      anonymousLogger().warn(
        'Admin server not started. Add ADMIN_SERVER_PORT to .env!',
      );
    }
  }

  // -------------------------------------------------------------------------
  // CONSOLE

  if (!env.IGNORE_CONSOLE_SERVER_WORKER && (isSingleProcessOrMaster || workerType === 'console')) {
    // Either we are not in cluster mode, or this process is the master or an
    // 'console' worker. (If this is a worker process of a different type, we skip
    // this section.)

    const port = parseListenPort(env.CONSOLE_SERVER_PORT);
    if (port) {
      if (isSingleProcessOrMaster) {
        await preparePort(port);
      }
      if (isMaster) {
        // We are in cluster mode, and this process is the master

        promises.push(setupWorker('console', 'Console worker'));
      } else {
        // Either we are not in cluster mode, or this is an 'console' worker
        // process

        promises.push(consoleMain(port));
      }
    } else {
      anonymousLogger().warn(
        'Console server not started. Add CONSOLE_SERVER_PORT to .env!',
      );
    }
  }

  // -------------------------------------------------------------------------
  // STATUS

  let waitForStatusServerToEnd = Promise.resolve();
  if (isSingleProcessOrMaster) {
    // Either we are not in cluster mode, or this process is the master. In
    // worker processes we skip this section.

    const port = parseListenPort(env.STATUS_SERVER_PORT);
    if (port) {
      await preparePort(port);
      const { statusServerReady, statusServerTerminating } =
        serverStatus.statusMain(port);
      promises.push(statusServerReady);
      waitForStatusServerToEnd = statusServerTerminating;
    }
  }

  process.on('unhandledRejection', (reason, _promise) => {
    const storage = asyncLocalStorage?.getStore();
    anonymousLogger().logException('😱 Unhandled Rejection', reason, {
      operationName: storage?.operationName,
      operationID: storage?.operationID,
      platformApplicationID: storage?.platformApplicationID,
    });
  });

  // Wait for all initialization functions to completed. When in cluster mode on
  // the master process, this includes waiting for all workers to signal their
  // readiness.
  await Promise.all(promises);

  startPyroscope();
  serverStatus.initializationComplete();

  if (isSingleProcessOrMaster) {
    anonymousLogger().info('Server initialization complete');
  } else {
    process.on('message', (msg: any) => {
      if (msg.type === workerDrainMessage) {
        serverStatus.drainHelper.drain();
      }
    });
    if (process.send) {
      process.send({ type: workerReadyMessage });
    } else {
      anonymousLogger().error('Worker process cannot send message to master');
    }
  }

  // The server is now up and running. Once it is signalled to start draining,
  // it will gracefully shutdown.
  // Wait for the draining process to complete.
  await serverStatus.drainHelper.waitUntilTerminating();
  await waitForEmptyBackground();
  await stopPyroscope();

  // Draining is complete now, the server is done with work. The STATUS server
  // might just be sending responses to notify clients of the server shutdown,
  // so let's wait until the STATUS server is done with its work, too.
  await waitForStatusServerToEnd;

  // We're done with all our work, so close down any subsystems that need it
  closeFeatureFlags();
  await flushAndCloseWinstonCloudWatch();
}

function setupWorker(workerType: WorkerType, workerName: string) {
  // Spawn a new worker process. The NodeJS cluster module does this for us.
  const worker = cluster.fork({
    CORD_WORKER_TYPE: workerType,
    CORD_WORKER_NAME: workerName,
  });
  (worker as any)._cord = { workerType, workerName };

  // Return a promise that resolves when we received the worker-ready-message from
  // the newly started worker process.
  return new Promise<void>((resolve, reject) => {
    let workerReady = false;
    let draining = false;
    let exitted = false;
    const expireKeepAlive = serverStatus.drainHelper.keepAlive();

    function messageHandler(msg: any) {
      if (msg.type === workerReadyMessage && !workerReady) {
        workerReady = true;
        resolve();
        worker.removeListener('message', messageHandler);
      }
    }
    worker.addListener('message', messageHandler);

    worker.on('exit', (code, signal) => {
      exitted = true;
      expireKeepAlive();

      if (draining) {
        // The worker exited after we sent it a `workerDrainMessage`. That's
        // exactly what we expect it to do.

        if (!workerReady) {
          // If this happens early on, before we even got the
          // `workerReadyMessage` then we need to do a little clean-up.
          workerReady = true;
          resolve();
          worker.removeListener('message', messageHandler);
        }
      } else {
        // The worker exited even though we never sent it a
        // `workerDrainMessage`. That's not right.
        if (workerReady) {
          anonymousLogger().error(
            `${workerName} died, restarting [code ${code} / signal ${signal}]`,
          );
          // The worker died unexpectedly, but it had previously signaled it was
          // ready, so it has a functional configuration.  Restart it.
          setupWorker(workerType, workerName).then(
            () => {
              anonymousLogger().info(`${workerName} restarted.`);
            },
            (err) => {
              anonymousLogger().error(
                `${workerName} could not be restarted: ${err}`,
              );
            },
          );
        } else {
          workerReady = true;
          anonymousLogger().error(
            `${workerName} exited before signalling readiness`,
          );
          reject(new Error(`${workerName} exited before signalling readiness`));
        }
      }
    });

    serverStatus.drainHelper.on('draining', () => {
      draining = true;
      if (!exitted) {
        worker.send({ type: workerDrainMessage });
      }
    });
  });
}

main().then(
  () => {
    anonymousLogger().info('Server process is terminating normally');
    process.exit(0);
  },
  (err) => {
    console.error(err);
    anonymousLogger().error(err);
    process.exit(1);
  },
);
