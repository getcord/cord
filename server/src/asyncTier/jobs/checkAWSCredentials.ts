import { GetCredentialReportCommand, IAMClient } from '@aws-sdk/client-iam';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';

import env from 'server/src/config/Env.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import type { EmptyJsonObject } from 'common/types/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

const DAYS_MS = 24 * 60 * 60 * 1000;
// Vanta agent alerts us when keys are >89 days old.
// We want to be notified earlier.
const MAX_PW_AGE_MS = 79 * DAYS_MS;
const MAX_ACCESS_KEY_AGE_MS = 79 * DAYS_MS;
const MAX_CREDENTIALS_REPORT_AGE_MS = 7 * DAYS_MS;

export default new AsyncTierJobDefinition(
  'awsCredentialsCheck',
  checkAWSCredentials,
).schedule({
  tier: 'staging',
  name: 'daily',
  cron: '0 10 * * 1-5', // “Everyday at 10:00, excluding Sat/Sun”
  data: {},
});

/**
 * Automatically check credentials to comply with SOC II requirements.
 */
async function checkAWSCredentials(_: EmptyJsonObject, logger: Logger) {
  const result = await new IAMClient({ region: AWS_REGION }).send(
    new GetCredentialReportCommand({}),
  );

  if (!result || !result.Content) {
    logger.error(`No result for AWS Credentials report`);
    return;
  }

  const { default: neatCsv } = await import('neat-csv');
  const { Content: csvContent, GeneratedTime } = result;
  const csv: { [K in (typeof HEADERS)[number]]: string }[] = await neatCsv(
    Buffer.from(csvContent.buffer),
  );

  if (csv) {
    const today = new Date().getTime();

    const usersWithoutMFA = [];
    const usersWithAccessKeyTooOld = [];
    const usersWithPwTooOld = [];
    for (const data of csv) {
      const {
        user,
        password_enabled,
        password_last_changed,
        mfa_active,
        access_key_1_active,
        access_key_2_active,
        access_key_1_last_rotated,
        access_key_2_last_rotated,
      } = data;

      if (password_enabled !== 'true') {
        continue;
      }

      const passwordTooOld =
        password_last_changed !== 'n/a' &&
        today - new Date(password_last_changed).getTime() > MAX_PW_AGE_MS;
      if (passwordTooOld) {
        usersWithPwTooOld.push(user);
      }

      if (mfa_active !== 'true') {
        usersWithoutMFA.push(user);
      }

      const noAccessKey =
        access_key_1_active !== 'true' && access_key_2_active !== 'true';
      if (noAccessKey) {
        continue;
      }

      const activeAccessKeyTooOld =
        isAccessKeyTooOld(
          access_key_1_active,
          access_key_1_last_rotated,
          today,
        ) ||
        isAccessKeyTooOld(
          access_key_2_active,
          access_key_2_last_rotated,
          today,
        );
      if (activeAccessKeyTooOld) {
        usersWithAccessKeyTooOld.push(user);
      }
    }

    if (!env.CORD_SECURITY_SLACK_CHANNEL_ID) {
      return;
    }

    if (
      GeneratedTime &&
      today - GeneratedTime.getTime() > MAX_CREDENTIALS_REPORT_AGE_MS
    ) {
      backgroundPromise(
        sendMessageToCord(
          `AWS Credentials Report is too old. Is "generateAWSCredentials" async job running correctly?`,
          env.CORD_SECURITY_SLACK_CHANNEL_ID,
          'security',
        ),
      );
      return;
    }

    if (
      usersWithAccessKeyTooOld.length ||
      usersWithoutMFA.length ||
      usersWithPwTooOld.length
    ) {
      let msg = `AWS Credentials Report ${
        GeneratedTime ? `(Generated ${GeneratedTime.toUTCString()})` : ''
      } :\n`;
      if (usersWithoutMFA.length) {
        msg += `\nUsers that must turn on MFA: ${usersWithoutMFA.join(',')}\n`;
        msg +=
          'To turn on MFA, log into the AWS console and visit "Security Credentials" in the top right menu\n';
      }
      if (usersWithPwTooOld.length) {
        msg += `\nUsers that must rotate their password: ${usersWithPwTooOld.join(
          ',',
        )}\n`;
        msg +=
          'To rotate your password, log into the AWS console and visit "Security Credentials" in the top right menu\n';
      }
      if (usersWithAccessKeyTooOld.length) {
        msg += `\nUsers that must rotate access key: ${usersWithAccessKeyTooOld.join(
          ',',
        )}`;
        msg +=
          '\nTo rotate your key, you can run `./scripts/rotate-aws-access-key.sh`';
      }
      backgroundPromise(
        sendMessageToCord(msg, env.CORD_SECURITY_SLACK_CHANNEL_ID, 'security'),
      );
    }
  }
}

function isAccessKeyTooOld(
  accessKeyActive: string,
  accessKeyLastRotated: string,
  today: number,
) {
  return (
    accessKeyActive === 'true' &&
    accessKeyLastRotated !== 'n/a' &&
    today - new Date(accessKeyLastRotated).getTime() > MAX_ACCESS_KEY_AGE_MS
  );
}

const HEADERS = [
  'user',
  'arn',
  'user_creation_time',
  'password_enabled',
  'password_last_used',
  'password_last_changed',
  'password_next_rotation',
  'mfa_active',
  'access_key_1_active',
  'access_key_1_last_rotated',
  'access_key_1_last_used_date',
  'access_key_1_last_used_region',
  'access_key_1_last_used_service',
  'access_key_2_active',
  'access_key_2_last_rotated',
  'access_key_2_last_used_date',
  'access_key_2_last_used_region',
  'access_key_2_last_used_service',
  'cert_1_active',
  'cert_1_last_rotated',
  'cert_2_active',
  'cert_2_last_rotated',
] as const;
