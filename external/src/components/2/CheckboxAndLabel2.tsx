import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Label2 } from 'external/src/components/ui2/Label2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  checkboxAndLabel: {
    alignItems: 'center',
    display: 'flex',
    margin: `calc(${cssVar('space-xs')}/2)px 0`,
    position: 'relative',
    width: '100%',
    gap: cssVar('space-2xs'),
  },
  checkboxSize: {
    cursor: 'pointer',
    height: cssVar('space-m'),
    width: cssVar('space-m'),
  },
  checkbox: {
    appearance: 'none',
    background: cssVar('color-base'),
    border: `1px solid ${cssVar('color-content-primary')}`,
    borderRadius: cssVar('border-radius-small'),
    margin: '0',
    '&:checked': {
      color: cssVar('color-base-strong'),
    },
  },
  tick: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});

type Label = {
  label: string;
};

type AriaLabel = {
  ariaLabel: string;
};

type Props = {
  value?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
  checked?: boolean;
} & (Label | AriaLabel);

export function CheckboxAndLabel2(props: React.PropsWithChildren<Props>) {
  const classes = useStyles();
  const { value, onChange, checked } = props;
  let ariaLabel, label;

  if ('label' in props) {
    label = props.label;
  }

  if ('ariaLabel' in props) {
    ariaLabel = props.ariaLabel;
  }

  return (
    <div className={cx(classes.checkboxAndLabel)}>
      <input
        className={cx(classes.checkbox, classes.checkboxSize)}
        value={value}
        id={value}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        onClick={(event: React.MouseEvent<HTMLInputElement>) =>
          event.stopPropagation()
        }
      />
      {checked && (
        <Icon2
          name="Check"
          size="small"
          className={cx(classes.tick, classes.checkboxSize)}
          color="content-primary"
        />
      )}
      {label && (
        <Label2 htmlFor={value} color="content-emphasis">
          {label}
        </Label2>
      )}
    </div>
  );
}
