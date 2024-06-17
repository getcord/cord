// This is a script for load testing our system. To use it, you need to install
// k6 (https://k6.io/docs/getting-started/installation/)
//
// The core of this script is the default exported function which defines what
// 1 virtual user does. We can supply various flags to k6 (see example below)
// to describe how many virtual users we want to run in parallel and for how long.
//
// This load test uses a pre-recorded list of graphql operations stored in a
// HAR file (instructions on how to build one below). One virtual user will go
// through the operations, wait for 3 seconds and then finish.
//
// Example usage:
// k6 run \
//  -e ENDPOINT="wss://localhost:8161/gql" \ # the endpoint you will be hitting
//  -e TOKEN="eyxxxxxx" \ # your Cord token (without bearer)
//  -e HAR_FILE="session.har" \ # path to your HAR file with WS messages
//  --stage 20s:200 \ # Ramp up the number of virtual users from 0 to 200 in 20s
//  --stage 30s:200 \ # When previous stage is complete, maintain 200 virtual users for 30s
//  --stage 10s:0 \ # When previous stage is complete, ramp down the number of virtual users to 0 in 10s
//  --summary-trend-stats="avg,min,med,max,p(90),p(99.9),p(99.99),count" \ # which statistics you want to see displayed for "Trend"-type metrics
//  scripts/load_test.cjs
//
// To obtain a HAR file, you need to:
// - open the browser and go to the extension's background page
// - open the Network tab and refresh it (CMD+R)
// - make sure you see a new /gql websocket connection
// - now your session started, open some pages, scroll through some messages,
//   open your inbox, etc. Just don't send any messages or do any non-replayable
//   actions.
// - once done, right-click on the /gql and "Save all as HAR with content"
// - now you have file you can use with this load script
import ws from 'k6/ws';
import { check, fail } from 'k6';
import exec from 'k6/execution';
import { Counter, Trend } from 'k6/metrics';
/* eslint-disable no-restricted-imports -- k6 is picky about how files are imported */
import {
  loadWebsocketMessages,
  prepareWebsocketMessages,
  prepareMessage,
} from './util.mjs';

// __ENV is populated by k6
/* global __ENV:false */

const BEARER_TOKENS = __ENV.TOKEN.split(':').map((x) => `Bearer ${x}`);
const ENDPOINT = __ENV.ENDPOINT;
const HAR_FILE = __ENV.HAR_FILE;
const JSON_FILE = __ENV.JSON_FILE;
const URLS_TO_REPLACE = __ENV.URLS_TO_REPLACE
  ? __ENV.URLS_TO_REPLACE.split('|')
  : [];
const VERSION = 'load_test_version';

if (HAR_FILE && JSON_FILE) {
  fail('May only specify HAR_FILE or JSON_FILE');
}

const ORIGINAL_MESSAGES = HAR_FILE
  ? loadWebsocketMessages(open(HAR_FILE))
  : JSON.parse(open(JSON_FILE));

// custom metrics
const timeTilData = new Trend('time_until_data_ms');
const numOfGraphQLQueriesSent = new Counter('num_of_gql_queries_sent');
const numOfGraphQLResponsesReceived = new Counter(
  'num_of_gql_responses_received',
);

class VirtualUserState {
  constructor(token) {
    this.timings = new Map(); // for storing start times of graphql requests
    this.opIdx = 0; // counter for graphql operations
    this.timeOfLastSend = undefined;
    this.lastPageContextHash = undefined;
    this.replacementUrl = `http://example.com/replacementURL-${exec.scenario.iterationInTest}`;
    this.messages = prepareWebsocketMessages(ORIGINAL_MESSAGES, token, VERSION);
  }

  hasMessageToSend() {
    return this.opIdx < this.messages.length;
  }

  // this function sends a message over the socket and then schedules sending
  // of the next message and so on until all messages are sent. The alternative
  // was to do something like:
  //
  // while (this.hasMessageToSend()) {
  //  send a message
  //  sleep for a while
  // }
  //
  // Unfortunately, k6s sleep() function seems to block the main thread, which
  // prevents us from receiving messages while we're sleeping
  sendNextMessageAndThenTheRest(socket) {
    const message = prepareMessage(
      this.messages[this.opIdx++],
      URLS_TO_REPLACE,
      this.replacementUrl,
      this.lastPageContextHash,
    );

    this.timeOfLastSend = Date.now();
    socket.send(message.data);
    // TODO: should we start measuring time before send()?
    const now = Date.now();
    if (message.dataParsed.type === 'start') {
      const thisShouldBeUndefined = this.timings.get(message.dataParsed.id);
      check(thisShouldBeUndefined, {
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        'no repeated op ids': (thisShouldBeUndefined) =>
          thisShouldBeUndefined === undefined,
      });
      this.timings.set(message.dataParsed.id, {
        startTime: now,
        isSubscription: message.isSubscription,
        operationName: message.dataParsed.payload.operationName,
      });
      if (!message.isSubscription) {
        numOfGraphQLQueriesSent.add(1);
      }
    }

    if (!this.hasMessageToSend()) {
      // this was the last message
      // 3 seconds of grace to receive responses before closing the connection
      socket.setTimeout(() => socket.close(), 3000);
      return;
    }

    // schedule the sending of next message
    const gapBetweenMessagesMs =
      (this.messages[this.opIdx].time - this.messages[this.opIdx - 1].time) *
      1000;
    const timeSinceLastSendMs = Date.now() - this.timeOfLastSend;
    const sleepTimeMs = Math.max(gapBetweenMessagesMs - timeSinceLastSendMs, 1);
    socket.setTimeout(
      () => this.sendNextMessageAndThenTheRest(socket),
      sleepTimeMs,
    );
  }

  // handle graphql message
  onMessage(message) {
    const now = Date.now();
    const parsedMessage = JSON.parse(message);

    const type = parsedMessage.type;
    // make sure we don't get something unexpected, e.g. an error
    check(type, {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      'type is data/complete/connection_ack': (type) => {
        return (
          type === 'data' || type === 'complete' || type === 'connection_ack'
        );
      },
    });

    if (type === 'data') {
      if (
        parsedMessage.payload &&
        parsedMessage.payload.data &&
        parsedMessage.payload.data.page &&
        parsedMessage.payload.data.page.contextHash
      ) {
        this.lastPageContextHash = parsedMessage.payload.data.page.contextHash;
      }
    } else if (type === 'complete') {
      const timingInfo = this.timings.get(parsedMessage.id);

      // sanity check
      check(timingInfo, {
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        'timingInfo is not undefined': (timingInfo) => timingInfo !== undefined,
      });

      if (timingInfo && !timingInfo.isSubscription) {
        // timings of subscription would skew the "timeTilData" metric
        const duration = now - timingInfo.startTime;
        timeTilData.add(duration, { operationName: timingInfo.operationName });
        numOfGraphQLResponsesReceived.add(1);
        // console.log(`Operation ${timingInfo.operationName} took ${duration}ms`);
      }
      this.timings.delete(parsedMessage.id);
    }
  }
}

// This defines the behaviour of 1 virtual user.
export default function runVirtualUser() {
  const token =
    BEARER_TOKENS[exec.scenario.iterationInTest % BEARER_TOKENS.length];
  const state = new VirtualUserState(token);
  const params = {
    headers: {
      Version: 'test_version',
      Authorization: token,
      'Sec-WebSocket-Protocol': 'graphql-ws',
    },
  };

  const res = ws.connect(ENDPOINT, params, function (socket) {
    socket.on('open', () => state.sendNextMessageAndThenTheRest(socket));
    socket.on('message', (message) => state.onMessage(message));
    // socket.on('close', () => console.log(`Virtual user ${__VU} disconnected`));
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
