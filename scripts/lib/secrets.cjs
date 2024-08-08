const secretsManager = require('@aws-sdk/client-secrets-manager');
const AWS_REGION = 'eu-west-1';

async function replaceSecrets(text) {
  const segments = `${text}`.split(/!!SECRET!([\w-]+)!(\w*)!/);

  if (segments.length <= 1) {
    return text;
  }

  const promises = [];

  for (let i = 0; i < segments.length; ++i) {
    if (i % 3 === 0) {
      promises.push(segments[i]);
    } else {
      const secretName = segments[i];
      const fieldName = segments[++i];
      promises.push(getSecret(secretName).then((secret) => secret[fieldName]));
    }
  }

  return (await Promise.all(promises)).join('');
}

async function replaceSecretsInObject(object) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(object).map(async ([key, value]) => [
        key,
        await replaceSecrets(value),
      ]),
    ),
  );
}

const secrets = new Map();
function getSecret(secretName) {
  let promise = secrets.get(secretName);
  if (!promise) {
    promise = (async () => {
      const client = new secretsManager.SecretsManagerClient({
        region: AWS_REGION,
      });
      const response = await client.send(
        new secretsManager.GetSecretValueCommand({ SecretId: secretName }),
      );
      return JSON.parse(response.SecretString);
    })();
    secrets.set(secretName, promise);
  }
  return promise;
}

module.exports = { replaceSecrets, replaceSecretsInObject };
