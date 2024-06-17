import type { Profiler } from 'inspector';
import * as inspector from 'inspector';
import type { Request, Response } from 'express';
import type { RequestWithContext } from 'server/src/RequestContext.ts';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import sleep from 'common/util/sleep.ts';

async function writeOutCPUProfileImpl(request: Request, response: Response) {
  {
    // before deleting this check, make sure that both admin and public server
    // are only allowing admins to use this endpoint
    if (!(request as RequestWithContext).context.session.isAdmin) {
      response.statusCode = 403;
      response.send('access denied');
      return;
    }
    response.statusCode = 200;
    response.setHeader('Content-type', 'application/json');
    const session = new inspector.Session();
    session.connect();

    await enableProfiler(session);
    await startProfiler(session);

    // If a valid length was specified (not NaN and within reasonable bounds),
    // use it, otherwise default to 5 seconds.
    const reqMs = Number(request.query.ms);
    const ms = reqMs && 0 < reqMs && reqMs <= 2 * 60 * 1000 ? reqMs : 5000;

    await sleep(ms);

    const { profile } = await stopProfiler(session);
    response.write(JSON.stringify(profile));
    session.disconnect();
    response.end();
  }
}

export const writeOutCPUProfile = forwardHandlerExceptionsToNext(
  writeOutCPUProfileImpl,
);

async function takeHeapSnapshotImpl(request: Request, response: Response) {
  // before deleting this check, make sure that both admin and public server
  // are only allowing admins to use this endpoint
  if (!(request as RequestWithContext).context.session.isAdmin) {
    response.statusCode = 403;
    response.send('access denied');
    return;
  }
  response.statusCode = 200;
  response.setHeader('Content-type', 'application/json');

  const session = new inspector.Session();
  session.connect();

  session.on('HeapProfiler.addHeapSnapshotChunk', (m) => {
    response.write(m.params.chunk);
  });

  session.post('HeapProfiler.takeHeapSnapshot', undefined, () => {
    session.disconnect();
    response.end();
  });
}

function enableProfiler(session: inspector.Session) {
  return sendMessage('Profiler.enable', session);
}

function startProfiler(session: inspector.Session) {
  return sendMessage('Profiler.start', session);
}

function stopProfiler(session: inspector.Session) {
  return sendMessage(
    'Profiler.stop',
    session,
  ) as Promise<Profiler.StopReturnType>;
}

function sendMessage<T extends string>(message: T, session: inspector.Session) {
  return new Promise((resolve, reject) =>
    session.post(message, (err: Error | null, result: unknown) => {
      if (err != null) {
        reject(err);
      }
      resolve(result);
    }),
  );
}

export const takeHeapSnapshot =
  forwardHandlerExceptionsToNext(takeHeapSnapshotImpl);
