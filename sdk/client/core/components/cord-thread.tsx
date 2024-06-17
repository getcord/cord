import type { ThreadReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import { CordComponent } from 'sdk/client/core/components/index.tsx';
import Thread from 'sdk/client/core/react/Thread.tsx';
import type { HTMLCordThreadElement } from '@cord-sdk/types';
import { ScreenshotConfigurable } from 'sdk/client/core/mixins.tsx';

export class ThreadWebComponent
  extends ScreenshotConfigurable<ThreadReactComponentProps>(
    CordComponent(componentAttributes.Thread),
  )
  implements HTMLCordThreadElement
{
  eventListeners = {
    onThreadInfoChange: this.customEventDispatcher('threadinfochange'),
    onClose: this.customEventDispatcher('close'),
    onResolved: this.customEventDispatcher('resolved'),
    onRender: this.customEventDispatcher('render'),
    onLoading: this.customEventDispatcher('loading'),
  };

  render() {
    const threadId = this.props.threadId;
    if (!threadId) {
      throw new Error('non-empty threadId must be provided');
    }

    const props = {
      ...this.props,
      threadId,
      screenshotConfig: this._screenshotConfig,
    };

    return <Thread {...props} {...this.eventListeners} />;
  }
}
