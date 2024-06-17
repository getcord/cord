import type { InboxReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import Inbox from 'sdk/client/core/react/Inbox.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class InboxWebComponent extends CordComponent(
  componentAttributes.Inbox,
)<InboxReactComponentProps> {
  eventListeners = {
    onCloseRequested: this.customEventDispatcher('closeRequested'),
  };
  targetElement = this;

  render() {
    return <Inbox {...this.props} {...this.eventListeners} />;
  }
}
