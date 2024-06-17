import type { NextFunction, Request, Response } from 'express';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export default function PlatformErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  anonymousLogger().logException(
    'Platform',
    error,
    {
      appID: req.appID,
      endpoint: `${req.method} ${req.path}`,
      payload: req.body,
    },
    undefined,
    'info',
  );

  if (error instanceof ApiCallerError) {
    return res.status(error.statusCode || 400).send({
      error: error.name,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' &&
        !process.env.IS_TEST &&
        error.stack && {
          stack: error.stack.split('\n').map((line: string) => line.trim()),
        }),
    });
  }

  // this is some error that should not have reached this point, e.g.
  // SequelizeUniqueConstraintError. We don't want to leak such errors to
  // partners.

  // log the error again, but this time at ERROR level so that we get
  // notified about this.
  anonymousLogger().logException(
    'a non platform error was thrown in platform endpoint',
    error,
    {
      appID: req.appID,
      endpoint: `${req.method} ${req.path}`,
    },
  );

  return res.status(500).send({
    error: 'error',
    message: 'internal server error',
    ...(process.env.NODE_ENV === 'development' &&
      !process.env.IS_TEST &&
      hasStack(error) && {
        stack: error.stack.split('\n').map((line: string) => line.trim()),
      }),
  });
}

function hasStack(error: unknown): error is { stack: string } {
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    return typeof (error as { stack: any }).stack === 'string';
  }
  return false;
}
