import {
  aws_secretsmanager as SecretsManager,
  RemovalPolicy,
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
      'Secret used for signing JSON webtokens to proof user is logged in to admin',
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
