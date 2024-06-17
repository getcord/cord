import * as cdk from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { app } from 'ops/aws/src/cdkapp.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';

export const usEast1Stack = define(
  () =>
    new cdk.Stack(app(), 'radical-stack-us-east-1', {
      env: { region: 'us-east-1', account: AWS_ACCOUNT },
    }),
);
