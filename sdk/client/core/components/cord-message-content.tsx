import { componentAttributes } from '@cord-sdk/components';
import type { MessageContentReactComponentProps } from '@cord-sdk/react';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import MessageContent from 'sdk/client/core/react/MessageContent.tsx';

export class MessageContentWebComponent extends CordComponent(
  componentAttributes.MessageContent,
)<MessageContentReactComponentProps> {
  canOptInShadow = false;

  render() {
    const props = { ...this.props, edited: Boolean(this.props.edited) };
    return <MessageContent {...props} />;
  }
}
