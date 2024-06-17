import { componentAttributes } from '@cord-sdk/components';

import { CordComponent } from 'sdk/client/core/components/index.tsx';
import NotificationList from 'sdk/client/core/react/NotificationList.tsx';
import type { NotificationListReactComponentProps } from '@cord-sdk/react';

export class NotificationListWebComponent extends CordComponent(
  componentAttributes.NotificationList,
)<NotificationListReactComponentProps> {
  canOptInShadow = false;

  eventListeners = {
    onClickNotification: this.customEventDispatcher('click', {
      sourceComponentName: 'cord-notification',
    }),
  };

  render() {
    return <NotificationList {...this.props} {...this.eventListeners} />;
  }
}
