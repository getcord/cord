import * as cdk from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';

// This is the `cdk.App` object that we use for creating the CloudFormation
// stacks.
export const app = define(() => new cdk.App({ analyticsReporting: false }));
