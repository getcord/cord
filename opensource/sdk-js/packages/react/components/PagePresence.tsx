import * as React from 'react';
import type {
  Orientation,
  PagePresenceWebComponentEvents,
} from '@cord-sdk/types';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';

import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';
import { useCordLocation } from '../hooks/useCordLocation.js';
import type {
  PresenceReducerOptions,
  PropsWithFlags,
  ReactPropsWithStandardHTMLAttributes,
} from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.PagePresence,
);

export type PagePresenceReactComponentProps = PropsWithFlags<
  PresenceReducerOptions & {
    durable?: boolean;
    maxUsers?: number;
    orientation?: Orientation;
    onUpdate?: (...args: PagePresenceWebComponentEvents['update']) => unknown;
    groupId?: string;
  }
>;

export function PagePresence(
  props: ReactPropsWithStandardHTMLAttributes<PagePresenceReactComponentProps>,
) {
  const { onUpdate } = props;
  const [setRef, listenersAttached] =
    useCustomEventListeners<PagePresenceWebComponentEvents>({
      update: onUpdate,
    });

  const location = useCordLocation();

  return (
    <cord-page-presence
      id={props.id}
      class={props.className}
      style={props.style}
      ref={setRef}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      use-shadow-root={props.useShadowRoot ? 'true' : 'false'}
      {...propsToAttributes({ location, ...props })}
    />
  );
}
