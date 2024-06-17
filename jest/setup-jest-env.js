import { jest } from '@jest/globals';
import { v4 as uuid } from 'uuid';
import ioredisMock from 'ioredis-mock';
import 'dotenv/config.js';

ioredisMock.default = ioredisMock;

jest.mock('ioredis', () => ioredisMock);
jest.setTimeout(10000);

process.env.POSTGRES_DB = `temp-${uuid()}`;
process.env.IS_TEST = true;
process.env.LOGLEVEL = 'error'; // prevent log spew -- can change when debugging!
process.env.SENTRY_ENVIRONMENT = ''; // prevent logging to Sentry
process.env.CLOUDWATCH_LOGLEVEL = ''; // prevent logging to cloudwatch
process.env.CLOUDWATCH_LOG_GROUP_NAME = '';
process.env.CLOUDWATCH_LOG_STREAM_NAME = '';
process.env.S3_ACCESS_KEY_ID = 'test-key';
process.env.S3_ACCESS_KEY_SECRET = 'test-secret';
