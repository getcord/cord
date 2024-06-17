import * as React from 'react';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type { NotificationWebComponentEvents } from '@cord-sdk/types';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';
import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.Notification,
);

export type NotificationReactComponentProps = {
  notificationId: string;
  onClick?: (...args: NotificationWebComponentEvents['click']) => unknown;
};

export function Notification(
  props: ReactPropsWithStandardHTMLAttributes<NotificationReactComponentProps>,
) {
  const [setRef, listenersAttached] =
    useCustomEventListeners<NotificationWebComponentEvents>({
      click: props.onClick,
    });

  return (
    <cord-notification
      id={props.id}
      class={props.className}
      style={props.style}
      ref={setRef}
      buffer-events={!listenersAttached}
      {...propsToAttributes(props)}
    ></cord-notification>
  );
}
