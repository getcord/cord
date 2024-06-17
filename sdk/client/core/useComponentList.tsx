import { useCallback, useRef, useState } from 'react';
import type { ICordComponent } from 'sdk/client/core/components/index.tsx';

/**
 * We need to track our components which come to us via connectedCallback etc,
 * which are outside of React. The naive approch of calling setComponents on
 * each of those calls ends up causing O(n^2) component renders, since if you
 * aren't currently in a render cycle, a setState synchronously causes a
 * rerender (and so we rerender O(n) components for each of the O(n)
 * connectedCallback calls you get when, e.g., rendering a list of individual
 * Message components).
 *
 * This hook keeps track of the list of components with a special add/remove
 * function, which use some ref gunk and setTimeout to batch things up before
 * actually calling a setState and causing a rerender.
 */
export function useComponentList(
  init: ICordComponent[],
): [
  ICordComponent[],
  (component: ICordComponent) => void,
  (component: ICordComponent) => void,
] {
  const componentSet = useRef(new Set(init));
  const updateScheduled = useRef(false);
  const [components, setComponents] = useState([...componentSet.current]);

  const doUpdate = useCallback(() => {
    updateScheduled.current = false;
    setComponents([...componentSet.current]);
  }, []);

  const maybeScheduleUpdate = useCallback(() => {
    if (updateScheduled.current) {
      return;
    }

    updateScheduled.current = true;
    setTimeout(doUpdate);
  }, [doUpdate]);

  const addComponent = useCallback(
    (component: ICordComponent) => {
      componentSet.current.add(component);
      maybeScheduleUpdate();
    },
    [maybeScheduleUpdate],
  );

  const deleteComponent = useCallback(
    (component: ICordComponent) => {
      componentSet.current.delete(component);
      maybeScheduleUpdate();
    },
    [maybeScheduleUpdate],
  );

  return [components, addComponent, deleteComponent];
}
