import type { CSSProperties } from 'react';
import * as React from 'react';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type {
  NotificationListFilter,
  NotificationWebComponentEvents,
} from '@cord-sdk/types';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';
import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.NotificationList,
);

export type NotificationListReactComponentProps = {
  maxCount?: number;
  fetchAdditionalCount?: number;
  showPlaceholder?: boolean;
  filter?: NotificationListFilter;
  style?: CSSProperties;
  onClickNotification?: (
    ...args: NotificationWebComponentEvents['click']
  ) => unknown;
};

export function NotificationList(
  props: ReactPropsWithStandardHTMLAttributes<NotificationListReactComponentProps>,
) {
  const [notificationEventsListenerSetRef, notificationListenersAttached] =
    useCustomEventListeners<Pick<NotificationWebComponentEvents, 'click'>>(
      {
        click: props.onClickNotification,
      },
      'cord-notification',
    );

  return (
    <cord-notification-list
      id={props.id}
      class={props.className}
      style={props.style}
      ref={notificationEventsListenerSetRef}
      buffer-events={!notificationListenersAttached ? 'true' : 'false'}
      {...propsToAttributes(props)}
    />
  );
}
