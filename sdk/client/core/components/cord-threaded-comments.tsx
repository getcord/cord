import { ThreadedComments } from '@cord-sdk/react';
import type { ThreadedCommentsReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';
import { CordComponent } from 'sdk/client/core/components/index.tsx';

export class ThreadedCommentsWebComponent extends CordComponent(
  componentAttributes.ThreadedComments,
)<ThreadedCommentsReactComponentProps> {
  eventListeners = {
    onMessageClick: this.customEventDispatcher('messageclick'),
    onMessageMouseEnter: this.customEventDispatcher('messagemouseenter'),
    onMessageMouseLeave: this.customEventDispatcher('messagemouseleave'),
    onMessageEditStart: this.customEventDispatcher('messageeditstart'),
    onMessageEditEnd: this.customEventDispatcher('messageeditend'),
    onThreadResolve: this.customEventDispatcher('threadresolve'),
    onThreadReopen: this.customEventDispatcher('threadreopen'),
    onRender: this.customEventDispatcher('render'),
    onLoading: this.customEventDispatcher('loading'),
  };

  canOptInShadow = false;

  render() {
    const location = this.props.location;
    if (!location) {
      throw new Error('cord-threaded-comments requires a location');
    }
    const props = { ...this.props, location };
    return <ThreadedComments {...props} {...this.eventListeners} />;
  }
}
