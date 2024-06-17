import express from 'express';

export type RequestWithRawBody = express.Request & {
  rawBody: Buffer;
};

export function jsonMiddleware() {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    express.json({
      // some API endpoints, for example /v1/batch, receive a larger amount of data than usual
      limit: '10mb',
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      verify: (req, _res, buf) => {
        // grab a hold of the raw body before req.body gets replaced with the
        // JSON parsed body
        (req as RequestWithRawBody).rawBody = buf;
      },
    })(req, res, (error) => {
      if (error) {
        res.status(400).send({
          error: 'invalid_request',
          message: error.message ?? 'JSON parse error.',
        });
        return;
      }
      next();
    });
  };
}

export function urlEncodedMiddleware() {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    express.urlencoded({
      extended: true,
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      verify: (req, _res, buf) => {
        (req as RequestWithRawBody).rawBody = buf;
      },
    })(req, res, (error) => {
      if (error) {
        res.status(400).send({
          error: 'invalid_request',
          message: error.message ?? 'URL encoded parse error',
        });
        return;
      }
      next();
    });
  };
}
