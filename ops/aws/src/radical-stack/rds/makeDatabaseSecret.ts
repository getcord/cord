import {
  aws_secretsmanager as SecretsManager,
  RemovalPolicy,
} from 'aws-cdk-lib';

import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

export function mangleSecretName(secretName: string) {
  // NOTE(flooey): This is stupid, but we got into a state where we rolled back
  // the loadtest tier, but secrets can't be rolled back.  So we can't deploy
  // because the aurora-loadtest secret already exists.  We can't delete the
  // aurora-loadtest secret because secrets can't be deleted without a 7-day
  // waiting period.  We can't import the secret into CloudFormation because
  // secrets aren't supported for CloudFormation import.  Solution:
  // aurora-loadtest-2.
  if (secretName === 'aurora-loadtest') {
    return 'aurora-loadtest-2';
  }
  return secretName;
}

export const makeDatabaseSecret = (
  secretName: string,
  username = 'ChuckNorris',
) =>
  new SecretsManager.Secret(radicalStack(), `databaseSecret-${secretName}`, {
    secretName: mangleSecretName(secretName),
    generateSecretString: {
      // We do not want to use punctuation characters, because they can be
      // inconvenient and have even caused us trouble. (Amazon DMS can't
      // handle a few of them.) A password of length 30, when using lower and
      // upper case characters and numbers, has over 178 bits of entropy,
      // which is crazy safe.
      excludeLowercase: false,
      excludeUppercase: false,
      excludeNumbers: false,
      excludePunctuation: true,
      includeSpace: false,
      generateStringKey: 'password',
      passwordLength: 30,
      secretStringTemplate: JSON.stringify({ username }),
    },
    removalPolicy: RemovalPolicy.RETAIN,
  });
