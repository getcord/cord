import * as React from 'react';
import type {
  BadgeStyle,
  InboxLauncherWebComponentEvents,
} from '@cord-sdk/types';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';
import type { InboxSharedReactComponentProps } from './Inbox.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.InboxLauncher,
);

// props that just affect the launcher button
type InboxLauncherSpecificReactComponentProps = {
  label?: string;
  iconUrl?: string;
  /** @deprecated Use plain CSS instead */
  inboxBadgeStyle?: BadgeStyle;
  showInboxOnClick?: boolean;
  disabled?: boolean;
  onClick?: (...args: InboxLauncherWebComponentEvents['click']) => unknown;
};

export type InboxLauncherReactComponentProps =
  InboxLauncherSpecificReactComponentProps & InboxSharedReactComponentProps;

export function InboxLauncher(
  props: ReactPropsWithStandardHTMLAttributes<InboxLauncherReactComponentProps>,
) {
  const { onClick } = props;
  const [setRef, listenersAttached] =
    useCustomEventListeners<InboxLauncherWebComponentEvents>({
      click: onClick,
    });
  return (
    <cord-inbox-launcher
      id={props.id}
      class={props.className}
      style={props.style}
      ref={setRef}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      use-shadow-root={props.useShadowRoot ? 'true' : 'false'}
      {...propsToAttributes(props)}
    />
  );
}
