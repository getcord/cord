import {
  aws_secretsmanager as SecretsManager,
  RemovalPolicy,
  SecretValue,
} from 'aws-cdk-lib';
import * as Config from 'ops/aws/src/radical-stack/Config.ts';

import { define } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

// slack oauth state signing secret
define(() =>
  new SecretsManager.Secret(
    radicalStack(),
    Config.SLACK_OAUTH_STATE_SIGNING_SECRET,
    {
      description:
        'Secret for signing the state object used in the slack oauth flow',
      secretName: Config.SLACK_OAUTH_STATE_SIGNING_KEY_REF_NAME,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'signing_secret',
      },
      removalPolicy: RemovalPolicy.RETAIN,
    },
  ));

// Secret used for authenticating Sendgrid's Inbound Parse webhook requests
define(() =>
  new SecretsManager.Secret(
    radicalStack(),
    Config.SENDGRID_INBOUND_WEBHOOK_SECRET,
    {
      description:
        "Secret used for authenticating Sendgrid's Inbound Parse webhook requests",
      secretName: Config.SENDGRID_INBOUND_WEBHOOK_SECRET_KEY_REF_NAME,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'webhook_secret',
        excludePunctuation: true,
        includeSpace: false,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    },
  ));

// JSON webtoken secret for admin tokens
define(() =>
  new SecretsManager.Secret(radicalStack(), 'admin-token-secret', {
    description:
      'Secret used for signing JSON webtokens to prove user is logged in to admin',
    secretName: 'admin-token-secret',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'secret',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

// storing cookies on docs website
define(() =>
  new SecretsManager.Secret(radicalStack(), 'docs-cookie-parser-secret', {
    description: 'storing cookies on docs website',
    secretName: 'docs-cookie-parser-secret',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'secret',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'platform_secrets_encryption_key', {
    description:
      'Secret key used to encrypt sensitive partner-provided platform secrets, such as S3 bucket access credentials.',
    secretName: 'platform_secrets_encryption_key',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'encryption_key',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'file_proxy_signing_secret', {
    description: 'Secret key used to encrypt file proxy operations.',
    secretName: 'file_proxy_signing_secret',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'key',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'email_links_token_secret', {
    description: 'Secret key used to encrypt email tokens.',
    secretName: 'email_links_token_secret',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'secret',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'dev_console_cord_app', {
    description: 'Secret key used to encrypt console JWTs.',
    secretName: 'dev_console_cord_app',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'secret',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'demo_apps_shared_secret', {
    description: 'Shared application secret for demo apps.',
    secretName: 'demo_apps_shared_secret',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'key',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'session_encryption', {
    description: 'Secret needed to encrypt session JWT tokens.',
    secretName: 'session_encryption',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'jwt_signing_secret',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

define(() =>
  new SecretsManager.Secret(radicalStack(), 'oauth_flow', {
    description:
      'The secret used to generate the signed state tokens used in the 3rd party (JIRA, Asana, etc) OAuth flows.',
    secretName: 'oauth_flow',
    generateSecretString: {
      secretStringTemplate: '{}',
      generateStringKey: 'signing_secret',
      excludePunctuation: true,
      includeSpace: false,
    },
    removalPolicy: RemovalPolicy.RETAIN,
  }));

type ApiSecret = {
  name: string;
  description: string;
  key: string | string[];
};

const API_SECRETS: ApiSecret[] = [
  {
    name: 'slack_api',
    description: 'Slack API authorization secrets for prod',
    key: ['client_secret', 'signing_secret'],
  },
  {
    name: 'slack_api_staging',
    description: 'Slack API authorization secrets for staging',
    key: ['client_secret', 'signing_secret'],
  },
  {
    name: 'slack_api_internal',
    description: 'Slack API authorization secrets for internal posting',
    key: ['bot_token', 'signing_secret'],
  },
  {
    name: 'slack_admin_login_app',
    description: 'Credentials for Slack app used to log into Admin tool',
    key: ['client_secret', 'signing_secret'],
  },
  {
    name: 'cord_updates_slack_app_bot_token',
    description:
      'Credentials for Slack app used to announce updates to customers',
    key: 'bot_token',
  },
  {
    name: 'jira_api',
    description: 'Credentials for JIRA API',
    key: 'client_secret',
  },
  {
    name: 'asana_api',
    description: 'Credentials for Asana API',
    key: 'client_secret',
  },
  {
    name: 'linear_api',
    description: 'Credentials for Linear API',
    key: 'client_secret',
  },
  {
    name: 'trello_api',
    description: 'Credentials for Trello API',
    key: 'client_secret',
  },
  {
    name: 'monday_api',
    description: 'Credentials for Monday API',
    key: 'client_secret',
  },
  {
    name: 'sendgrid',
    description: 'Credentials for Sendgrid API',
    key: 'key',
  },
  {
    name: 'launchdarkly_api',
    description: 'Credentials for LaunchDarkly API',
    key: ['prod', 'staging', 'test'],
  },
  {
    name: 'openai_api_secret',
    description: 'Credentials for OpenAI API',
    key: 'api_key',
  },
  {
    name: 'ipstack_api_secret',
    description: 'Credentials for IPStack API',
    key: 'api_key',
  },
  {
    name: 'auth0-webhook-secret',
    description: 'Credentials for validating Auth0 webhook calls',
    key: 'secret',
  },
  {
    name: 'auth0_mtm_client_secret',
    description:
      'Credentials for authenticating Auth0 machine-to-machine API calls',
    key: 'secret',
  },
  {
    name: 'ga_measurement_protocol_api',
    description: 'Credentials for Google Analytics measurement API',
    key: ['id', 'secret'],
  },
  {
    name: 'stripe_secret_key',
    description: 'Credentials for Stripe API',
    key: ['prod_key', 'webhook_prod_key', 'test_key', 'webhook_test_key'],
  },
  {
    name: 'loops_so_api_key',
    description: 'Credentials for Loops API',
    key: 'api_key',
  },
];

define(() => {
  for (const apiSecret of API_SECRETS) {
    const objectKeys =
      typeof apiSecret.key === 'string' ? [apiSecret.key] : apiSecret.key;
    const secretObjectValue = Object.fromEntries(
      objectKeys.map((k) => [
        k,
        SecretValue.unsafePlainText('INSERT API KEY HERE'),
      ]),
    );
    new SecretsManager.Secret(radicalStack(), apiSecret.name, {
      description: apiSecret.description,
      secretName: apiSecret.name,
      secretObjectValue,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
});
