import type { AvatarReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import { Avatar } from 'sdk/client/core/react/Avatar.tsx';

export class AvatarWebComponent extends CordComponent(
  componentAttributes.Avatar,
)<AvatarReactComponentProps> {
  canOptInShadow = false;

  render() {
    const userId = this.props.userId;
    if (!userId) {
      throw new Error('non-empty user-id must be provided');
    }
    const props = { ...this.props, userId };
    return <Avatar {...props} />;
  }
}
