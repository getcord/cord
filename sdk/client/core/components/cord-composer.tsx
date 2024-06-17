import type { ComposerReactComponentProps } from '@cord-sdk/react';
import { componentAttributes } from '@cord-sdk/components';

import { CordComponent } from 'sdk/client/core/components/index.tsx';
import Composer from 'sdk/client/core/react/Composer.tsx';

export class ComposerWebComponent extends CordComponent(
  componentAttributes.Composer,
)<ComposerReactComponentProps> {
  canOptInShadow = false;

  render() {
    return <Composer {...this.props} />;
  }
}
