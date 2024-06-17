import type { FacepileReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import { Facepile } from 'sdk/client/core/react/Facepile.tsx';

export class FacepileWebComponent extends CordComponent(
  componentAttributes.Facepile,
)<FacepileReactComponentProps> {
  canOptInShadow = false;

  render() {
    const users = this.props.users;
    if (!users) {
      throw new Error('non-null users array must be provided');
    }
    const props = { ...this.props, users };
    return <Facepile {...props} />;
  }
}
