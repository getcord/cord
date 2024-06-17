import { componentAttributes } from '@cord-sdk/components';
import type { MessageReactComponentProps } from '@cord-sdk/react';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import Message from 'sdk/client/core/react/Message.tsx';

export class MessageWebComponent extends CordComponent(
  componentAttributes.Message,
)<MessageReactComponentProps> {
  canOptInShadow = false;
  eventListeners = {
    onClick: this.customEventDispatcher('click'),
    onMouseEnter: this.customEventDispatcher('mouseenter'),
    onMouseLeave: this.customEventDispatcher('mouseleave'),
    onThreadResolve: this.customEventDispatcher('threadresolve'),
    onThreadReopen: this.customEventDispatcher('threadreopen'),
  };

  render() {
    const threadId = this.props.threadId;
    if (!threadId) {
      throw new Error('non-empty thread-id must be provided');
    }
    const props = { ...this.props, threadId };
    return <Message {...props} {...this.eventListeners} />;
  }
}
