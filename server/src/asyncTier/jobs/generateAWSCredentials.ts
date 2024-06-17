import {
  GenerateCredentialReportCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';

export default new AsyncTierJobDefinition(
  'awsGenerateCredentialsReport',
  generateAWSCredentialsReports,
).schedule({
  tier: 'staging',
  name: 'daily',
  cron: '0 9  * * 1-5', // “Everyday at 09:00, excluding Sat/Sun”
  data: {},
});

/**
 * Kicks off the process that generates a credentials report,
 * which will be analysed by checkAWSCredentials job.
 */
async function generateAWSCredentialsReports() {
  await new IAMClient({ region: AWS_REGION }).send(
    new GenerateCredentialReportCommand({}),
  );
}
