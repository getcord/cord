import * as React from 'react';
import { useCallback } from 'react';
import type {
  ThreadListFilter,
  ThreadListWebComponentEvents,
} from '@cord-sdk/types';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import { useCustomEventListeners } from '../hooks/useCustomEventListener.js';
import { useCordLocation } from '../hooks/useCordLocation.js';
import type {
  PropsWithFlags,
  PropsWithRef,
  ReactPropsWithLocation,
  ReactPropsWithStandardHTMLAttributes,
} from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.ThreadList,
);

export type ThreadListReactComponentProps = PropsWithFlags<
  ReactPropsWithLocation<{
    showScreenshotPreviewInMessage?: boolean;
    highlightOpenFloatingThread?: boolean;
    highlightThreadId?: string;
    filter?: Omit<ThreadListFilter, 'resolvedStatus'>;
    showPlaceholder?: boolean;
    partialMatch?: boolean;
    onThreadClick?: (
      ...args: ThreadListWebComponentEvents['threadclick']
    ) => unknown;
    onThreadMouseEnter?: (
      ...args: ThreadListWebComponentEvents['threadmouseenter']
    ) => unknown;
    onThreadMouseLeave?: (
      ...args: ThreadListWebComponentEvents['threadmouseleave']
    ) => unknown;
    onThreadResolve?: (
      ...args: ThreadListWebComponentEvents['threadresolve']
    ) => unknown;
    onThreadReopen?: (
      ...args: ThreadListWebComponentEvents['threadreopen']
    ) => unknown;
    onRender?: (...args: ThreadListWebComponentEvents['render']) => unknown;
    onLoading?: (...args: ThreadListWebComponentEvents['loading']) => unknown;
  }>
>;

export function ThreadList(
  props: PropsWithRef<
    ReactPropsWithStandardHTMLAttributes<ThreadListReactComponentProps>
  >,
) {
  const [setRef, listenersAttached] =
    useCustomEventListeners<ThreadListWebComponentEvents>({
      threadclick: props.onThreadClick,
      threadmouseenter: props.onThreadMouseEnter,
      threadmouseleave: props.onThreadMouseLeave,
      threadresolve: props.onThreadResolve,
      threadreopen: props.onThreadReopen,
      loading: props.onLoading,
      render: props.onRender,
    });
  const combinedSetRef = useCallback(
    (element: any) => {
      if (props.forwardRef) {
        props.forwardRef.current = element;
      }
      setRef(element);
    },
    [props.forwardRef, setRef],
  );

  const location = useCordLocation();

  return (
    <cord-thread-list
      id={props.id}
      class={props.className}
      style={props.style}
      ref={combinedSetRef}
      use-shadow-root={props.useShadowRoot ? 'true' : 'false'}
      buffer-events={!listenersAttached ? 'true' : 'false'}
      {...propsToAttributes({ location, ...props })}
    />
  );
}
