import * as React from 'react';
import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';

import type {
  ComposerWebComponentEvents,
  EntityMetadata,
  MessageWebComponentEvents,
  ScreenshotConfig,
  ThreadOptions,
  ThreadWebComponentEvents,
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

const propsToAttributes = propsToAttributeConverter(componentAttributes.Thread);

export type ThreadReactComponentProps = PropsWithFlags<
  ReactPropsWithLocation<{
    threadId: string;
    threadName?: string;
    metadata?: EntityMetadata;
    collapsed?: boolean;
    autofocus?: boolean;
    showHeader?: boolean;
    showPlaceholder?: boolean;
    composerExpanded?: boolean;
    composerDisabled?: boolean;
    threadOptions?: ThreadOptions;
    groupId?: string;
    onThreadInfoChange?: (
      ...args: ThreadWebComponentEvents['threadinfochange']
    ) => unknown;
    onClose?: (...args: ThreadWebComponentEvents['close']) => unknown;
    onResolved?: (...args: ThreadWebComponentEvents['resolved']) => unknown;
    onRender?: (...args: ThreadWebComponentEvents['render']) => unknown;
    onLoading?: (...args: ThreadWebComponentEvents['loading']) => unknown;
    onFocusComposer?: (...args: ComposerWebComponentEvents['focus']) => unknown;
    onBlurComposer?: (...args: ComposerWebComponentEvents['blur']) => unknown;
    onSend?: (...args: ComposerWebComponentEvents['send']) => unknown;
    onMessageEditStart?: (
      ...args: MessageWebComponentEvents['editstart']
    ) => unknown;
    onMessageEditEnd?: (
      ...args: MessageWebComponentEvents['editend']
    ) => unknown;
  }>
> & { screenshotConfig?: ScreenshotConfig };

export function Thread(
  props: PropsWithRef<
    PropsWithChildren<
      ReactPropsWithStandardHTMLAttributes<ThreadReactComponentProps>
    >
  >,
) {
  const [threadEventsListenerSetRef, threadListenersAttached] =
    useCustomEventListeners<ThreadWebComponentEvents>(
      {
        threadinfochange: props.onThreadInfoChange,
        close: props.onClose,
        resolved: props.onResolved,
        render: props.onRender,
        loading: props.onLoading,
      },
      'cord-thread',
    );

  const [messageEventsListenerSetRef, messageListenersAttached] =
    useCustomEventListeners<
      Pick<MessageWebComponentEvents, 'editstart' | 'editend'>
    >(
      {
        editstart: props.onMessageEditStart,
        editend: props.onMessageEditEnd,
      },
      'cord-message',
    );

  const [composerEventsListenerSetRef, composerListenersAttached] =
    useCustomEventListeners<ComposerWebComponentEvents>(
      {
        focus: props.onFocusComposer,
        blur: props.onBlurComposer,
        send: props.onSend,
        // Decision to not surface to Threads in favour of devs building their own threads if using
        // the composer component.
        threadreopen: undefined,
        close: undefined,
      },
      'cord-composer',
    );

  const combinedSetRef = useCallback(
    (element: any) => {
      if (props.forwardRef) {
        props.forwardRef.current = element;
      }

      if (element) {
        element.screenshotConfig = props.screenshotConfig;
      }

      threadEventsListenerSetRef(element);
      composerEventsListenerSetRef(element);
      messageEventsListenerSetRef(element);
    },
    [
      props.forwardRef,
      props.screenshotConfig,
      composerEventsListenerSetRef,
      threadEventsListenerSetRef,
      messageEventsListenerSetRef,
    ],
  );

  const location = useCordLocation();

  return (
    <cord-thread
      id={props.id}
      buffer-events={
        !threadListenersAttached ||
        !composerListenersAttached ||
        !messageListenersAttached
          ? 'true'
          : 'false'
      }
      class={props.className}
      style={props.style}
      ref={combinedSetRef}
      use-shadow-root={props.useShadowRoot ? 'true' : 'false'}
      {...propsToAttributes({ location, ...props })}
    >
      {props.children}
    </cord-thread>
  );
}
