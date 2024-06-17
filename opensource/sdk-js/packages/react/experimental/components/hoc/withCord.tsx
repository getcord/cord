import * as React from 'react'; // eslint-disable-line @typescript-eslint/consistent-type-imports

import { memo } from 'react';

import type { ComponentName } from '../replacements.js';
import withPortal from './withPortal.js';
import withErrorBoundary from './withErrorBoundary.js';
import withCordClassname from './withCordClassname.js';
import withReplacement from './withReplacement.js';
import withIDContext from './withIDContext.js';
// ⚠️ :worm: This should be imported after because of some cyclic deps.
// TODO fix
import withToast from './withToast.js';
import type { IDsGetterMap } from './withIDContext.js';

interface Props {
  children?: React.ReactNode;
}

// High Order Component (HOC) that adds what Cord needs.
/* @__NO_SIDE_EFFECTS__ */
export default function withCord<T extends Props = Props>(
  WrappedComponent: React.ComponentType<T>,
  componentName: ComponentName,
  IDsGetter: IDsGetterMap<Omit<T, 'children'>> = {},
) {
  const intermediateComponent = withPortal(
    withCordClassname(withErrorBoundary(withToast(WrappedComponent))),
  ) as React.ForwardRefExoticComponent<T>;

  const Component = memo(
    withReplacement(
      withIDContext<T>(intermediateComponent, IDsGetter),
      componentName,
    ),
  );

  Component.displayName = componentName;
  return Component;
}
