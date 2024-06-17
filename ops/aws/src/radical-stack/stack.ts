import * as cdk from 'aws-cdk-lib';

import { define } from 'ops/aws/src/common.ts';
import { app } from 'ops/aws/src/cdkapp.ts';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';
import { AWS_ACCOUNT } from 'ops/aws/src/Config.ts';

export const radicalStack = define(
  () =>
    new cdk.Stack(app(), 'radical-stack', {
      env: { region: AWS_REGION, account: AWS_ACCOUNT },
    }),
);
