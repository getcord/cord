import type { PresenceObserverReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import PresenceObserver from 'sdk/client/core/react/PresenceObserver.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class PresenceObserverWebComponent extends CordComponent(
  componentAttributes.PresenceObserver,
)<PresenceObserverReactComponentProps> {
  virtual = true;
  eventListeners = {
    onChange: this.customEventDispatcher('change'),
  };

  render() {
    return (
      <PresenceObserver
        {...this.props}
        {...this.eventListeners}
        element={this.props.observeDocument ? undefined : this}
      />
    );
  }
}
