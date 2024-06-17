#!/usr/bin/env -S node --enable-source-maps

// This script lets you forward the incoming Slack events that we receive in the
// staging tier (those are the ones belonging to our "Cord Staging" Slack app)
// to your local dev environment server.
//
// Invoke like this: dist/scripts/forward-slack-events.js
//
// If you run into the SELF_SIGNED_CERT_IN_CHAIN error, then you need to run
// like this: NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
// dist/scripts/forward-slack-events.js
//
//
// The script connects to the admin endpoint of the staging tier to listen to
// live Slack events coming in. They are then send to your local server. The
// messages are also printed out on the terminal so you see what is happening.
//
// This will fetch an auth token from the admin tool directly, but you can also
// pass the --auth flag with a token to explicitly specify one.
//
// The `--wsUrl` and `--postUrl` options can be used to specify the urls to
// connect to for listening and to post messages to, respecitvely. By default
// you listen to Slack events on admin.staging.cord.com and send them to
// localhost:8161.

import 'dotenv/config.js';
import * as querystring from 'querystring';
import WebSocket from 'ws';
import yargs from 'yargs';

import {
  SLACK_EVENTS_WEBSOCKET_ENDPOINT,
  SLACK_EVENT_PATH,
  SLACK_INTERACTIVE_EVENT_PATH,
  SLACK_INTERNAL_EVENT_PATH,
  SLACK_INTERNAL_INTERACTIVE_EVENT_PATH,
} from 'server/src/const.ts';
import { fetchAuthToken } from 'scripts/lib/auth.ts';

const argv = yargs(process.argv.slice(2))
  .option('wsUrl', {
    type: 'string',
    description: 'url of the websocket to connect to',
    default: `wss://admin.staging.cord.com${SLACK_EVENTS_WEBSOCKET_ENDPOINT}`,
  })
  .option('postUrl', {
    type: 'string',
    description: 'url the websocket forwards standard slack events to',
    default: `https://localhost:8161${SLACK_EVENT_PATH}`,
  })
  .option('iPostUrl', {
    type: 'string',
    description: 'url the websocket forwards custom interactive events to',
    default: `https://localhost:8161${SLACK_INTERACTIVE_EVENT_PATH}`,
  })
  .option('internalPostUrl', {
    type: 'string',
    description: 'url the websocket forwards internal events to',
    default: `https://localhost:8123${SLACK_INTERNAL_EVENT_PATH}`,
  })
  .option('internalIPostUrl', {
    type: 'string',
    description: 'url the websocket forwards internal interactive events to',
    default: `https://localhost:8123${SLACK_INTERNAL_INTERACTIVE_EVENT_PATH}`,
  })
  .option('auth', {
    type: 'string',
    description: 'Authorization token of an admin user in staging',
    default: '',
  })
  .strict()
  .help()
  .alias('help', 'h').argv;

const { wsUrl, postUrl, iPostUrl, internalPostUrl, internalIPostUrl, auth } =
  argv;

async function main() {
  const ws = new WebSocket(wsUrl, {
    headers: { Authorization: await authToken(auth) },
  });

  const wsClosed = new Promise<void>((res) => ws.on('close', res));

  ws.on('open', () => {
    console.log('Websocket connection opened');

    // The websocket gets closed after being idle for one minute. Sending a ping
    // every 55 seconds prevents that.
    setInterval(() => {
      ws.ping();
    }, 55000);
  });

  ws.on('message', (msg: string | Buffer) => {
    console.log(`Forwarding message:\n${msg}\n\n`);

    const message = Buffer.isBuffer(msg) ? msg.toString() : msg;
    const parsed = JSON.parse(message);

    if (parsed.type === 'standard') {
      fetch(postUrl, {
        method: 'POST',
        body: JSON.stringify(parsed.event),
        headers: { 'Content-type': 'application/json' },
      }).catch(console.error);
    } else if (parsed.type === 'interactive') {
      fetch(iPostUrl, {
        method: 'POST',
        body: querystring.stringify(parsed.event),
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      }).catch(console.error);
    } else if (parsed.type === 'internal') {
      fetch(internalPostUrl, {
        method: 'POST',
        body: JSON.stringify(parsed.event),
        headers: { 'Content-type': 'application/json' },
      }).catch(console.error);
    } else if (parsed.type === 'internal-interactive') {
      fetch(internalIPostUrl, {
        method: 'POST',
        body: querystring.stringify(parsed.event),
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      }).catch(console.error);
    } else {
      console.log('Failed to determine Slack event type');
    }
  });

  await wsClosed;
  console.log('Websocket connection closed');
}

async function authToken(token: string) {
  if (token === '') {
    return 'Bearer ' + (await fetchAuthToken('staging'));
  } else if (token.startsWith('Bearer ')) {
    return token;
  } else {
    return `Bearer ${token}`;
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
