export function loadWebsocketMessages(fileContents) {
  const harJson = JSON.parse(fileContents);
  if (harJson['log']['entries'].length !== 1) {
    throw `Expected length of entries in har file to be 1, got: ${harJson['log']['entries'].length}.  This usually means that there was an error during the traffic trace that was reported to Sentry or something similar.`;
  }
  let messages = harJson['log']['entries'][0]['_webSocketMessages']
    .filter((msg) => msg.type === 'send')
    .map((msg) => {
      const dataParsed = JSON.parse(msg.data);
      return {
        type: msg.type,
        time: msg.time,
        opcode: msg.opcode,
        dataParsed,
        isSubscription:
          dataParsed.type === 'start' && msg.data.includes('subscription '), // hacky but seems to work
      };
    });
  const timeZero = messages[0].time;
  messages.forEach((m) => (m.time -= timeZero));
  messages = filterMessages(messages);

  checkMessages(messages);

  // Uncomment to get some insights about messages
  // printStatsAboutMessages(messages);
  // printGaps(messages);

  return messages;
}

export function rewriteConnectionInit(messages, bearerToken, version) {
  // manually overwrite the payload of the "connection_init"
  messages[0].dataParsed['payload']['Authorization'] = bearerToken;
  messages[0].dataParsed['payload']['Version'] = version;

  return messages;
}

export function prepareWebsocketMessages(messages, bearerToken, version) {
  checkMessages(messages);

  rewriteConnectionInit(messages, bearerToken, version);

  // Fill out the data field, which was dropped above
  messages.forEach((m) => (m.data = JSON.stringify(m.dataParsed)));

  return messages;
}

// This is stolen from common/util/index.ts
function domainFromURL(url) {
  try {
    const { host } = new URL(url);
    return host.startsWith('www.') ? host.substr(4) : host;
  } catch (_e) {
    return url;
  }
}

export function prepareMessage(
  msg,
  urlsToReplace,
  replacementUrl,
  pageContextHash,
) {
  if (!urlsToReplace || !urlsToReplace.length) {
    return msg;
  }

  const dataParsed = JSON.parse(msg.data);
  if (dataParsed.payload && dataParsed.payload.variables) {
    if (
      dataParsed.payload.variables.pageContext &&
      dataParsed.payload.variables.pageContext.location &&
      urlsToReplace.includes(dataParsed.payload.variables.pageContext.location)
    ) {
      dataParsed.payload.variables.pageContext.location = replacementUrl;
    }
    if (
      dataParsed.payload.variables.domain &&
      urlsToReplace.includes(dataParsed.payload.variables.domain)
    ) {
      dataParsed.payload.variables.domain = domainFromURL(replacementUrl);
    }
    if (pageContextHash && dataParsed.payload.variables.pageContextHash) {
      dataParsed.payload.variables.pageContextHash = pageContextHash;
    }
  }

  // This is equivalent to the following, but as of Oct 2021 k6 uses a JS engine
  // that doesn't support the object spread operator.
  // return {
  //   ...msg,
  //   dataParsed: dataParsed,
  //   data: JSON.stringify(dataParsed),
  // };
  const newMessage = Object.assign({}, msg);
  newMessage.dataParsed = dataParsed;
  newMessage.data = JSON.stringify(dataParsed);
  return newMessage;
}

// filters out messages for operations that we don't want to load test
function filterMessages(messages) {
  const excludedOperations = new Set(['CanEditExternalTaskQuery']);
  // Each ID identifies an operation that might involve multiple messages, so
  // collect the IDs for operations we want to filter out and then remove all
  // messages for those IDs.
  const badIds = new Set();
  for (const message of messages) {
    if (
      'payload' in message.dataParsed &&
      excludedOperations.has(message.dataParsed.payload.operationName)
    ) {
      badIds.add(message.dataParsed.id);
    }
  }
  return messages.filter((message) => !badIds.has(message.dataParsed.id));
}

function checkMessages(messages) {
  // some basic sanity checks
  if (messages[0].dataParsed.type !== 'connection_init') {
    throw `First message should be 'type: connection_init', got ${JSON.stringify(
      messages[0],
    )}`;
  }
  let prevMessage = undefined;
  let connectionInitCount = 0;
  for (const msg of messages) {
    if (prevMessage && msg.time < prevMessage.time) {
      throw `Message timestamps are not in order`;
    }
    prevMessage = msg;
    if (msg.dataParsed.type === 'connection_init') {
      connectionInitCount += 1;
      continue;
    }

    if (!msg.dataParsed.id) {
      throw `Missing message.dataParsed.id: ${JSON.stringify(msg)}`;
    }
    if (msg.dataParsed.type === 'stop') {
      continue;
    }

    if (msg.dataParsed.type !== 'start') {
      throw `Bad message.dataParsed.type, expecting "start": ${JSON.stringify(
        msg,
      )}`;
    }
    if (!msg.dataParsed.payload) {
      throw `Missing message.dataParsed.payload: ${JSON.stringify(msg)}`;
    }
    if (!msg.dataParsed.payload.operationName) {
      throw `Missing message.dataParsed.payload.operationName: ${JSON.stringify(
        msg,
      )}`;
    }
  }

  if (connectionInitCount !== 1) {
    throw `Expecting exactly 1 message to be of type connectionInitCount, got ${connectionInitCount}`;
  }
}

export function printStatsAboutMessages(messages) {
  const types = messages.map((msg) =>
    'payload' in msg.dataParsed && 'operationName' in msg.dataParsed.payload
      ? `${msg.type}-${msg.dataParsed.type}-${msg.dataParsed.payload.operationName}`
      : `${msg.type}-${msg.dataParsed.type}`,
  );
  const counts = new Map();
  types.forEach((t) => counts.set(t, (counts.has(t) ? counts.get(t) : 0) + 1));
  console.log(
    'counts per message type\n' +
      [...counts]
        .sort()
        .map(([id, count]) => `${id}: ${count}`)
        .join('\n'),
  );
}

export function printGaps(messages) {
  let prevTime = messages[0].time;
  for (let i = 1; i < messages.length; ++i) {
    console.log(messages[i].time - prevTime);
    prevTime = messages[i].time;
  }
}
