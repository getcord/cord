import * as React from 'react';
import { useEffect } from 'react';

import type {
  FloatingThreadsWebComponentEvents,
  HTMLCordFloatingThreadsElement,
  ScreenshotConfig,
} from '@cord-sdk/types';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type {
  PropsWithFlags,
  ReactPropsWithLocation,
  ReactPropsWithStandardHTMLAttributes,
} from '../types.js';
import { useCustomElementRef } from '../hooks/useCustomElementRef.js';
import { useCustomPropsRef } from '../hooks/useCustomPropsRef.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.FloatingThreads,
);

let shouldLogLoadingTime = false;
try {
  shouldLogLoadingTime = !!localStorage.getItem('__cord_log_loading_times__');
} catch {
  // localStorage for some reason not available
}

export type FloatingThreadsReactComponentProps = PropsWithFlags<
  ReactPropsWithLocation<
    {
      showButton?: boolean;
      buttonLabel?: string;
      iconUrl?: string;
      threadName?: string;
      disabled?: boolean;
      showScreenshotPreview?: boolean;
      groupId?: string; // Needs to be specified if no org in the token
      onStart?: (
        ...args: FloatingThreadsWebComponentEvents['start']
      ) => unknown;
      onFinish?: (
        ...args: FloatingThreadsWebComponentEvents['finish']
      ) => unknown;
      onCancel?: (
        ...args: FloatingThreadsWebComponentEvents['cancel']
      ) => unknown;
    } & { screenshotConfig?: ScreenshotConfig }
  >
>;
type PrivateFloatingThreadsReactComponentProps =
  FloatingThreadsReactComponentProps & {
    newComponentSwitchConfig?: { [key: string]: boolean };
  };

export function FloatingThreadsWithForwardedRef(
  props: ReactPropsWithStandardHTMLAttributes<FloatingThreadsReactComponentProps>,
  forwardedRef: React.ForwardedRef<HTMLCordFloatingThreadsElement | null>,
) {
  const [setRef, listenersAttached] = useCustomElementRef<
    FloatingThreadsWebComponentEvents,
    HTMLCordFloatingThreadsElement
  >(
    {
      start: props.onStart,
      finish: props.onFinish,
      cancel: props.onCancel,
    },
    forwardedRef,
  );

  const combinedSetRef = useCustomPropsRef(
    {
      newComponentSwitchConfig: (
        props as PrivateFloatingThreadsReactComponentProps
      ).newComponentSwitchConfig,
      screenshotConfig: props.screenshotConfig,
    },
    setRef,
  );

  useEffect(() => {
    if (shouldLogLoadingTime) {
      console.log(
        `<cord-floating-threads> first render: ${new Date().toISOString()}`,
      );
    }
  }, []);

  return (
    <cord-floating-threads
      ref={combinedSetRef}
      id={props.id}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      class={props.className}
      style={props.style}
      use-shadow-root={props.useShadowRoot ? 'true' : 'false'}
      {...propsToAttributes(props)}
    />
  );
}

export const FloatingThreads = React.forwardRef<
  HTMLCordFloatingThreadsElement | null,
  FloatingThreadsReactComponentProps
>(FloatingThreadsWithForwardedRef);
