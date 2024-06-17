import { componentAttributes } from '@cord-sdk/components';
import type { ReactionsReactComponentProps } from '@cord-sdk/react';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import Reactions from 'sdk/client/core/react/Reactions.tsx';

export class ReactionsWebComponent extends CordComponent(
  componentAttributes.Reactions,
)<ReactionsReactComponentProps> {
  canOptInShadow = false;
  render() {
    // Not throwing any errors to allow rendering a disabled version of the component.
    const threadId = this.props.threadId;
    const messageId = this.props.messageId;

    const props = { ...this.props, threadId, messageId };
    return <Reactions {...props} />;
  }
}
