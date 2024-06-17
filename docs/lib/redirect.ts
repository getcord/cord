import * as url from 'url';
import type { RequestHandler } from 'express';

const makeRedirect = (dest: string) => {
  const handler: RequestHandler = (req, res) => {
    const query = req.query;
    const params: Record<string, any> = {};
    for (const param in query) {
      params[param] = query[param];
    }
    res.redirect(url.format({ pathname: dest, query: params }));
  };
  return handler;
};

export default makeRedirect;
