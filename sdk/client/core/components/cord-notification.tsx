import { componentAttributes } from '@cord-sdk/components';
import type { NotificationReactComponentProps } from '@cord-sdk/react';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import Notification from 'sdk/client/core/react/Notification.tsx';

export class NotificationWebComponent extends CordComponent(
  componentAttributes.Notification,
)<NotificationReactComponentProps> {
  canOptInShadow = false;
  eventListeners = {
    onClick: this.customEventDispatcher('click'),
  };

  render() {
    const notificationId = this.props.notificationId;
    if (!notificationId) {
      throw new Error('non-empty notificationi-id must be provided');
    }
    const props = { ...this.props, notificationId };
    return <Notification {...props} {...this.eventListeners} />;
  }
}
