import type { PresenceFacepileReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import PresenceFacepile from 'sdk/client/core/react/PresenceFacepile.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class PresenceFacepileWebComponent extends CordComponent(
  componentAttributes.PresenceFacepile,
)<PresenceFacepileReactComponentProps> {
  eventListeners = {
    onUpdate: this.customEventDispatcher('update'),
  };
  canOptInShadow = false;

  render() {
    return <PresenceFacepile {...this.props} {...this.eventListeners} />;
  }
}
