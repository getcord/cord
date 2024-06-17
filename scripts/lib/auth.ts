import * as https from 'https';
import * as path from 'path';
import * as url from 'url';
import { readFileSync } from 'fs';
import express from 'express';
import * as jwt from 'jsonwebtoken';
import open from 'open';
import env from 'server/src/config/Env.ts';

const PORT = 7349; // Prime time!

export async function fetchAuthToken(tier: 'prod' | 'staging' = 'prod') {
  const endpoint = `https://admin${
    tier !== 'prod' ? '.staging' : ''
  }.cord.com/auth-token`;

  const endpointUrl = new URL(endpoint);
  endpointUrl.searchParams.set(
    'token',
    jwt.sign(
      { redirect: `https://local.cord.com:${PORT}/__auth` },
      env.ADMIN_TOKEN_SECRET,
    ),
  );
  const authTokenPromise = listen();
  void open(endpointUrl.href, { background: true });
  return await authTokenPromise;
}

function listen(): Promise<string | null> {
  return new Promise((resolve) => {
    const app = express();

    app.get('/__auth', (req, res) => {
      const token = typeof req.query.token === 'string' && req.query.token;
      if (!token) {
        res.status(400).send('Invalid token').end();
        resolve(null);
        return;
      }

      resolve(token);

      res
        .status(200)
        .contentType('text/html')
        .send(
          `<!DOCTYPE html><html><body><script>window.close();</script></body>`,
        );
    });

    const server = https.createServer(
      {
        key: readFileSync(
          path.dirname(url.fileURLToPath(import.meta.url)) +
            '/../../localhost/localhost.key',
        ),
        cert: readFileSync(
          path.dirname(url.fileURLToPath(import.meta.url)) +
            '/../../localhost/localhost.crt',
        ),
      },
      app,
    );
    server.listen(PORT);
  });
}
