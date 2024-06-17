import { format } from 'winston';
import stringify from 'fast-json-stable-stringify';

const MESSAGE = Symbol.for('message');

// This defines our custom log format for logging to the console.
// It looks like `<LOGLEVEL> <TIMESTAMP>: <MESSAGE>[ <META>]`
// where LOGLEVEL is a single capital letter (`EWIHVDS` for error, warn,
// info, http, verbose, debug, silly) and META is a JSON object with
// additional fields, such as `process` (`server`), `version` (taken from
// package.json) etc.

export const flatFormat = format((info) => {
  const { level, timestamp, message, splat: _, ...meta } = info;

  let stringifiedMeta: string;
  try {
    stringifiedMeta = stringify(meta);
  } catch (err) {
    stringifiedMeta = `! stringify exception: ${err}`;
  }

  const formattedMessage = `${level
    .substr(0, 1)
    .toUpperCase()} ${timestamp}: ${message} ${stringifiedMeta}`;

  (info as any)[MESSAGE] = formattedMessage;
  return info;
});
