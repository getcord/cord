import { componentAttributes } from '@cord-sdk/components';
import type { ThreadListReactComponentProps } from '@cord-sdk/react';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import ThreadList from 'sdk/client/core/react/ThreadList.tsx';

export class ThreadListWebComponent extends CordComponent(
  componentAttributes.ThreadList,
)<ThreadListReactComponentProps> {
  eventListeners = {
    onThreadClick: this.customEventDispatcher('threadclick'),
    onThreadMouseEnter: this.customEventDispatcher('threadmouseenter'),
    onThreadMouseLeave: this.customEventDispatcher('threadmouseleave'),
    onThreadResolve: this.customEventDispatcher('threadresolve'),
    onThreadReopen: this.customEventDispatcher('threadreopen'),
    onRender: this.customEventDispatcher('render'),
    onLoading: this.customEventDispatcher('loading'),
  };

  render() {
    return <ThreadList {...this.props} {...this.eventListeners} />;
  }
}
