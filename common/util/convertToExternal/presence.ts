import type {
  PartialUserLocationData,
  UserLocationData,
} from '@cord-sdk/types';
import type { PresenceLiveQuerySubscriptionResult } from 'common/graphql/types.ts';
import { isLocation, toLocation } from 'common/types/index.ts';

export function toUserLocationData(
  u: PresenceLiveQuerySubscriptionResult['presenceLiveQuery']['data'][number],
): PartialUserLocationData {
  const result: PartialUserLocationData = {
    id: u.externalUserID,
  };
  if (u.ephemeral) {
    result.ephemeral = {
      locations: u.ephemeral.contexts?.filter(isLocation) ?? null,
    };
  }
  if (u.durable) {
    result.durable = {
      location: toLocation(u.durable.context)!,
      timestamp: new Date(u.durable.timestamp),
    };
  }
  return result;
}

export function fillUserLocationData(
  d: PartialUserLocationData,
): UserLocationData {
  return { ...d, ephemeral: { locations: d?.ephemeral?.locations ?? [] } };
}
