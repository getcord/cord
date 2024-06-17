import { componentAttributes } from '@cord-sdk/components';
import type { TimestampReactComponentProps } from '@cord-sdk/react';
import { CordComponent } from 'sdk/client/core/components/index.tsx';
import { Timestamp } from 'sdk/client/core/react/Timestamp.tsx';

export class TimestampWebComponent extends CordComponent(
  componentAttributes.Timestamp,
)<TimestampReactComponentProps> {
  canOptInShadow = false;
  render() {
    const props = { ...this.props };
    return <Timestamp {...props} />;
  }
}
