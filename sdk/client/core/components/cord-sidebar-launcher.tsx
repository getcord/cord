import type { SidebarLauncherReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import SidebarLauncher from 'sdk/client/core/react/SidebarLauncher.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class SidebarLauncherWebComponent extends CordComponent(
  componentAttributes.SidebarLauncher,
)<SidebarLauncherReactComponentProps> {
  eventListeners = {
    onClick: this.customEventDispatcher('click'),
  };

  render() {
    return <SidebarLauncher {...this.props} {...this.eventListeners} />;
  }
}
