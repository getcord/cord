import type { SidebarReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import type {
  HTMLCordSidebarElement,
  HTMLCordSidebarFunctions,
} from '@cord-sdk/types';
import Sidebar from 'sdk/client/core/react/Sidebar.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import { ScreenshotConfigurable } from 'sdk/client/core/mixins.tsx';

export class SidebarWebComponent
  extends ScreenshotConfigurable<SidebarReactComponentProps>(
    CordComponent(componentAttributes.Sidebar),
  )
  implements HTMLCordSidebarElement
{
  eventListeners = {
    onOpen: this.customEventDispatcher('open'),
    onClose: this.customEventDispatcher('close'),
    onThreadOpen: this.customEventDispatcher('threadopen'),
    onThreadClose: this.customEventDispatcher('threadclose'),
  };
  targetElement = this;

  public startComposer() {
    // Will be replaced via _setExternalFunction
  }

  _setExternalFunction<T extends keyof HTMLCordSidebarFunctions>(
    x: T,
    fn: HTMLCordSidebarFunctions[T],
  ) {
    (this as HTMLCordSidebarFunctions)[x] = fn;
  }

  render() {
    const props = {
      ...this.props,
      screenshotConfig: this._screenshotConfig,
    };

    return <Sidebar {...props} {...this.eventListeners} />;
  }
}
