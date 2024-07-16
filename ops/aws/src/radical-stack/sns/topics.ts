import { aws_sns as SNS, aws_sns_subscriptions as SNSS } from 'aws-cdk-lib';

import type { Tier } from 'ops/aws/src/common.ts';
import { defineForEachTier } from 'ops/aws/src/common.ts';
import { OPS_NOTIFICATION_EMAIL } from 'ops/aws/src/radical-stack/Config.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

function makeAsgSnsTopic(tier: Tier) {
  const topic = new SNS.Topic(radicalStack(), `${tier}-asg-event-topic`, {
    displayName: `${tier}-asg-event-topic`,
    topicName: `${tier}-asg-event-topic`,
  });

  return topic;
}

export const snsTopics = defineForEachTier(makeAsgSnsTopic);

export const opsNotificationTopic = defineForEachTier((tier: Tier) => {
  const topic = new SNS.Topic(
    radicalStack(),
    `ops-notification-topic-${tier}`,
    {
      displayName: `Ops Notifications (${tier})`,
      topicName: `ops-notifications-${tier}`,
    },
  );
  topic.addSubscription(new SNSS.EmailSubscription(OPS_NOTIFICATION_EMAIL));
  return topic;
});
