import * as React from 'react';
import type {
  BadgeStyle,
  SidebarLauncherWebComponentEvents,
} from '@cord-sdk/types';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.SidebarLauncher,
);

export type SidebarLauncherReactComponentProps = {
  disabled?: boolean;
  label?: string | null;
  iconUrl?: string | null;
  inboxBadgeStyle?: BadgeStyle;
  onClick?: (...args: SidebarLauncherWebComponentEvents['click']) => unknown;
};

export function SidebarLauncher(
  props: ReactPropsWithStandardHTMLAttributes<SidebarLauncherReactComponentProps>,
) {
  const { onClick } = props;

  const [setRef, listenersAttached] =
    useCustomEventListeners<SidebarLauncherWebComponentEvents>({
      click: onClick,
    });

  return (
    <cord-sidebar-launcher
      id={props.id}
      class={props.className}
      style={props.style}
      ref={setRef}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      {...propsToAttributes(props)}
    />
  );
}
