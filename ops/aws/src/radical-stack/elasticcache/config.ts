import {
  aws_ec2 as EC2,
  aws_elasticache as ElasticCache,
  RemovalPolicy,
} from 'aws-cdk-lib';

import type { Tier } from 'ops/aws/src/common.ts';
import { define, tiers } from 'ops/aws/src/common.ts';
import { securityGroups } from 'ops/aws/src/radical-stack/ec2/securityGroups.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';
import { addAliasToInternalZone } from 'ops/aws/src/radical-stack/route53/int.cord.com.ts';
import { defaultVpc } from 'ops/aws/src/radical-stack/ec2/vpc.ts';
import { zeroSecurityGroup } from 'ops/aws/src/radical-stack/ec2/zero.ts';
import { LOADTEST_TIER_ENABLED } from 'ops/aws/src/Config.ts';

const REDIS_PORT = 6379;
const PREDIS_PORT = 6380;

type RedisTier = 'prod' | 'loadtest';
const defineForEachRedisTier = <T>(func: (tier: RedisTier) => T) => ({
  prod: define(() => func('prod')),
  loadtest: define(() => func('loadtest')),
});

function makeCache(tier: Tier, port: number, nameSuffix: string) {
  if (tier === 'loadtest' && !LOADTEST_TIER_ENABLED) {
    return null;
  }

  const key = `${tier}-${nameSuffix}`;
  const securityGroup = new EC2.SecurityGroup(radicalStack(), `sg-${key}`, {
    vpc: defaultVpc(),
    allowAllOutbound: false,
    description: 'Security Group for Redis',
    securityGroupName: key,
  });
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  for (const tier of tiers) {
    securityGroup.addIngressRule(securityGroups[tier](), EC2.Port.tcp(port));
  }
  securityGroup.addIngressRule(zeroSecurityGroup(), EC2.Port.tcp(port));

  const cache = new ElasticCache.CfnCacheCluster(radicalStack(), key, {
    cacheNodeType: 'cache.r4.large',
    clusterName: key,
    engine: 'redis',
    engineVersion: '6.x',
    numCacheNodes: 1,
    port: port,
    vpcSecurityGroupIds: [securityGroup.securityGroupId],
  });
  cache.applyRemovalPolicy(RemovalPolicy.DESTROY);
  addAliasToInternalZone(key, cache.attrRedisEndpointAddress);
  return cache;
}

export const redisInstances = defineForEachRedisTier((tier) =>
  makeCache(tier, REDIS_PORT, 'redis'),
);
export const predisInstances = defineForEachRedisTier((tier) =>
  makeCache(tier, PREDIS_PORT, 'redis-presence'),
);
