import { useEffect, useRef } from 'react';
import { useLogger } from 'external/src/logging/useLogger.ts';
import type { ICordComponent } from 'sdk/client/core/components/index.tsx';
import { cssVariableFallbacks } from 'common/ui/cssVariables.ts';

// This hook logs if customers set our custom CSS variables on their components
// There is a bug in Chromium that means getComputedStyle does not return custom
// CSS variables, hence the need to loop over the full list we define.
// See https://bugs.chromium.org/p/chromium/issues/detail?id=949807

export function useLogCssVars(components: ICordComponent[]) {
  const { logDebug } = useLogger();
  const haveAlreadyLogged = useRef<Set<ICordComponent>>(new Set());

  useEffect(() => {
    for (const component of components) {
      if (haveAlreadyLogged.current.has(component)) {
        continue;
      }
      haveAlreadyLogged.current.add(component);
      const definedVariables: { [variable: string]: string } = {};
      const styles = getComputedStyle(component);
      for (const variable of Object.keys(cssVariableFallbacks)) {
        const value = styles.getPropertyValue(`--cord-${variable}`);
        if (value !== '') {
          definedVariables[variable] = value;
        }
      }
      logDebug('cord-css-vars-set', {
        component: component.nodeName,
        definedVariables,
      });
    }
  }, [components, logDebug]);
}
