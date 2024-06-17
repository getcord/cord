import * as http from 'http';

import express from 'express';

import type { ListenPort } from 'server/src/util/port.ts';
import { getHostPortion } from 'server/src/util/port.ts';
import { DrainHelper } from 'server/src/util/drainHelper.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

type ServerStatus = 'initializing' | 'ok' | 'draining' | 'terminating';

let currentStatus: ServerStatus = 'initializing';
const callbackWhenInitializationComplete: Array<() => void> = [];

function setStatus(newStatus: ServerStatus) {
  if (currentStatus !== newStatus) {
    anonymousLogger().info(
      `Server status changed: ${currentStatus} -> ${newStatus}`,
      {
        oldStatus: currentStatus,
        newStatus,
      },
    );
    currentStatus = newStatus;
  }
}

export function initializationComplete() {
  if (currentStatus === 'initializing') {
    setStatus('ok');

    while (callbackWhenInitializationComplete.length) {
      try {
        callbackWhenInitializationComplete.shift()!();
      } catch (err) {
        // This might just be a `/wait-for-init` request that has been closed
        // client-side, so sending the response now fails. No big deal.
        anonymousLogger().warn(
          `Initialization complete callback threw an error: ${err}`,
        );
      }
    }
  } else {
    anonymousLogger().error(
      `initializationComplete was called while current status is ${currentStatus}`,
    );
  }
}

export const drainHelper = new DrainHelper();
drainHelper.once('draining', () => {
  setStatus('draining');
});
drainHelper.once('terminating', () => {
  setStatus('terminating');
});

export function statusMain(port: ListenPort) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/status', (_req, res) => {
    res.setHeader('Content-type', 'text/plain');
    res.end(currentStatus);
  });

  app.get('/wait-for-init', (_req, res) => {
    res.setHeader('Content-type', 'text/plain');
    if (currentStatus === 'initializing') {
      callbackWhenInitializationComplete.push(() => res.end(currentStatus));
    } else {
      res.end(currentStatus);
    }
  });

  app.post('/drain', (_req, res) => {
    drainHelper.drain();
    res.setHeader('Content-type', 'text/plain');
    res.end(currentStatus);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  app.post('/drain-and-wait', async (_req, res) => {
    drainHelper.drain();
    await drainHelper.waitUntilTerminating();
    res.setHeader('Content-type', 'text/plain');
    res.end(currentStatus);
  });

  const server = http.createServer(app);

  // We want to keep the STATUS server alive just a tiny little bit longer than
  // the rest: if an incoming request for `/drain-and-wait` triggers draining,
  // we send the response back when the draining has completed. However, at that
  // point in time we would also terminate the process, and it might happen that
  // this process ends before we managed to send the response. To solve this
  // problem, we make a separate drainHelper for this status server, and wait
  // for that one to terminate, too, before we end the process.
  const statusServerDrainHelper = new DrainHelper();
  server.addListener('connection', (socket) => {
    socket.once('close', statusServerDrainHelper.keepAlive());
  });
  drainHelper.once('terminating', () => statusServerDrainHelper.drain());
  const statusServerTerminating =
    statusServerDrainHelper.waitUntilTerminating();

  const statusServerReady = new Promise<void>((resolve, reject) => {
    server.addListener('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve();

      anonymousLogger().info(
        `🚀 Status server ready at https://${getHostPortion(
          server.address(),
        )}/`,
      );
    });
  });

  // Start our server
  return { statusServerReady, statusServerTerminating };
}
