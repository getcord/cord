import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Colors } from 'common/const/Colors.ts';

type SwitchCodeButtonProps = {
  displayName: string;
  selected: boolean;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
};

const useStyles = createUseStyles({
  button: {
    backgroundColor: `${Colors.GREY_DARK}`,
    outline: 'none',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
    padding: '4px 16px',
    marginRight: 8,
  },
  expandButton: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    translate: '-50%',
    zIndex: 1,
  },
  buttonEnabled: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: `${Colors.GREY_LIGHT}`,
      color: '#000',
    },
  },
  enabledButtonSelected: {
    '&:hover': {
      backgroundColor: `${Colors.PURPLE_LIGHT}`,
    },
  },
  buttonSelected: {
    backgroundColor: `${Colors.PURPLE}`,
  },
});

function SwitchCodeButton({
  displayName,
  selected,
  value,
  onChange,
  disabled,
}: SwitchCodeButtonProps) {
  const classes = useStyles();

  const _onChange = useCallback(() => {
    onChange(value);
  }, [value, onChange]);
  return (
    <button
      className={cx(classes.button, {
        [classes.buttonSelected]: selected,
        [classes.buttonEnabled]: !disabled,
        [classes.enabledButtonSelected]: selected && !disabled,
      })}
      disabled={disabled}
      onClick={_onChange}
      type="button"
      data-search-ignore={true}
      data-cord-search-ignore={true}
    >
      {displayName}
    </button>
  );
}

export function ExpandCodeButton({
  onClick,
  clipped,
}: {
  clipped: boolean;
  onClick: () => void;
}) {
  const classes = useStyles();

  return (
    <button
      type="button"
      className={cx(classes.button, classes.expandButton, {
        [classes.buttonSelected]: true,
        [classes.buttonEnabled]: true,
        [classes.enabledButtonSelected]: true,
      })}
      onClick={onClick}
    >
      {clipped ? 'Expand code' : 'Collapse code'}
    </button>
  );
}
export default SwitchCodeButton;
