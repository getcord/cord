import * as path from 'path';

import {
  aws_lambda as lambda,
  aws_lambda_event_sources as les,
} from 'aws-cdk-lib';

import { define, tiers } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import {
  opsNotificationTopic,
  snsTopics,
} from 'ops/aws/src/radical-stack/sns/topics.ts';
import { installLambdaErrorAlarm } from 'ops/aws/src/radical-stack/lambda/common.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';

define(() => {
  const notificationLambda = new lambda.Function(
    radicalStack(),
    'asgEventSlackNotification',
    {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'asgEventSlackNotification.handler',
      code: lambda.Code.fromAsset(
        path.join('src', 'radical-stack', 'lambda', 'autoScalingNotification'),
      ),
    },
  );

  vanta(
    notificationLambda,
    'Lambda function for posting notifications about auto scaling events to Slack',
    {},
  );

  for (const tier of tiers) {
    notificationLambda.addEventSource(
      new les.SnsEventSource(snsTopics[tier]()),
    );
  }

  installLambdaErrorAlarm(notificationLambda, opsNotificationTopic['prod']());
});
