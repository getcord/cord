import * as React from 'react';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';

import type {
  ComposerSize,
  ComposerWebComponentEvents,
  EntityMetadata,
} from '@cord-sdk/types';
import { useCordLocation } from '../hooks/useCordLocation.js';
import type {
  ReactPropsWithLocation,
  ReactPropsWithStandardHTMLAttributes,
} from '../types.js';
import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';
import { useCustomPropsRef } from '../hooks/useCustomPropsRef.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.Composer,
);

export type ComposerReactComponentProps = ReactPropsWithLocation<{
  threadId?: string;
  threadName?: string;
  threadUrl?: string;
  autofocus?: boolean;
  disabled?: boolean;
  showExpanded?: boolean;
  showCloseButton?: boolean;
  size?: ComposerSize;
  messageMetadata?: EntityMetadata;
  threadMetadata?: EntityMetadata;
  groupId?: string;
  onFocus?: (...args: ComposerWebComponentEvents['focus']) => unknown;
  onBlur?: (...args: ComposerWebComponentEvents['blur']) => unknown;
  onClose?: (...args: ComposerWebComponentEvents['close']) => unknown;
  onSend?: (...args: ComposerWebComponentEvents['send']) => unknown;
  onThreadReopen?: (
    ...args: ComposerWebComponentEvents['threadreopen']
  ) => unknown;
}>;

type PrivateComposerReactComponentProps = ComposerReactComponentProps & {
  newComponentSwitchConfig?: { [key: string]: boolean };
};

export function Composer(
  props: ReactPropsWithStandardHTMLAttributes<ComposerReactComponentProps>,
) {
  const [setRef, listenersAttached] =
    useCustomEventListeners<ComposerWebComponentEvents>({
      focus: props.onFocus,
      blur: props.onBlur,
      close: props.onClose,
      send: props.onSend,
      threadreopen: props.onThreadReopen,
    });

  const combinedSetRef = useCustomPropsRef(
    {
      newComponentSwitchConfig: (props as PrivateComposerReactComponentProps)
        .newComponentSwitchConfig,
    },
    setRef,
  );

  const location = useCordLocation();

  return (
    <cord-composer
      id={props.id}
      class={props.className}
      style={props.style}
      ref={combinedSetRef}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      {...propsToAttributes({ location, ...props })}
    />
  );
}
