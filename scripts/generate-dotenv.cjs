#!/usr/bin/env node

// This script generates the .env file for you.  It should be passed a --tier
// option to supply the name of the tier to create the environment for; without
// a specific tier, it will create or update your .env file for local
// development. You can also define the location of the .env file with the
// `--envFile` option. It defaults to .env in the current working directory.

const fs = require('fs').promises;
const child_process = require('child_process');
const dotenv = require('dotenv');
const yargs = require('yargs');

const { version: packageVersion } = require('../package.json');

const { replaceSecretsInObject } = require('./lib/secrets.cjs');

const POSTGRESQL_PORT = 5432;

// The names/ids of the secrets we keep in AWS. The keys in the secretIDs
// object is how we reference them below, the value is the AWS secret id.
const secretIDs = {
  SLACK: 'slack_api',
  STAGING_SLACK: 'slack_api_staging',
  SLACK_INTERNAL: 'slack_api_internal',
  SESSION: 'session_encryption',
  DATABASE: 'database-prod-1',
  DATABASE_LOADTEST: 'database-loadtest-1',
  JIRA: 'jira_api',
  ASANA: 'asana_api',
  OAUTH_FLOW: 'oauth_flow',
  SLACK_OAUTH_FLOW: 'SlackOauthStateSigningSecretKey',
  LINEAR: 'linear_api',
  TRELLO: 'trello_api',
  MONDAY: 'monday_api',
  SENDGRID: 'sendgrid',
  SENDGRID_INBOUND_WEBHOOK: 'SendgridInboundWebhookSecretKey',
  PLATFORM_SECRETS: 'platform_secrets_encryption_key',
  FILE_PROXY_SIGNING_SECRET: 'file_proxy_signing_secret',
  EMAIL_LINKS_TOKEN: 'email_links_token_secret',
  SLACK_ADMIN_LOGIN: 'slack_admin_login_app',
  LAUNCHDARKLY: 'launchdarkly_api',
  DEV_CONSOLE_CORD_APP: 'dev_console_cord_app',
  ADMIN_TOKEN: 'admin-token-secret',
  DOCS_COOKIE_PARSER: 'docs-cookie-parser-secret',
  OPENAI_API_SECRET: 'openai_api_secret',
  IPSTACK_API_SECRET: 'ipstack_api_secret',
  CORD_UPDATES_APP_BOT_TOKEN: 'cord_updates_slack_app_bot_token',
  AUTH0_WEBHOOK_SECRET: 'auth0-webhook-secret',
  AUTH0_MTM_CLIENT_SECRET: 'auth0_mtm_client_secret',
  GA_MEASUREMENT_PROTOCOL_API: 'ga_measurement_protocol_api',
  STRIPE_SECRET_KEY: 'stripe_secret_key',
  DEMO_APPS_SHARED_SECRET: 'demo_apps_shared_secret',
  LOOPS_SO_API_KEY: 'loops_so_api_key',
};

// Construct a `secrets` object, that has a property for each defined secret
// above, which contains a magic object that yields a magic string for any
// property.
// Say if there is a secretID defined above like `FOO: 'foo-secret'`, then
// `secrets.FOO.fieldName` will be the string '!!SECRET!foo-secret!fieldName!'.
const secrets = Object.fromEntries(
  Object.entries(secretIDs).map(([key, secretName]) => [
    key,
    new Proxy(
      {},
      {
        get(_, prop) {
          return `!!SECRET!${secretName}!${prop}!`;
        },
      },
    ),
  ]),
);

const unixUserName = process.env.USER || 'user';

// This function builds the new .env for production file.
function buildProdEnv(commitHash) {
  return {
    NODE_ENV: 'production',
    COMMIT_HASH: commitHash,

    API_SERVER_PORT: '8161', // Prime time!
    ADMIN_SERVER_PORT: '8123', // Prime time!
    METRICS_SERVER_PORT: '8111', // Prime time!
    STATUS_SERVER_PORT: '8101', // Prime time!
    CONSOLE_SERVER_PORT: '8171', // Prime time!
    DOCS_SERVER_PORT: '8191', // Prime time!

    POSTGRES_HOST: secrets.DATABASE.host,
    POSTGRES_PORT: secrets.DATABASE.port,
    POSTGRES_USER: secrets.DATABASE.username,
    POSTGRES_PASSWORD: secrets.DATABASE.password,
    POSTGRES_DB: 'radical_db',

    POSTGRES_READ_HOST: 'database-prod-read.int.cord.com',
    POSTGRES_READ_PORT: POSTGRESQL_PORT,

    REDIS_HOST: 'prod-redis.int.cord.com',
    REDIS_PORT: 6379,

    PREDIS_HOST: 'prod-redis-presence.int.cord.com',
    PREDIS_PORT: 6380,

    // LOGLEVEL: this is for logging to the terminal window. In production,
    // this is what you get from running `docker logs server` on the EC2 VM.
    // The default value has been 'info', which makes the docker logs in prod
    // not super crowded. More detailed logs (with loglevel 'debug') are still
    // sent to CloudWatch and can be inspected there.  For development, it's
    // more useful to set the console log level to 'debug', as you probably
    // want to be able to inspect full output in your terminal window straight
    // away, without going to CloudWatch.
    LOGLEVEL: 'debug',

    // URLs pointing to our own endpoints
    TOP_SERVER_HOST: 'cord.com',
    APP_SERVER_HOST: 'app.cord.com',
    API_SERVER_HOST: 'api.cord.com',
    API_SERVER_HOST_PRODUCTION: 'api.cord.com',
    ADMIN_SERVER_HOST: 'admin.cord.com',
    MARKETING_SERVER_HOST: 'cord.com',
    PUBLIC_UPLOADS_HOST: 'cdn.cord.com',
    CONSOLE_SERVER_HOST: 'console.cord.com',
    CORD_TO_HOST: 'cord.to',
    DOCS_SERVER_HOST: 'docs.cord.com',
    CLACK_SERVER_HOST: 'clack.cord.com',
    COMMUNITY_SERVER_HOST: 'community.cord.com',

    // Slack channel to post ops messages to
    CORD_OPS_SLACK_CHANNEL_ID: 'C0156HZ0YLU',
    CORD_SECURITY_SLACK_CHANNEL_ID: undefined,
    PROD_CHANGES_SLACK_CHANNEL_ID: 'C03LL11DDHS',
    CORD_GO_REDIRECTS_SLACK_CHANNEL_ID: 'C04CJSLJ83B',
    CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID: 'C04J4DA5H0U',
    CORD_CLIENT_REQUESTS_SLACK_CHANNEL_ID: 'C0200BB1PKM',
    CORD_DOCS_SEARCH_SLACK_CHANNEL_ID: 'C053KJ2LNAG',

    // Various secrets and configs. Add new ones here, too!
    SLACK_APP_CLIENT_SECRET: secrets.SLACK.client_secret,
    SLACK_DEV_APP_CLIENT_SECRET: secrets.STAGING_SLACK.client_secret,
    SLACK_SIGNING_SECRET: secrets.SLACK.signing_secret,

    SLACK_ADMIN_CLIENT_SECRET: secrets.SLACK_ADMIN_LOGIN.client_secret,
    SLACK_ADMIN_SIGNING_SECRET: secrets.SLACK_ADMIN_LOGIN.signing_secret,

    SLACK_INTERNAL_BOT_TOKEN: secrets.SLACK_INTERNAL.bot_token,
    SLACK_INTERNAL_SIGNING_SECRET: secrets.SLACK_INTERNAL.signing_secret,

    SLACK_CUSTOMER_UPDATES_BOT_TOKEN:
      secrets.CORD_UPDATES_APP_BOT_TOKEN.bot_token,

    EMAIL_LINKS_TOKEN_SECRET: secrets.EMAIL_LINKS_TOKEN.secret,
    JWT_SIGNING_SECRET: secrets.SESSION.jwt_signing_secret,
    S3_REGION: 'eu-west-2',
    S3_BUCKET: 'radical-stack-fileuploads-wumx9efffh4z',
    S3_PUBLIC_BUCKET: 'cord-public-uploads',
    S3_ENDPOINT: 'https://s3.<REGION>.amazonaws.com',
    S3_USE_PATH_BASED_URLS: false,
    CLOUDWATCH_LOGLEVEL: 'debug',
    CLOUDWATCH_LOG_GROUP_NAME: `server.prod`,
    JIRA_APP_CLIENT_ID: 'ru3r9M5LTNqoD1dZ3SjjR8THOpSHcCqH',
    JIRA_APP_CLIENT_SECRET: secrets.JIRA.client_secret,
    ASANA_APP_CLIENT_ID: '1199954941915748',
    ASANA_APP_CLIENT_SECRET: secrets.ASANA.client_secret,
    OAUTH_STATE_SIGNING_SECRET: secrets.OAUTH_FLOW.signing_secret,
    SLACK_OAUTH_STATE_SIGNING_SECRET: secrets.SLACK_OAUTH_FLOW.signing_secret,
    LINEAR_APP_CLIENT_ID: 'e4718b94c5896e96d0e900fa27782dc7',
    LINEAR_APP_CLIENT_SECRET: secrets.LINEAR.client_secret,
    TRELLO_APP_CLIENT_ID: '1325d966c87781e342493f5bbc0cba01',
    TRELLO_APP_CLIENT_SECRET: secrets.TRELLO.client_secret,
    MONDAY_APP_CLIENT_ID: '1002b8dbfa870a2c44923d2b02bf2da8',
    MONDAY_APP_CLIENT_SECRET: secrets.MONDAY.client_secret,
    TZ: 'Europe/London',
    ADMIN_SERVER_STATIC_PATH: 'dist/prod/server/admin',
    CONSOLE_SERVER_STATIC_PATH: 'dist/prod/server/console',
    DOCS_SERVER_STATIC_PATH: 'dist/prod/docs/static',
    SENDGRID_API_KEY: secrets.SENDGRID.key,
    SENDGRID_INBOUND_WEBHOOK_USER: 'cord',
    SENDGRID_INBOUND_WEBHOOK_PASSWORD:
      secrets.SENDGRID_INBOUND_WEBHOOK.webhook_secret,
    LAUNCHDARKLY_API_KEY: secrets.LAUNCHDARKLY.prod,
    NUM_WORKERS: 'auto',
    PLATFORM_SECRETS_ENCRYPTION_KEY: secrets.PLATFORM_SECRETS.encryption_key,
    FILE_PROXY_SIGNING_SECRET_KEY: secrets.FILE_PROXY_SIGNING_SECRET.key,
    SENTRY_ENVIRONMENT: 'prod',
    SENTRY_RELEASE: `${packageVersion}+git${commitHash}`,
    SENTRY_TRACE_SAMPLE_RATE: 0.01,
    AUTH0_CLIENT_ID: 'NX6dC4f4sOTWh8Z30TEB11NZOkjZRpFt',
    AUTH0_CUSTOM_LOGIN_DOMAIN: 'auth.console.cord.com',
    AUTH0_GENERAL_DOMAIN: 'dev-e20axg57.eu.auth0.com',
    AUTH0_MTM_CLIENT_ID: 'jSsaP55wyYGaEZJmwUsa9JlLymD1xxS8',
    AUTH0_MTM_CLIENT_SECRET: secrets.AUTH0_MTM_CLIENT_SECRET.secret,
    DEV_CONSOLE_CORD_APP_SECRET: secrets.DEV_CONSOLE_CORD_APP.secret,
    ADMIN_TOKEN_SECRET: secrets.ADMIN_TOKEN.secret,
    DOCS_COOKIE_PARSER_SECRET: secrets.DOCS_COOKIE_PARSER.secret,
    OPENAI_API_SECRET: secrets.OPENAI_API_SECRET.api_key,
    IPSTACK_API_SECRET: secrets.IPSTACK_API_SECRET.api_key,
    DOCS_AI_CHATBOT_SERVER_HOST: 'https://api.ai-chat-bots-with-cord.com',
    AUTH0_WEBHOOK_SECRET: secrets.AUTH0_WEBHOOK_SECRET.secret,
    GA_MEASUREMENT_PROTOCOL_API_SECRET:
      secrets.GA_MEASUREMENT_PROTOCOL_API.secret,
    GA_MEASUREMENT_ID: secrets.GA_MEASUREMENT_PROTOCOL_API.id,
    STRIPE_SECRET_KEY: secrets.STRIPE_SECRET_KEY.prod_key,
    STRIPE_WEBHOOK_SECRET_KEY: secrets.STRIPE_SECRET_KEY.webhook_prod_key,
    DEMO_APPS_SHARED_SECRET: secrets.DEMO_APPS_SHARED_SECRET.key,
    LOOPS_SO_API_KEY: secrets.LOOPS_SO_API_KEY.api_key,
    PYROSCOPE_ENDPOINT: 'http://monitoring.int.cord.com:4040',
  };
}

function buildStagingEnv(commitHash) {
  return {
    ...buildProdEnv(commitHash),

    // URLs pointing to our own endpoints
    APP_SERVER_HOST: 'app.staging.cord.com',
    API_SERVER_HOST: 'api.staging.cord.com',
    ADMIN_SERVER_HOST: 'admin.staging.cord.com',
    CONSOLE_SERVER_HOST: 'console.staging.cord.com',
    DOCS_SERVER_HOST: 'docs.staging.cord.com',
    COMMUNITY_SERVER_HOST: 'community.cord.com',

    CORD_OPS_SLACK_CHANNEL_ID: 'C02670K69M0',
    CORD_SECURITY_SLACK_CHANNEL_ID: 'C02NLQ0GQER',
    PROD_CHANGES_SLACK_CHANNEL_ID: 'C058GJZSA8M',

    SLACK_SIGNING_SECRET: secrets.STAGING_SLACK.signing_secret,

    JWT_SIGNING_SECRET: `${secrets.SESSION.jwt_signing_secret}-staging`,
    CLOUDWATCH_LOG_GROUP_NAME: `server.staging`,
    ADMIN_SERVER_STATIC_PATH: 'dist/staging/server/admin',
    CONSOLE_SERVER_STATIC_PATH: 'dist/staging/server/console',
    DOCS_SERVER_STATIC_PATH: 'dist/staging/docs/static',
    LAUNCHDARKLY_API_KEY: secrets.LAUNCHDARKLY.staging,
    FILE_PROXY_SIGNING_SECRET_KEY: '12345678901234567890123456789012',
    SENTRY_ENVIRONMENT: 'staging',
    SENTRY_TRACE_SAMPLE_RATE: 0.02,
    STRIPE_SECRET_KEY: secrets.STRIPE_SECRET_KEY.test_key,
    STRIPE_WEBHOOK_SECRET_KEY: secrets.STRIPE_SECRET_KEY.webhook_test_key,
  };
}

function buildLoadtestEnv(commitHash) {
  return {
    ...buildStagingEnv(commitHash),

    // URLs pointing to our own endpoints
    APP_SERVER_HOST: 'app.loadtest.cord.com',
    API_SERVER_HOST: 'api.loadtest.cord.com',
    ADMIN_SERVER_HOST: 'admin.loadtest.cord.com',
    CONSOLE_SERVER_HOST: 'console.loadtest.cord.com',
    SLACK_APP_REDIRECT_HOST: 'api.staging.cord.com',

    POSTGRES_HOST: secrets.DATABASE_LOADTEST.host,
    POSTGRES_PORT: secrets.DATABASE_LOADTEST.port,
    POSTGRES_USER: secrets.DATABASE_LOADTEST.username,
    POSTGRES_PASSWORD: secrets.DATABASE_LOADTEST.password,
    POSTGRES_DB: 'radical_db',

    POSTGRES_READ_HOST: undefined,
    POSTGRES_READ_PORT: undefined,

    REDIS_HOST: 'loadtest-redis.int.cord.com',
    REDIS_PORT: 6379,

    PREDIS_HOST: 'loadtest-redis-presence.int.cord.com',
    PREDIS_PORT: 6380,

    CORD_OPS_SLACK_CHANNEL_ID: 'C02F9V1PV6W',
    CORD_SECURITY_SLACK_CHANNEL_ID: undefined,
    CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID: undefined,
    CORD_CLIENT_REQUESTS_SLACK_CHANNEL_ID: undefined,
    CORD_DOCS_SEARCH_SLACK_CHANNEL_ID: undefined,

    CLOUDWATCH_LOG_GROUP_NAME: `server.loadtest`,
    ADMIN_SERVER_STATIC_PATH: 'dist/loadtest/server/admin',
    CONSOLE_SERVER_STATIC_PATH: 'dist/loadtest/server/console',
    DOCS_SERVER_STATIC_PATH: 'dist/loadtest/docs/static',
    SENTRY_ENVIRONMENT: undefined,

    STRIPE_SECRET_KEY: secrets.STRIPE_SECRET_KEY.test_key,
    STRIPE_WEBHOOK_SECRET_KEY: secrets.STRIPE_SECRET_KEY.webhook_test_key,
    PYROSCOPE_ENDPOINT: undefined,
  };
}

function buildDevEnv(commitHash) {
  const prod = buildProdEnv(commitHash);
  return {
    ...prod,
    NODE_ENV: 'development',

    // NOTE(flooey): This needs to be 127.0.0.1 instead of localhost because
    // Node 18 resolves localhost to an IPv6 address, and our Docker host
    // doesn't listen on IPv6.  This is supposed to be fixed in Node 20.
    POSTGRES_HOST: '127.0.0.1',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: unixUserName,
    POSTGRES_PASSWORD: 'r4dicalAF',

    POSTGRES_READ_HOST: undefined,
    POSTGRES_READ_PORT: undefined,

    REDIS_HOST: '127.0.0.1',
    PREDIS_HOST: '127.0.0.1',
    // Use one Redis instance in dev, not two
    PREDIS_PORT: 6379,

    // Debug is very noisy, so default local dev to info
    LOGLEVEL: 'info',

    // URLs pointing to our own endpoints
    TOP_SERVER_HOST: 'local.cord.com',
    APP_SERVER_HOST: 'local.cord.com:8179',
    API_SERVER_HOST: 'local.cord.com:8161',
    ADMIN_SERVER_HOST: 'local.cord.com:8123',
    CONSOLE_SERVER_HOST: 'local.cord.com:8171',
    MARKETING_SERVER_HOST: 'local.cord.com:8117',
    CORD_TO_HOST: 'local.cord.com:8161',
    PUBLIC_UPLOADS_HOST: 'local.cord.com:8147',
    DOCS_SERVER_HOST: 'local.cord.com:8191',
    SLACK_ADMIN_LOGIN_REDIRECT_HOST: 'admin.staging.cord.com',
    SLACK_APP_REDIRECT_HOST: 'api.staging.cord.com',
    DOCS_AI_CHATBOT_SERVER_HOST: 'http://localhost:8209',
    CLACK_SERVER_HOST: 'local.cord.com:3000',
    COMMUNITY_SERVER_HOST: 'local.cord.com:3000',

    CORD_OPS_SLACK_CHANNEL_ID: undefined,
    PROD_CHANGES_SLACK_CHANNEL_ID: undefined,
    CORD_SECURITY_SLACK_CHANNEL_ID: undefined,
    CORD_GO_REDIRECTS_SLACK_CHANNEL_ID: undefined,
    CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID: undefined,
    CORD_CLIENT_REQUESTS_SLACK_CHANNEL_ID: undefined,
    CORD_DOCS_SEARCH_SLACK_CHANNEL_ID: 'C0546PL7Y2C', // #docs-search-noise

    SLACK_OAUTH_STATE_SIGNING_SECRET: 'Rolo is the worlds best sausage!',
    EMAIL_LINKS_TOKEN_SECRET: 'Super Secret Secret Squirrel',
    JWT_SIGNING_SECRET: 'SpongeBob_signs_your_jwt',
    S3_ENDPOINT: 'https://local.cord.com:8147',
    S3_USE_PATH_BASED_URLS: true,
    S3_ACCESS_KEY_ID: 's3_access_key',
    S3_ACCESS_KEY_SECRET: 's3_access_secret',
    CLOUDWATCH_LOGLEVEL: undefined,
    CLOUDWATCH_LOG_GROUP_NAME: undefined,
    ADMIN_SERVER_STATIC_PATH: undefined,
    CONSOLE_SERVER_STATIC_PATH: undefined,
    DOCS_SERVER_STATIC_PATH: undefined,
    // NOTE(flooey): Commenting out to prevent errors when secrets are unavailable
    // LAUNCHDARKLY_API_KEY: secrets.LAUNCHDARKLY.test,
    LAUNCHDARKLY_API_KEY: undefined,
    // NOTE(flooey): Remove if secrets are available
    SENDGRID_API_KEY: 'SG.llama',
    NUM_WORKERS: '0',
    PLATFORM_SECRETS_ENCRYPTION_KEY: '12345678901234567890123456789012',
    FILE_PROXY_SIGNING_SECRET_KEY: '12345678901234567890123456789012',
    SENTRY_ENVIRONMENT: undefined,
    SENTRY_RELEASE: undefined,
    SENTRY_TRACE_SAMPLE_RATE: 0,
    SENTRY_APP_DSN: 'https://sentry.io/1234',
    SENTRY_SIDEBAR_DSN: 'https://sentry.io/1234',
    SENTRY_SERVER_DSN: 'https://sentry.io/1234',
    SENTRY_ASYNCWORKER_DSN: 'https://sentry.io/1234',
    SENTRY_BACKGROUND_DSN: 'https://sentry.io/1234',
    SENTRY_ADMIN_DSN: 'https://sentry.io/1234',
    SENTRY_SDK_DSN: 'https://sentry.io/1234',
    SENTRY_DOCS_CLIENT_DSN: 'https://sentry.io/1234',
    SENTRY_DOCS_SERVER_DSN: 'https://sentry.io/1234',
    DEV_CONSOLE_CORD_APP_SECRET: secrets.DEV_CONSOLE_CORD_APP.secret,
    INCLUDE_SDK_TESTBED: '1',
    DOCS_COOKIE_PARSER_SECRET: undefined,
    STRIPE_SECRET_KEY: secrets.STRIPE_SECRET_KEY.test_key,
    STRIPE_WEBHOOK_SECRET_KEY: 'paste-value-from-the-stripe-cli',
    PYROSCOPE_ENDPOINT: undefined,
  };
}

function buildTestEnv(commitHash) {
  return {
    ...buildDevEnv(commitHash),
    LOGLEVEL: 'info', // prevent sequelize log spew
    POSTGRES_USER: 'ChuckNorris',
    CLOUDWATCH_LOG_GROUP_NAME: `server.test`,
    ADMIN_SERVER_STATIC_PATH: 'dist/test/server/admin',
    CONSOLE_SERVER_STATIC_PATH: 'dist/test/server/console',
    DOCS_SERVER_STATIC_PATH: 'dist/test/docs/static',
    PLATFORM_SECRETS_ENCRYPTION_KEY: '12345678901234567890123456789012',
    FILE_PROXY_SIGNING_SECRET_KEY: '12345678901234567890123456789012',
    SENTRY_ENVIRONMENT: undefined,
    SENDGRID_API_KEY: 'SG.llama', // Start with "SG." instead of "!!SECRET" to shut up logspew.
  };
}

function buildPullReqEnv(commitHash, prNumber) {
  return {
    ...buildStagingEnv(commitHash),
    CORD_TIER: 'staging',

    API_SERVER_PORT: '+/shared/api',
    ADMIN_SERVER_PORT: '+/shared/admin',
    METRICS_SERVER_PORT: '+/shared/metrics',
    STATUS_SERVER_PORT: '+/shared/status',
    CONSOLE_SERVER_PORT: '+/shared/console',
    DOCS_SERVER_PORT: '+/shared/docs',

    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: 'ChuckNorris',
    POSTGRES_PASSWORD: 'r4dicalAF',
    POSTGRES_READ_HOST: undefined,
    POSTGRES_READ_PORT: undefined,

    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    PREDIS_HOST: 'localhost',
    PREDIS_PORT: 6379,

    // URLs pointing to our own endpoints
    TOP_SERVER_HOST: 'dev.cord.com',
    APP_SERVER_HOST: `pr${prNumber}.dev.cord.com`,
    API_SERVER_HOST: `pr${prNumber}-api.dev.cord.com`,
    ADMIN_SERVER_HOST: `pr${prNumber}-admin.dev.cord.com`,
    CONSOLE_SERVER_HOST: `pr${prNumber}-console.dev.cord.com`,
    CORD_TO_HOST: `pr${prNumber}-api.dev.cord.com`,
    DOCS_SERVER_HOST: `pr${prNumber}-docs.dev.cord.com`,
    COMMUNITY_SERVER_HOST: 'community.cord.com',

    JWT_SIGNING_SECRET: `${secrets.SESSION.jwt_signing_secret}-pr${prNumber}`,

    CORD_OPS_SLACK_CHANNEL_ID: undefined,
    PROD_CHANGES_SLACK_CHANNEL_ID: undefined,
    CORD_SECURITY_SLACK_CHANNEL_ID: undefined,
    CORD_GO_REDIRECTS_SLACK_CHANNEL_ID: undefined,
    CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID: undefined,
    CORD_CLIENT_REQUESTS_SLACK_CHANNEL_ID: undefined,

    CLOUDWATCH_LOG_GROUP_NAME: `server.pr${prNumber}`,
    ADMIN_SERVER_STATIC_PATH: undefined,
    CONSOLE_SERVER_STATIC_PATH: undefined,
    DOCS_SERVER_STATIC_PATH: undefined,
    SLACK_ADMIN_LOGIN_REDIRECT_HOST: 'admin.staging.cord.com',
    SLACK_APP_REDIRECT_HOST: 'api.staging.cord.com',

    NUM_WORKERS: '0',
    SENTRY_ENVIRONMENT: undefined,
    SENTRY_RELEASE: undefined,

    INCLUDE_SDK_TESTBED: '1',

    DOCS_COOKIE_PARSER_SECRET: undefined,
    PYROSCOPE_ENDPOINT: undefined,
  };
}

async function buildEnv(tier, oldEnv, prNumber, commitHash) {
  switch (tier) {
    case 'dev': {
      const devEnv = buildDevEnv(commitHash);

      // IN DEVELOPMENT: the values in `devEnv` will only be used if there is no
      // corresponding entry in the existing .env file (if any), i.e. we are not
      // going to overwrite fields that you have in your .env already, we will
      // only add those you don't have yet.

      const unknownKeysInOldEnv = Object.keys(oldEnv).filter(
        (k) => !(k in devEnv) && k !== 'CORD_TIER',
      );
      if (unknownKeysInOldEnv.length) {
        console.warn(
          `Your existing env defines one or more unknown variables: ${unknownKeysInOldEnv.join(
            ', ',
          )}`,
        );
      }

      return {
        ...devEnv,
        ...oldEnv,
        COMMIT_HASH: commitHash, // COMMIT_HASH should *always* be set to the current hash.
      };
    }
    case 'test':
      return { ...buildTestEnv(commitHash) };
    case 'staging':
      return { ...buildStagingEnv(commitHash) };
    case 'loadtest':
      return { ...buildLoadtestEnv(commitHash) };
    case 'prod':
      return { ...buildProdEnv(commitHash) };
    case 'pullreq':
      return { ...buildPullReqEnv(commitHash, prNumber) };
  }
}

async function diffDevEnv(oldEnv, includeSecrets) {
  const commitHash = (
    await run('git', ['rev-parse', '--short', 'HEAD']).catch(() => '')
  ).trim();

  const newEnv = await cleanEnv(buildDevEnv(commitHash), includeSecrets);

  const diffs = Object.entries(oldEnv)
    .filter(([k]) => !(k in newEnv) && k !== 'CORD_TIER')
    .map(([k, v]) => `-${k}=${shellEscape(v)}`)
    .concat(
      Object.entries(newEnv)
        .filter(([k, v]) => !(k in oldEnv) || oldEnv[k] !== v)
        .flatMap(([k, v]) => {
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          const diffs = [];
          if (k in oldEnv) {
            diffs.push(`-${k}=${shellEscape(oldEnv[k])}`);
          }
          diffs.push(`+${k}=${shellEscape(v)}`);
          return diffs;
        }),
    );
  for (const diff of diffs) {
    console.log(diff);
  }
}

async function main() {
  const argv = yargs
    .option('envFile', {
      type: 'string',
      description: 'path to the .env file to be generated',
      default: '.env',
    })
    .option('tier', {
      type: 'string',
      choices: ['dev', 'prod', 'staging', 'loadtest', 'test', 'pullreq'],
      description: 'The tier to prepare the .env settings for',
      default: 'dev',
    })
    .option('include-secrets', {
      type: 'boolean',
      description:
        'if true, look up secrets and include them in the .env file generated',
      defaultDescription: 'true for dev, false for all other tiers',
    })
    .option('diff', {
      type: 'boolean',
      description:
        '[dev only] if true, show a diff instead of writing the file',
      default: false,
    })
    .option('pr-number', {
      type: 'number',
      description: 'number of pull request for the pullreq tier',
    })
    .option('commit-hash', {
      type: 'string',
      description: 'set COMMIT_HASH to this value',
      defaultDescription: 'the currently checked out git commit',
    })
    .strict()
    .help()
    .alias('help', 'h').argv;

  const { tier, envFile, diff, 'pr-number': prNumber } = argv;

  /** @type {string} */
  const commitHash =
    argv['commit-hash'] ||
    (await run('git', ['rev-parse', '--short', 'HEAD']).catch(() => '')).trim();

  if (diff && tier !== 'dev') {
    console.error('Cannot use --diff in tiers other than dev');
    process.exit(1);
  }

  const includeSecrets =
    argv['include-secrets'] === undefined
      ? tier === 'dev'
      : argv['include-secrets'];

  let oldEnv = {};
  if (tier === 'dev') {
    // Only in dev we start by reading the existing .env file and keep all values
    // already declared in there, so effectively only adding missing entries.
    const fileContents = await fs.readFile(envFile).catch((error) => {
      if (error.code === 'ENOENT') {
        // Reading the env file only failed because it doesn't exist. We want
        // to treat this like an empty file.
        return '';
      } else {
        // If it's any other error, we'll abort.
        throw error;
      }
    });
    if (fileContents) {
      oldEnv = dotenv.parse(fileContents);
    }
    if (diff) {
      await diffDevEnv(oldEnv, includeSecrets);
      return;
    }
  }

  let newEnv = await cleanEnv(
    await buildEnv(tier, oldEnv, prNumber, commitHash),
    includeSecrets,
  );

  await fs.writeFile(
    envFile,
    Object.entries({ CORD_TIER: tier, ...newEnv })
      .map(([key, value]) => `${key}=${shellEscape(value)}\n`)
      .join(''),
  );
}

function shellEscape(x) {
  return "'" + x.toString().replace(/'/g, "'\\''") + "'";
}

// Cleans up the env values
async function cleanEnv(newEnv, includeSecrets) {
  newEnv = Object.fromEntries(
    Object.entries(newEnv)
      .filter(([_k, v]) => v !== undefined)
      .map(([k, v]) => [k, v.toString()]),
  );
  if (includeSecrets) {
    newEnv = await replaceSecretsInObject(newEnv);
  }
  return newEnv;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    child_process.execFile(cmd, args, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
