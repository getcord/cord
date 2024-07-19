import { hostname, userInfo } from 'os';
import { serializeError } from 'serialize-error';
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import Transport from 'winston-transport';
import * as Sentry from '@sentry/node';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import '@sentry/tracing';

import env from 'server/src/config/Env.ts';
import { flatFormat } from 'server/src/logging/flatFormat.ts';
import packageData from 'package.json';
import { Counter } from 'server/src/logging/prometheus.ts';
import type { JsonObject } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { CordError } from 'server/src/util/CordError.ts';

// Our build process replaces `BUILDCONSTANTS.loggingProcessName` with an
// appropriate string (e.g. 'server' or 'asyncWorker') and
// `BUILDCONSTANTS.sentryDSN` with either `undefined` or a string value for a
// Sentry DSN
declare const BUILDCONSTANTS: {
  loggingProcessName: string;
  sentryDSN: undefined | string;
};

// The loglevel for the console output can be specified using the environment
// variable `LOGLEVEL`
const logLevel = env.LOGLEVEL;

const defaultMeta: any = {
  process: BUILDCONSTANTS.loggingProcessName,
  serverVersion: packageData.version,
  serverGitCommit: process.env.COMMIT_HASH || process.env.npm_package_gitHead,
  serverHost: hostname(),
};

if (process.env.CORD_WORKER_NAME) {
  defaultMeta.workerName = process.env.CORD_WORKER_NAME;
}

// Sentry logging
const sentryLogging = !!(BUILDCONSTANTS.sentryDSN && env.SENTRY_ENVIRONMENT);
if (sentryLogging) {
  Sentry.init({
    dsn: BUILDCONSTANTS.sentryDSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: parseFloat(env.SENTRY_TRACE_SAMPLE_RATE ?? '0'),
    attachStacktrace: true,
    normalizeDepth: 10,
  });
}

// Winston logging
const winstonLogger = winston.createLogger({ defaultMeta });

const format =
  process.env.LOG_FORMAT === 'json' ? winston.format.json() : flatFormat();

winstonLogger.add(
  new winston.transports.Console({
    level: logLevel,
    format: winston.format.combine(winston.format.timestamp(), format),
    handleExceptions: true,
  }),
);

// Keep track of logging in a Prometheus metric. The cleanest way to do this is
// by adding a separate transport, because that allows us to set the loglevel
// for this independently. No matter what `env.LOGLEVEL` is set to, the
// Prometheus metric keeps track of *all* log messages, even the 'silly' ones.
// ('silly' is the name of the lowest loglevel in Prometheus.)
const counter = Counter({
  name: 'ServerLogging',
  help: 'Number of log messages emitted by server',
  labelNames: ['level'],
});

const LEVEL = Symbol.for('level');
class MetricLogger extends Transport {
  log(info: any, next: () => void) {
    counter.inc({ level: info[LEVEL] });
    next();
  }
}

export type LoggingTags = { [tag: string]: number | string | boolean };

winstonLogger.add(new MetricLogger({ level: 'silly' }));

// CloudWatch logging is configured via the environment
let winstonCW: WinstonCloudWatch | undefined = undefined;
if (env.CLOUDWATCH_LOGLEVEL && !process.env.IS_TEST) {
  if (!env.CLOUDWATCH_LOG_GROUP_NAME) {
    throw new Error(
      `CloudWatch logging is enabled (CLOUDWATCH_LOGLEVEL is set), so
       CLOUDWATCH_LOG_GROUP_NAME must be provided, too!`,
    );
  }

  // CloudWatch stream names must not contain ':' or '*' characters
  const defaultStreamName = () =>
    `${new Date().toISOString().replace(/:/g, '.')} ${
      userInfo().username
    } ${hostname()}(${process.pid})`;

  winstonCW = new WinstonCloudWatch({
    // "name" is optional with default value "CloudWatch" but the
    // typedefinition has name as required. See
    // https://githubmemory.com/repo/lazywithclass/winston-cloudwatch/issues/155
    name: 'CloudWatch',
    level: env.CLOUDWATCH_LOGLEVEL,
    logGroupName: env.CLOUDWATCH_LOG_GROUP_NAME,
    logStreamName: env.CLOUDWATCH_LOG_STREAM_NAME || defaultStreamName(),
    awsRegion: env.CLOUDWATCH_AWS_REGION,
    jsonMessage: true,
  });
  winstonLogger.add(winstonCW);
} else {
  if (env.CLOUDWATCH_LOG_GROUP_NAME || env.CLOUDWATCH_LOG_STREAM_NAME) {
    throw new Error(
      `Some CLOUDWATCH_* variables are set, but CLOUDWATCH_LOGLEVEL is not.`,
    );
  }
}

export function flushAndCloseWinstonCloudWatch() {
  if (winstonCW) {
    return new Promise<void>((resolve, _reject) => {
      winstonCW!.kthxbye((_err) => resolve());
    });
  } else {
    return undefined;
  }
}

const SENTRY_LOG_LEVEL: Record<string, Sentry.SeverityLevel | undefined> = {
  error: 'error',
  warn: 'warning',
};

const cleanupSequelizeError = (error: any) => {
  // remove references to the instance object as they contain deep SQL information
  // like db password, etc
  const suberrors = error.errors;
  if (Array.isArray(suberrors)) {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    suberrors.forEach((error) => delete error.instance);
  }
};

const MAX_ORG_IDS_TO_LOG = 50;

export class Logger {
  private readonly truncatedViewer: Record<string, unknown>;
  private readonly metadata: JsonObject;
  private appName: string | undefined;

  constructor(viewer: Viewer, additionalMeta?: JsonObject) {
    this.truncatedViewer = { ...viewer };
    this.metadata = { ...defaultMeta, ...additionalMeta };

    if (
      viewer.relevantOrgIDs &&
      viewer.relevantOrgIDs.length > MAX_ORG_IDS_TO_LOG
    ) {
      this.truncatedViewer.relevantOrgIDs = [
        ...viewer.relevantOrgIDs.slice(0, MAX_ORG_IDS_TO_LOG),
        `(truncated from ${viewer.relevantOrgIDs.length} orgs)`,
      ];
    }

    void this.addAppName(viewer);
  }

  public childLogger(viewer: Viewer, additionalMeta?: JsonObject) {
    return new Logger(viewer, { ...this.metadata, ...additionalMeta });
  }

  private viewerToLog() {
    return {
      ...this.truncatedViewer,
      ...(this.appName && { appName: this.appName }),
    };
  }

  public log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: JsonObject,
    options?: { sentryFingerPrint?: string[] },
  ) {
    if (sentryLogging && !process.env.IS_TEST) {
      const sentryLevel = SENTRY_LOG_LEVEL[level];
      if (sentryLevel) {
        const sentryEventID = Sentry.captureMessage(message, {
          level: sentryLevel,
          extra: { ...defaultMeta, ...meta },
          tags: { loggingProcessName: BUILDCONSTANTS.loggingProcessName },
          fingerprint: options?.sentryFingerPrint,
          user: this.viewerToLog(),
        });
        meta = { ...this.metadata, ...meta, sentryEventID };
      }
    }

    winstonLogger.log(level, message, {
      viewer: this.viewerToLog(),
      ...this.metadata,
      ...meta,
    });
  }

  public debug(
    message: string,
    meta?: JsonObject,
    options?: { sentryFingerPrint?: string[] },
  ) {
    this.log('debug', message, meta, options);
  }

  public info(
    message: string,
    meta?: JsonObject,
    options?: { sentryFingerPrint?: string[] },
  ) {
    this.log('info', message, meta, options);
  }

  public warn(
    message: string,
    meta?: JsonObject,
    options?: { sentryFingerPrint?: string[] },
  ) {
    this.log('warn', message, meta, options);
  }

  public error(
    message: string,
    meta?: JsonObject,
    options?: { sentryFingerPrint?: string[] },
  ) {
    this.log('error', message, meta, options);
  }

  public logLoggerInfo() {
    this.info(
      `Logging through winston. Console log level set to "${logLevel}", CloudWatch logging is ${
        env.CLOUDWATCH_LOGLEVEL === undefined
          ? 'disabled'
          : `set to "${env.CLOUDWATCH_LOGLEVEL}"`
      }`,
    );
  }

  /**
  Useful when dealing with promises:

  ```
  promise.catch(exceptionLogger('something broke'))
  ```
*/
  public exceptionLogger =
    (message: string, meta?: JsonObject, tags?: LoggingTags) => (error: any) =>
      this.logException(
        message,
        error,
        { ...this.metadata, ...meta },
        tags,
        'error',
      );

  /**
  To be used imperatively:

  ```
  try {
    // ...
  } catch (e) {
    logException('something broke', e)
  }
  ```
*/
  public logException(
    message: string,
    error: any,
    meta?: JsonObject,
    tags?: LoggingTags,
    level: 'debug' | 'info' | 'warn' | 'error' = 'error',
  ) {
    // Make a good effort to produce a nice error log message from the given
    // `message`, `error` (and optionally `meta`), but make sure that those
    // efforts don't sabotage the logging, i.e. if something throws on the way,
    // catch the error and make sure _something_ gets logged.
    if (error.name?.startsWith('Sequelize')) {
      cleanupSequelizeError(error);
    }

    let serializedError: any = undefined;
    try {
      serializedError = serializeError(error, { maxDepth: 50 });
    } catch (e) {
      winstonLogger.log(
        level,
        `logException: serializeError threw an exception (${message})`,
        {
          error: `${error}`,
          viewer: this.viewerToLog(),
          ...this.metadata,
          ...meta,
        },
      );
    }

    if (serializedError !== undefined) {
      // If serializing the error above failed, we have already logged a simple
      // error representation to Winston above.
      if (!message) {
        try {
          message = `${serializedError.name}: ${serializedError.message}`;
        } catch (e) {
          message = `${serializedError}`;
        }
      }

      winstonLogger.log(level, message, {
        error: serializedError,
        viewer: this.viewerToLog(),
        ...this.metadata,
        ...meta,
      });
    }

    if ((level === 'warn' || level === 'error') && !process.env.IS_TEST) {
      Sentry.withScope((scope) => {
        scope.setTags({
          ...(error instanceof CordError && error.loggingTags),
          ...tags,
        });
        // serializedError is undefined, if serializing failed
        if (serializedError && error instanceof CordError) {
          // Remove these properties, they'll get attached under other names
          delete serializedError.loggingMetadata;
          delete serializedError.loggingTags;
        }
        scope.setExtra('error', serializedError);

        scope.setExtra('message', message);
        scope.setExtra('meta', {
          ...this.metadata,
          ...(error instanceof CordError && error.loggingMetadata),
          ...meta,
        });
        scope.setExtra('user', this.viewerToLog());

        // We hand the original error object to Sentry
        Sentry.captureException(error, {
          level: SENTRY_LOG_LEVEL[level],
        });
      });
    }
  }

  private async addAppName(viewer: Viewer) {
    if (!viewer?.platformApplicationID) {
      return;
    }

    const app = await ApplicationEntity.findByPk(viewer.platformApplicationID);
    this.appName = app?.name;
  }
}

let _anonymousLogger: Logger | undefined = undefined;
export function anonymousLogger() {
  if (_anonymousLogger === undefined) {
    _anonymousLogger = new Logger(Viewer.createAnonymousViewer());
  }
  return _anonymousLogger;
}
