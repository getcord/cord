import { componentAttributes } from '@cord-sdk/components';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import NotificationListLauncher from 'sdk/client/core/react/NotificationListLauncher.tsx';
import type { NotificationListLauncherReactComponentProps } from '@cord-sdk/react';

export class NotificationListLauncherWebComponent extends CordComponent(
  componentAttributes.NotificationListLauncher,
)<NotificationListLauncherReactComponentProps> {
  eventListeners = {
    onClick: this.customEventDispatcher('click'),
    onClickNotification: this.customEventDispatcher('click', {
      sourceComponentName: 'cord-notification',
    }),
  };
  targetElement = this;

  render() {
    return (
      <NotificationListLauncher {...this.props} {...this.eventListeners} />
    );
  }
}
