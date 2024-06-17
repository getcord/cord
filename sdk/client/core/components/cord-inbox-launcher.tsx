import type { InboxLauncherReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import InboxLauncher from 'sdk/client/core/react/InboxLauncher.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class InboxLauncherWebComponent extends CordComponent(
  componentAttributes.InboxLauncher,
)<InboxLauncherReactComponentProps> {
  eventListeners = {
    onClick: this.customEventDispatcher('click'),
  };

  render() {
    return <InboxLauncher {...this.props} {...this.eventListeners} />;
  }
}
