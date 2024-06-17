#!/usr/bin/env node

import * as child_process from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

import cookieParser from 'cookie-parser';
import express from 'express';
import { createProxyServer } from 'http-proxy';
import * as jwt from 'jsonwebtoken';
import * as secretsManager from '@aws-sdk/client-secrets-manager';

const DEPLOY_HOSTNAME = 'pr-server.int.cord.com';
const PR_REGEX = /^pr(\d+)(-(api|admin|console|docs))?\.dev\.cord\.com$/;

const COOKIE_NAME = 'cord_dev';
const NONCE_COOKIE_NAME = 'cord_dev_nonce';
const ADMIN_TOKEN_ENDPOINT_URL = 'https://admin.staging.cord.com/admin-token';

const cookieSecret = randomUUID();

const ADMIN_TOKEN_SECRET_NAME = 'admin-token-secret';
const AWS_REGION = 'eu-west-2';
interface RequestWithContext extends express.Request {
  parsedHostName?: {
    readonly pr: number;
    readonly endpoint: Endpoint;
  };
}

const ENDPOINTS = [null, 'api', 'admin', 'console', 'docs'] as const;
type Endpoint = (typeof ENDPOINTS)[number];
function isEndpoint(value: string | null): value is Endpoint {
  return (ENDPOINTS as readonly (string | null)[]).includes(value);
}

async function main() {
  const adminTokenSecret = JSON.parse(
    (
      await new secretsManager.SecretsManagerClient({
        region: AWS_REGION,
      }).send(
        new secretsManager.GetSecretValueCommand({
          SecretId: ADMIN_TOKEN_SECRET_NAME,
        }),
      )
    ).SecretString || '{}',
  ).secret;

  const proxy = createProxyServer();
  proxy.on('error', (err) => console.error(err));
  const app = express();

  // Handle http://pr-server.int.cord.com/deploy
  app.get('/deploy', (req, res, next) => {
    if (req.hostname !== DEPLOY_HOSTNAME) {
      next();
      return;
    }
    const { pr, ref } = req.query;

    if (typeof pr !== 'string' || !/^\d+$/.test(pr)) {
      res.status(400).send('Invalid pr parameter').end();
      return;
    }
    if (typeof ref !== 'string' || !/^[0-9a-f]+$/.test(ref)) {
      res.status(400).send('Invalid ref parameter').end();
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-type', 'text/plain; charset=utf-8');
    res.write('');

    console.log(`Beginning deployment of PR #${pr} (${ref})`);
    const proc = child_process.spawn(
      'sudo',
      ['/root/deploy.sh', `${pr}`, `${ref}`],
      {
        cwd: '/',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    proc.stdout.pipe(res, { end: false });
    proc.stderr.pipe(res, { end: false });
    proc.on('error', (err) => {
      console.log(`Aborted deployment of PR #${pr} (${ref})`);
      console.error(err);
      res.end();
    });
    proc.on('close', () => {
      console.log(`Completed deployment of PR #${pr} (${ref})`);
      res.end();
    });
  });

  // Parse hostname
  app.use((req: RequestWithContext, _res, next) => {
    req.parsedHostName = getPrHostName(req.hostname);
    next();
  });

  // Parse cookies
  app.use(cookieParser());

  app.get('/__auth', (req, res) => {
    const state =
      typeof req.query.state === 'string' &&
      verifyJsonObject(req.query.state, adminTokenSecret);
    if (
      !state ||
      !('nonce' in state) ||
      typeof state.nonce !== 'string' ||
      !('url' in state) ||
      typeof state.url !== 'string'
    ) {
      res.status(400).send('Invalid state').end();
      return;
    }

    const { nonce, url } = state;
    const nonceCookie = req.cookies[NONCE_COOKIE_NAME];

    if (nonceCookie && nonceCookie === nonce) {
      const token = jwt.sign({ authenticated: true }, cookieSecret, {
        expiresIn: 600,
      });
      res.cookie(COOKIE_NAME, token, {
        domain: 'dev.cord.com',
        httpOnly: true,
        secure: true,
      });
      res.clearCookie(NONCE_COOKIE_NAME);
    }

    res.redirect(308, url);
    res.end();
  });

  app.use(authMiddleware());

  // Proxy requests to prXXX-{api,admin,console,docs}.dev.cord.com
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  app.use(async (req: RequestWithContext, res, next) => {
    const { parsedHostName } = req;

    if (parsedHostName && parsedHostName.endpoint) {
      // If we can't access the `/src/pr/PR-NUMBER/` directory...
      if (
        !(await fs.promises
          .access(`/srv/pr/${parsedHostName.pr}/`, fs.constants.R_OK)
          .then(
            () => true,
            () => false,
          ))
      ) {
        // ...then we don't have this PR. Return a 404
        res.sendStatus(404).end();
        return;
      }
      try {
        return proxy.web(
          req,
          res,
          {
            target: getTarget(parsedHostName.pr, parsedHostName.endpoint),
          },
          (err) => {
            console.error(err);
            res.status(500).type('text/plain').send(`${err}`).end();
          },
        );
      } catch {
        res.sendStatus(500).end();
      }
    } else {
      next();
      return;
    }
  });

  // Handle requests to prXXX.dev.cord.com
  app.use((req: RequestWithContext, res, next) => {
    const { parsedHostName } = req;

    if (parsedHostName && parsedHostName.endpoint === null) {
      return express.static(`/srv/pr/${parsedHostName.pr}/app`)(req, res, next);
    } else {
      next();
      return;
    }
  });

  const server = app.listen(8081);
  server.on('upgrade', (req, socket, head) => {
    const parsedHostName = getPrHostName(req.headers.host);

    if (parsedHostName && parsedHostName.endpoint) {
      return proxy.ws(
        req,
        socket,
        head,
        {
          target: getTarget(parsedHostName.pr, parsedHostName.endpoint),
        },
        (err) => {
          console.error(err);
          socket.end();
        },
      );
    }
  });
}

function getPrHostName(host: string | undefined) {
  if (host) {
    const match = PR_REGEX.exec(host);
    if (match) {
      const [_0, pr, _2, endpoint] = match;
      return {
        pr: Number(pr),
        endpoint: isEndpoint(endpoint) ? endpoint : null,
      } as const;
    }
  }
  return undefined;
}

function getTarget(pr: number, endpoint: Exclude<Endpoint, null>) {
  const socketPath = `/srv/pr/${pr}/${endpoint}`;
  return { host: 'localhost', port: 80, socketPath, protocol: 'http:' };
}

function verifyJsonObject(
  token: string,
  secretOrPublicKey: jwt.Secret,
  options?: jwt.VerifyOptions,
) {
  try {
    const obj = jwt.verify(token, secretOrPublicKey, options);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj;
    }
  } catch {}
  return null;
}

const authMiddleware =
  (): express.Handler => (req: RequestWithContext, res, next) => {
    if (req.method === 'OPTIONS') {
      // OPTIONS requests (at least cross-site ones) won't come with cookies,
      // but it's okay to pass them on even if not authenticated.
      next();
      return;
    }

    const cookie = req.cookies[COOKIE_NAME];
    let authenticated = false;

    if (typeof cookie === 'string') {
      try {
        // The following lines throws if the cookie is not a json web token
        // signed with `cookieSecret`.
        const payload = jwt.verify(cookie, cookieSecret);
        authenticated =
          typeof payload === 'object' && (payload as any).authenticated;
      } catch {}
    }

    if (!authenticated) {
      // Intercept this request and redirect to admin, which redirects back to
      // this host (`/__auth`) if this use is logged into admin.
      const url = new URL(ADMIN_TOKEN_ENDPOINT_URL);
      const nonce = randomUUID();
      url.searchParams.set('redirect', `https://${req.hostname}/__auth`);
      url.searchParams.set('url', `https://${req.hostname}${req.url}`);
      url.searchParams.set('nonce', nonce);
      res.cookie(NONCE_COOKIE_NAME, nonce, { httpOnly: true, secure: true });
      res.redirect(url.href);
      return;
    }

    next();
  };

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
