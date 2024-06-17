import type { FloatingThreadsReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import FloatingThreads from 'sdk/client/core/react/FloatingThreads.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import type {
  HTMLCordFloatingThreadsElement,
  HTMLCordFloatingThreadsFunctions,
} from '@cord-sdk/types';
import { ScreenshotConfigurable } from 'sdk/client/core/mixins.tsx';

export class FloatingThreadsWebComponent
  extends ScreenshotConfigurable<FloatingThreadsReactComponentProps>(
    CordComponent(componentAttributes.FloatingThreads),
  )
  implements HTMLCordFloatingThreadsElement
{
  eventListeners = {
    onClick: this.customEventDispatcher('click'),
    onStart: this.customEventDispatcher('start'),
    onFinish: this.customEventDispatcher('finish'),
    onCancel: this.customEventDispatcher('cancel'),
  };

  public createThread() {
    // Will be replaced via _setExternalFunction
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public openThread(threadId: string) {
    // Will be replaced via _setExternalFunction
  }

  public cancelThread() {
    // Will be replaced via _setExternalFunction
  }

  _setExternalFunction<T extends keyof HTMLCordFloatingThreadsFunctions>(
    x: T,
    fn: HTMLCordFloatingThreadsFunctions[T],
  ) {
    (this as HTMLCordFloatingThreadsFunctions)[x] = fn;
  }

  render() {
    const props = {
      ...this.props,
      screenshotConfig: this._screenshotConfig,
    };

    return (
      <FloatingThreads thisElement={this} {...props} {...this.eventListeners} />
    );
  }
}
