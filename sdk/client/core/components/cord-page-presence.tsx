import type { PagePresenceReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import PagePresence from 'sdk/client/core/react/PagePresence.tsx';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class PagePresenceWebComponent extends CordComponent(
  componentAttributes.PagePresence,
)<PagePresenceReactComponentProps> {
  eventListeners = {
    onUpdate: this.customEventDispatcher('update'),
  };

  render() {
    // TODO: this could be more elegant if it literally returned a combination
    // of two other web components, but it's not straightforward to do so right now
    // while also setting up the event listeners
    return <PagePresence {...this.props} {...this.eventListeners} />;
  }
}
