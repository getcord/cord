import type { aws_lambda as lambda, aws_sns as SNS } from 'aws-cdk-lib';
import {
  aws_cloudwatch as CloudWatch,
  aws_cloudwatch_actions as CWActions,
  Duration,
} from 'aws-cdk-lib';

export function installLambdaErrorAlarm(
  lambda: lambda.IFunction,
  topic: SNS.Topic,
) {
  if (lambda.node.tryFindChild('alarm-errors')) {
    return;
  }

  const metric = lambda.metricErrors();

  const lambdaErrorAlarm = new CloudWatch.Alarm(lambda, 'alarm-errors', {
    alarmName: `Lambda errors: ${lambda.functionName}`,
    metric: metric.with({ period: Duration.minutes(1) }),
    evaluationPeriods: 1,
    comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    threshold: 0,
    actionsEnabled: true,
  });

  lambdaErrorAlarm.addAlarmAction(new CWActions.SnsAction(topic));
}
