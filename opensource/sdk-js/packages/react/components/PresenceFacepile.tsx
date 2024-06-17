import * as React from 'react';
import type {
  Orientation,
  PresenceFacepileWebComponentEvents,
} from '@cord-sdk/types';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';

import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';
import { useCordLocation } from '../hooks/useCordLocation.js';
import type {
  PresenceReducerOptions,
  ReactPropsWithStandardHTMLAttributes,
} from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.PresenceFacepile,
);

export type PresenceFacepileReactComponentProps = PresenceReducerOptions & {
  maxUsers?: number;
  orientation?: Orientation;
  onUpdate?: (...args: PresenceFacepileWebComponentEvents['update']) => unknown;
};

export function PresenceFacepile(
  props: ReactPropsWithStandardHTMLAttributes<PresenceFacepileReactComponentProps>,
) {
  const { onUpdate } = props;
  const [setRef, listenersAttached] =
    useCustomEventListeners<PresenceFacepileWebComponentEvents>({
      update: onUpdate,
    });

  const location = useCordLocation();

  return (
    <cord-presence-facepile
      id={props.id}
      class={props.className}
      style={props.style}
      ref={setRef}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      {...propsToAttributes({ location, ...props })}
    />
  );
}
