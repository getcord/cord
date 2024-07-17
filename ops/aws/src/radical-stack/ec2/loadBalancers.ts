import * as cdk from 'aws-cdk-lib';
import {
  aws_elasticloadbalancingv2 as elbv2,
  aws_elasticloadbalancingv2_targets as elbv2t,
  aws_ec2 as EC2,
  aws_cloudwatch as CloudWatch,
  aws_cloudwatch_actions as CWActions,
} from 'aws-cdk-lib';

import type { Tier } from 'ops/aws/src/common.ts';
import { define, defineForEachTier, tiers } from 'ops/aws/src/common.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import {
  defaultSecurityGroup,
  monitoringSecurityGroup,
  securityGroups,
} from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { cordComCertificate } from 'ops/aws/src/radical-stack/acm/cord.com.ts';
import { stagingCordComCertificate } from 'ops/aws/src/radical-stack/acm/staging.cord.com.ts';
import { elbLogsBucket } from 'ops/aws/src/radical-stack/s3/elb-logs-devloadbalancer.ts';
import { monitoringInstance } from 'ops/aws/src/radical-stack/ec2/monitoring.ts';
import { loadtestCordComCertificate } from 'ops/aws/src/radical-stack/acm/loadtest.cord.com.ts';
import { vanta } from 'ops/aws/src/radical-stack/vanta.ts';
import { opsNotificationTopic } from 'ops/aws/src/radical-stack/sns/topics.ts';
import {
  CORD_COM_DOMAINS,
  PRIMARY_DOMAIN_NAME,
} from 'ops/aws/src/radical-stack/Config.ts';
import { LOADTEST_TIER_ENABLED } from 'ops/aws/src/Config.ts';

export const loadBalancer = define(() => {
  const lb = new elbv2.ApplicationLoadBalancer(
    radicalStack(),
    'devLoadBalancer',
    {
      vpc: defaultVpc(),
      vpcSubnets: { subnetType: EC2.SubnetType.PUBLIC },
      internetFacing: true,
      http2Enabled: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
      idleTimeout: cdk.Duration.seconds(60),
      securityGroup: securityGroup(),
    },
  );
  vanta(
    lb,
    'Terminates incoming https connections and forwards traffic to our EC2 instances',
    {},
  );

  const httpListener = lb.addListener('http', {
    port: 80,
    protocol: elbv2.ApplicationProtocol.HTTP,
    open: true,
    // When a browser finds a domain using the domain search list, it still sends
    // a host header of what you entered (for example, http://admin/ with a domain
    // search list of "cord.com" will connect to the IP address for admin.cord.com
    // but send a host header of "admin").  Redirect those to the proper name.
    defaultAction: elbv2.ListenerAction.redirect({
      protocol: elbv2.ApplicationProtocol.HTTPS,
      port: '443',
      host: `#{host}.${PRIMARY_DOMAIN_NAME}`,
      permanent: true,
    }),
  });

  httpListener.addAction('redirecttohttps', {
    conditions: [
      elbv2.ListenerCondition.hostHeaders(
        CORD_COM_DOMAINS.map((domain) => `*.${domain}`),
      ),
    ],
    priority: 100,
    action: elbv2.ListenerAction.redirect({
      protocol: elbv2.ApplicationProtocol.HTTPS,
      port: '443',
      permanent: true,
    }),
  });

  const httpsListener = lb.addListener('https', {
    port: 443,
    protocol: elbv2.ApplicationProtocol.HTTPS,
    open: true,
    defaultAction: elbv2.ListenerAction.redirect({ host: PRIMARY_DOMAIN_NAME }),
    certificates: [
      cordComCertificate(),
      stagingCordComCertificate(),
      loadtestCordComCertificate(),
    ],
    sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS,
  });

  function addAction(
    id: string,
    priority: number,
    hostHeaders: string[],
    targetGroup: cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup | null,
  ) {
    if (targetGroup !== null) {
      httpsListener.addAction(id, {
        conditions: [elbv2.ListenerCondition.hostHeaders(hostHeaders)],
        priority,
        action: elbv2.ListenerAction.forward([targetGroup]),
      });
    }
  }

  addAction(
    'monitoring',
    100,
    [`monitoring.${PRIMARY_DOMAIN_NAME}`],
    monitoringTargetGroup(),
  );
  addAction(
    'oncall',
    99,
    [`oncall.${PRIMARY_DOMAIN_NAME}`],
    oncallTargetGroup(),
  );

  httpsListener.addAction('go', {
    conditions: [
      elbv2.ListenerCondition.hostHeaders([`go.${PRIMARY_DOMAIN_NAME}`]),
    ],
    priority: 98,
    action: elbv2.ListenerAction.redirect({
      host: `admin.${PRIMARY_DOMAIN_NAME}`,
      path: '/go/#{path}',
      permanent: true,
    }),
  });

  addAction(
    'stagingAdmin',
    95,
    [`admin.staging.${PRIMARY_DOMAIN_NAME}`],
    serverAdminTargetGroups['staging'](),
  );
  addAction(
    'stagingAPI',
    80,
    [`api.staging.${PRIMARY_DOMAIN_NAME}`],
    serverAPITargetGroups['staging'](),
  );
  addAction(
    'stagingConsole',
    78,
    [`console.staging.${PRIMARY_DOMAIN_NAME}`],
    serverConsoleTargetGroups['staging'](),
  );
  addAction(
    'stagingDocs',
    76,
    [`docs.staging.${PRIMARY_DOMAIN_NAME}`],
    serverDocsTargetGroups['staging'](),
  );

  addAction(
    'prodAdmin',
    75,
    [`admin.${PRIMARY_DOMAIN_NAME}`],
    serverAdminTargetGroups['prod'](),
  );
  addAction(
    'prodAPI',
    70,
    [`api.${PRIMARY_DOMAIN_NAME}`],
    serverAPITargetGroups['prod'](),
  );
  addAction(
    'prodConsole',
    68,
    [`console.${PRIMARY_DOMAIN_NAME}`],
    serverConsoleTargetGroups['prod'](),
  );
  addAction(
    'prodDocs',
    66,
    [`docs.${PRIMARY_DOMAIN_NAME}`],
    serverDocsTargetGroups['prod'](),
  );

  if (LOADTEST_TIER_ENABLED) {
    addAction(
      'loadtestAdmin',
      65,
      [`admin.loadtest.${PRIMARY_DOMAIN_NAME}`],
      serverAdminTargetGroups['loadtest'](),
    );
    addAction(
      'loadtestAPI',
      60,
      [`api.loadtest.${PRIMARY_DOMAIN_NAME}`],
      serverAPITargetGroups['loadtest'](),
    );
    addAction(
      'loadtestConsole',
      58,
      [`console.loadtest.${PRIMARY_DOMAIN_NAME}`],
      serverConsoleTargetGroups['loadtest'](),
    );
    addAction(
      'loadtestDocs',
      56,
      [`docs.loadtest.${PRIMARY_DOMAIN_NAME}`],
      serverDocsTargetGroups['loadtest'](),
    );
  }

  // cord.to/typeform/xxxx and cord.to/redirect/xxxx links are handled by our api servers
  const prodServerAPITargetGroups = serverAPITargetGroups['prod']();
  if (prodServerAPITargetGroups) {
    httpsListener.addAction('cordToTrackedLinks', {
      conditions: [
        elbv2.ListenerCondition.hostHeaders(['cord.to']),
        elbv2.ListenerCondition.pathPatterns(['/typeform/*', '/redirect/*']),
      ],
      priority: 55,
      action: elbv2.ListenerAction.forward([prodServerAPITargetGroups]),
    });
  }

  lb.logAccessLogs(elbLogsBucket());

  return lb;
});

export const monitoringTargetGroup = define(
  () =>
    new elbv2.ApplicationTargetGroup(radicalStack(), 'monitoringTargetGroup', {
      targetGroupName: 'monitoring3000',
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 3000,
      targets: [new elbv2t.InstanceTarget(monitoringInstance(), 3000)],
      vpc: defaultVpc(),
    }),
);

export const oncallTargetGroup = define(
  () =>
    new elbv2.ApplicationTargetGroup(radicalStack(), 'oncallTargetGroup', {
      targetGroupName: 'oncall8080',
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8080,
      targets: [new elbv2t.InstanceTarget(monitoringInstance(), 8080)],
      vpc: defaultVpc(),
    }),
);

export const serverAPITargetGroups = defineForEachTier(
  makeServerTargetGroup('API', 8161),
);
export const serverAdminTargetGroups = defineForEachTier(
  makeServerTargetGroup('Admin', 8123),
);
export const serverConsoleTargetGroups = defineForEachTier(
  makeServerTargetGroup('Console', 8171),
);

export const serverDocsTargetGroups = defineForEachTier(
  makeServerTargetGroup('Docs', 8191),
);

function makeServerTargetGroup(name: string, port: number) {
  return (tier: Tier) => {
    if (tier === 'loadtest' && !LOADTEST_TIER_ENABLED) {
      return null;
    }

    return new elbv2.ApplicationTargetGroup(
      radicalStack(),
      `${tier}Server${name}TargetGroup`,
      {
        targetGroupName: `${tier}Server${name}TargetGroup`,
        protocol: elbv2.ApplicationProtocol.HTTP,
        port,
        vpc: defaultVpc(),
        healthCheck: {
          path: '/health',
          timeout: cdk.Duration.seconds(20),
          interval: cdk.Duration.seconds(25), // must be longer than the timeout
          healthyThresholdCount: 3,
          unhealthyThresholdCount: 3,
        },
        targetType: elbv2.TargetType.INSTANCE,
        loadBalancingAlgorithmType:
          elbv2.TargetGroupLoadBalancingAlgorithmType.ROUND_ROBIN,
      },
    );
  };
}

export const securityGroup = define(() => {
  const sg = new EC2.SecurityGroup(radicalStack(), 'devLoadBalancerSG', {
    vpc: defaultVpc(),
    allowAllOutbound: false,
    description: 'Security Group for devLoadBalancer',
    securityGroupName: 'devLoadBalancerSG',
  });

  sg.addEgressRule(defaultSecurityGroup(), EC2.Port.tcp(80));
  sg.addEgressRule(monitoringSecurityGroup(), EC2.Port.tcp(3000));
  sg.addEgressRule(monitoringSecurityGroup(), EC2.Port.tcp(8080));
  for (const tier of tiers) {
    const tierSG = securityGroups[tier]();
    for (const port of [8123, 8161, 8171, 8191]) {
      sg.addEgressRule(tierSG, EC2.Port.tcp(port));
    }
  }

  return sg;
});

// CloudWatch alarm
defineForEachTier((tier) => {
  const targetGroup = serverAPITargetGroups[tier]();
  if (!targetGroup) {
    return;
  }

  const targetResponseTimeAlarm = new CloudWatch.Alarm(
    targetGroup,
    'alarm-targetReposonseTime',
    {
      alarmName: `${tier} API response time`,
      alarmDescription: 'response time greater than 100ms',
      metric: targetGroup.metrics.targetResponseTime().with({
        period: cdk.Duration.minutes(1),
        statistic: cdk.aws_cloudwatch.Stats.percentile(75),
      }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 0.1,
      actionsEnabled: true,
    },
  );
  targetResponseTimeAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic['prod']()),
  );

  const serverErrorsSpikeAlarm = new CloudWatch.Alarm(
    targetGroup,
    'alarm-server-errors-spike',
    {
      alarmName: `${tier} API 5xx spike`,
      alarmDescription:
        'high number of requests returning 5xx status per minute',
      metric: targetGroup.metrics
        .httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT)
        .with({ period: cdk.Duration.minutes(1) }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 100,
      treatMissingData: CloudWatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    },
  );
  serverErrorsSpikeAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic['prod']()),
  );

  const serverErrorsSustainedAlarm = new CloudWatch.Alarm(
    targetGroup,
    'alarm-server-errors-sustained',
    {
      alarmName: `${tier} API 5xx sustained`,
      alarmDescription:
        'sustained number of requests returning 5xx status per minute',
      metric: targetGroup.metrics
        .httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT)
        .with({ period: cdk.Duration.minutes(1) }),
      evaluationPeriods: 10,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 10,
      treatMissingData: CloudWatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    },
  );
  serverErrorsSustainedAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic['prod']()),
  );

  const unhealthyHostCountAlarm = new CloudWatch.Alarm(
    targetGroup,
    'alarm-unhealthy-host-count',
    {
      alarmName: `${tier} API unhealthy host count`,
      alarmDescription: 'more than 2 unhealthy hosts',
      metric: targetGroup.metrics
        .unhealthyHostCount()
        .with({ period: cdk.Duration.minutes(1) }),
      evaluationPeriods: 2,
      comparisonOperator: CloudWatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 2,
      actionsEnabled: true,
    },
  );
  unhealthyHostCountAlarm.addAlarmAction(
    new CWActions.SnsAction(opsNotificationTopic['prod']()),
  );
});
