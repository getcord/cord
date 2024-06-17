import type { PinReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import { CordComponent } from 'sdk/client/core/components/index.tsx';
import Pin from 'sdk/client/core/react/Pin.tsx';

export class PinWebComponent extends CordComponent(
  componentAttributes.Pin,
)<PinReactComponentProps> {
  eventListeners = {
    onResolve: this.customEventDispatcher('resolve'),
    onClick: this.customEventDispatcher('click'),
    onMouseEnter: this.customEventDispatcher('mouseenter'),
    onMouseLeave: this.customEventDispatcher('mouseleave'),
  };
  canOptInShadow = false;

  render() {
    const threadId = this.props.threadId;
    if (!threadId) {
      throw new Error('non-empty threadId must be provided');
    }
    const props = { ...this.props, threadId };
    return <Pin {...props} {...this.eventListeners} />;
  }
}
