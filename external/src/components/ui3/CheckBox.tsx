import cx from 'classnames';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

import * as classes from 'external/src/components/ui3/Checkbox.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

type Props = {
  done: boolean;
  setDone?: (done: boolean, eventLogMethod?: string) => void;
};

export function CheckBox({ done, setDone }: Props) {
  return (
    <div
      className={cx(classes.checkBox, {
        [MODIFIERS.disabled]: !setDone,
      })}
      data-checked={done}
      onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        setDone?.(!done, 'checked-task');
      }}
    >
      {done && <Icon name="Check" />}
    </div>
  );
}
