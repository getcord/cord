import cx from 'classnames';

import { fontBodyEmphasis } from 'common/ui/atomicClasses/fonts.css.ts';
import * as classes from 'external/src/components/ui3/MenuNavigationItem.css.ts';
import { Button } from 'external/src/components/ui3/Button.tsx';

type Props = {
  label: string;
  onClick?: JSX.IntrinsicElements['button']['onClick'];
};

export function MenuNavigationItem({ label, onClick }: Props) {
  return (
    <li className={classes.menuNavigationItem}>
      <Button
        buttonAction="navigate-back"
        buttonType="secondary"
        icon="CaretLeft"
        onClick={onClick}
        size="small"
      />
      <p className={cx(fontBodyEmphasis, classes.label)}>{label}</p>
    </li>
  );
}
