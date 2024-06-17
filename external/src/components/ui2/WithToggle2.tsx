import { useCallback, useState } from 'react';

import type { ColorVar } from 'common/ui/cssVariables.ts';
import { Toggle2 } from 'external/src/components/ui2/Toggle2.tsx';

interface CommonProps {
  collapsedLabel: string;
  expandedLabel: string;
  color?: ColorVar;
}

interface ControlledProps extends CommonProps {
  setExpanded: (expanded: boolean) => void;
  expanded: boolean;
}

interface UncontrolledProps extends CommonProps {
  initialState?: 'expanded' | 'collapsed';
}

type WithToggleProps = ControlledProps | UncontrolledProps;

export function WithToggle2(props: React.PropsWithChildren<WithToggleProps>) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(
    'initialState' in props ? props.initialState : false,
  );

  const controlled = 'expanded' in props && 'setExpanded' in props;

  const onClick = useCallback(() => {
    if (controlled) {
      props.setExpanded(!props.expanded);
    } else {
      setUncontrolledExpanded((prev) => !prev);
    }
  }, [controlled, props]);

  const expanded = Boolean(controlled ? props.expanded : uncontrolledExpanded);

  return (
    <>
      <Toggle2
        expandedLabel={props.expandedLabel}
        collapsedLabel={props.collapsedLabel}
        onClick={onClick}
        color={props.color}
        expanded={expanded}
      />
      {expanded && props.children}
    </>
  );
}
