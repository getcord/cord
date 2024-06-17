import * as path from 'path';

import {
  aws_lambda as lambda,
  aws_lambda_event_sources as les,
} from 'aws-cdk-lib';

import { define, tiers } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { opsNotificationTopic } from 'ops/aws/src/radical-stack/sns/topics.ts';
import { installLambdaErrorAlarm } from 'ops/aws/src/radical-stack/lambda/common.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

define(() => {
  const notificationLambda = new lambda.Function(
    radicalStack(),
    'opsNotificationLambda',
    {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'opsNotification.handler',
      code: lambda.Code.fromAsset(
        path.join('src', 'radical-stack', 'lambda', 'opsNotification'),
      ),
    },
  );

  vanta(
    notificationLambda,
    'Lambda function for posting operational messages - such as alarms - to Slack',
    {},
  );

  for (const tier of tiers) {
    notificationLambda.addEventSource(
      new les.SnsEventSource(opsNotificationTopic[tier]()),
    );
  }

  installLambdaErrorAlarm(notificationLambda, opsNotificationTopic['prod']());
});
