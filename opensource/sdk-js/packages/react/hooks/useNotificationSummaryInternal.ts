import { useEffect, useState } from 'react';
import type {
  ICordNotificationSDK,
  NotificationListFilter,
  NotificationSummary,
} from '@cord-sdk/types';
import { useMemoObject } from './useMemoObject.js';

export function useNotificationCountsInternal(
  notificationSDK: ICordNotificationSDK | undefined,
  isCordInternalCall: boolean,
  filter?: NotificationListFilter | undefined,
): NotificationSummary | null {
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const filterMemo = useMemoObject(filter);

  useEffect(() => {
    if (!notificationSDK) {
      return;
    }

    const listenerRef = notificationSDK.observeNotificationCounts(setSummary, {
      filter: filterMemo,
      ...{
        __cordInternal: isCordInternalCall,
      },
    });

    return () => {
      notificationSDK.unobserveNotificationCounts(listenerRef);
    };
  }, [notificationSDK, isCordInternalCall, filterMemo]);

  return summary;
}
